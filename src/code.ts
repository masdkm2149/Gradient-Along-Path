/**
 * Gradient Path Figma Plugin
 * 
 * Creates multi-color gradient strokes along vector paths by breaking the path into
 * discrete segments and applying different solid colors to each segment.
 * 
 * Features:
 * - SVG path parsing and point sampling
 * - Color interpolation with transparency support
 * - Custom stroke caps and joins
 * - Intelligent gradient updates
 */

let currentUiWidth = 258; // Example: Replace with your actual stored width
let currentUiHeight = 400; // Example: Replace with your actual stored height

// Sets the initial size of the plugin window.
figma.showUI(__html__, { width: currentUiWidth, height: currentUiHeight });

// --- Type Definitions ---
import { GradientStop } from './gradientTypes';
// --- Global State Variables ---
import { setCurrentStops, getCurrentStops } from './globalStateVariables';
// --- UI Communication ---
import { markUIReady, setupSelectionListeners, safeUpdateSelectionState } from './safeStateUpdate';
// --- Output Handlers ---
import { handleOutputMessage } from './outputHandler';

markUIReady(); // Mark UI as ready immediately after showing it
setupSelectionListeners(); // Setup selection listeners (safe even if called before UI is ready)

/**
 * Handles messages received from the UI (ui.html).
 */
figma.ui.onmessage = (msg: {
    type: string; // Message type identifier.
    // Optional payloads based on message type:
    width?: number; // Width for resizing the UI.
    height?: number; // Height for resizing the UI.
    strokeWeight?: string;
    startCap?: StrokeCap;
    endCap?: StrokeCap;
    strokeJoin?: StrokeJoin;
    stops?: GradientStop[]; // Array of stops from UI.
    stopId?: string;        // ID of a specific stop.
    stopData?: GradientStop;// Data for a single stop being added/updated.
    keyCode?: number;       // Key code for keyboard events.
    selectedStopId?: string;// ID of stop selected in UI (for delete key).
}) => {
    switch (msg.type) {
        case 'preview-gradient': { // Handle UI previews (if implemented).
            if (msg.stops) {
                setCurrentStops([...msg.stops]);
                // Send back confirmation or updated data if needed.
                figma.ui.postMessage({ type: 'preview-updated', stops: getCurrentStops });
            }
            break;
        }
        case 'delete-stop': { // UI requests to delete a stop.
            if (msg.stopId) {
                const initialLength = getCurrentStops.length;
                const stopToDelete = getCurrentStops().find(stop => stop.id === msg.stopId);
                 // Prevent deleting endpoints.
                 if (stopToDelete && stopToDelete.isEndpoint) {
                     figma.notify("Cannot delete start or end stops.");
                     return;
                 }
                const newStops = getCurrentStops().filter(stop => stop.id !== msg.stopId);
                // Allow deletion only if it doesn't go below 2 stops.
                if (newStops.length >= 2) {
                    setCurrentStops(newStops);
                    getCurrentStops().sort((a, b) => a.position - b.position); // Keep sorted.

                    figma.ui.postMessage({ type: 'stops-updated', stops: getCurrentStops(), deletedStopId: msg.stopId });
                } else if (initialLength >= 2) {
                    figma.notify("Can't delete stop: minimum 2 stops required");
                }
            }
            break;
        }
        case 'update-stop': { // UI panel updates a stop's data.
            if (msg.stopData && msg.stopData.id) {
                const stopIndex = getCurrentStops().findIndex(stop => stop.id === msg.stopData?.id);
                if (stopIndex !== -1) {
                     // Validate and clamp data before updating.
                     msg.stopData.position = Math.max(0, Math.min(100, msg.stopData.position || 0));
                     msg.stopData.alpha = Math.max(0, Math.min(1, msg.stopData.alpha !== undefined ? msg.stopData.alpha : 1));
                     getCurrentStops()[stopIndex] = msg.stopData;
                    // Re-sort stops in case position changed.
                    getCurrentStops().sort((a, b) => a.position - b.position);
                    // Send the updated, sorted array back to the UI.
                    figma.ui.postMessage({ type: 'stops-updated', stops: getCurrentStops() });
                }
            }
            break;
        }
         case 'add-stop': { // UI requests to add a new stop (e.g., button click).
             if (msg.stopData) { // Expecting position, color, alpha.
                 const newId = `stop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`; // Generate unique ID.
                 const newStop: GradientStop = {
                     id: newId,
                     position: Math.max(0, Math.min(100, msg.stopData.position || 50)), // Clamp position.
                     color: msg.stopData.color || '#808080', // Default color.
                     alpha: Math.max(0, Math.min(1, msg.stopData.alpha !== undefined ? msg.stopData.alpha : 1)), // Clamp alpha.
                     isEndpoint: false // Newly added stops are never endpoints.
                 };
                 getCurrentStops().push(newStop);
                 getCurrentStops().sort((a, b) => a.position - b.position); // Keep sorted.
                 // Inform UI about the new stop and its ID.
                 figma.ui.postMessage({ type: 'stops-updated', stops: getCurrentStops(), addedStopId: newId });
                }
             break;
         }
        case 'handle-key-press': { // Keyboard event from UI (e.g., delete key).
            if ((msg.keyCode === 46 || msg.keyCode === 8) && msg.selectedStopId) { // Delete or Backspace.
                 const stopToDelete = getCurrentStops().find(stop => stop.id === msg.selectedStopId);
                 // Prevent deleting endpoints via keyboard.
                 if (stopToDelete && !stopToDelete.isEndpoint) {
                     const initialLength = getCurrentStops().length;
                     const newStops = getCurrentStops().filter(stop => stop.id !== msg.selectedStopId);
                     if (newStops.length >= 2) {
                        setCurrentStops(newStops);
                        getCurrentStops().sort((a, b) => a.position - b.position); // Keep sorted.
                         // Inform UI about the change.
                         figma.ui.postMessage({ type: 'stops-updated', stops: getCurrentStops(), deletedStopId: msg.selectedStopId });
                     } else if (initialLength >= 2) {
                         figma.notify("Can't delete stop: minimum 2 stops required");
                     }
                 } else if (stopToDelete && stopToDelete.isEndpoint) {
                     figma.notify("Cannot delete start or end stops.");
                 }
            }
            break;
        }
        case 'select-stop': { // UI informs plugin which stop is selected.
            // No action needed in plugin code for this message anymore.
            break;
        }
        case 'check-selection': { // UI requests a manual selection state update.
            safeUpdateSelectionState();
            break;
        }
        case 'apply-vector': 
        case 'apply-image': {
            // Forward these output-related messages to the outputHandler
            handleOutputMessage(msg);
            break;
        }
        case 'resize': {         
            let targetWidth = msg.width? msg.width : 0;
            let targetHeight = msg.height? msg.height : 0;
            let shouldResize = false;
            const widthProvided = typeof targetWidth === 'number' && targetWidth > 0; // Check if width is a valid number and greater than 0
            const heightProvided = typeof targetHeight === 'number' && targetHeight > 0; // Check if height is a valid number and greater than 0

            if (widthProvided && heightProvided) {
            // Case 1: Both width and height are provided and valid
                console.log("Resizing UI (both) to:", targetWidth, targetHeight);
                shouldResize = true;
            } else if (widthProvided && !heightProvided) {
            // Case 2: Only width is provided and valid
                targetHeight = currentUiHeight; // Use the stored current height
                console.log("Resizing UI (width only) to:", targetWidth, targetHeight, `(using current height: ${currentUiHeight})`);
                shouldResize = true;
            } else if (!widthProvided && heightProvided) {
            // Case 3: Only height is provided and valid
                targetWidth = currentUiWidth; // Use the stored current width
                console.log("Resizing UI (height only) to:", targetWidth, targetHeight, `(using current width: ${currentUiWidth})`);
                shouldResize = true;
            } else {
            // Case 4: Neither provided, or invalid values (e.g., 0, negative)
                console.log("Resize message received without valid width or height. No resize performed.", msg);
        }

        if (shouldResize) {
            figma.ui.resize(targetWidth as number, targetHeight as number); // Perform the resize
            currentUiWidth = targetWidth; // Update the stored width
            currentUiHeight = targetHeight; // Update the stored height
            }
        }
        break;
        // Add other message handlers as needed.
    }
};
