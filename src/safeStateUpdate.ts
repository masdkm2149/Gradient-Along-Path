// --- State and UI Communication ---

/**
 * safeStateUpdate.ts
 * Updates the plugin's internal state (sourceVector, currentGradientGroup)
 * based on the current selection in the Figma document and notifies the UI.
**/

import { setSourceVector, getSourceVector, getCurrentGradientGroup, setCurrentGradientGroup } from "./globalStateVariables";

// Flag to track if UI is ready
let isUIReady = false;

// Function to mark UI as ready
export function markUIReady() {
  isUIReady = true;
  console.log("UI marked as ready, safe to send messages now");
}

// Safe version of updateSelectionState that won't crash if called before UI is ready
export function safeUpdateSelectionState(): void {
    // Initialize stateChanged at the beginning
    let stateChanged = false;
    
    const selection = figma.currentPage.selection;
    let newSourceVector: VectorNode | null = null;
    let newGradientGroup: GroupNode | null = null;

    // Analyze the single selected node, if any.
    if (selection.length === 1) {
        const selectedNode = selection[0];
        if (selectedNode.type === 'VECTOR') {
             // Identify as source vector only if it's not part of a known gradient group structure.
             const isLikelySource = !(selectedNode.parent && (selectedNode.parent.name === 'Gradient Path' || selectedNode.parent.name === 'Gradient Path (Opaque)'));
             if (isLikelySource) {
                newSourceVector = selectedNode as VectorNode;
             }
        } else if (selectedNode.type === 'GROUP') {
            // Check if it's a group created by this plugin
           
            if (selectedNode.name === 'Gradient Path (Opaque)' && selectedNode.children.length > 0) {
                // Case 1: Opaque Gradient Group (segments directly inside)
                // We just need to check the name and that it has children (the segments)
                newGradientGroup = selectedNode as GroupNode;

           } else if (selectedNode.name === 'Gradient Path' && selectedNode.children.length >= 2) {
                 const firstChild = selectedNode.children[0]; // Should be Color Layer
                 const secondChild = selectedNode.children[1]; // Should be Mask Layer
                 // Check if the structure matches the expected output
                 if (firstChild.type === 'GROUP' && firstChild.name === 'Color Layer' &&
                     secondChild.type === 'GROUP' && secondChild.name === 'Mask Layer' && secondChild.isMask && secondChild.maskType === 'LUMINANCE')
                 {
                      newGradientGroup = selectedNode as GroupNode;
                 }
            }
        }
    }

     // Determine if the relevant state actually changed.
     if (getSourceVector()?.id !== newSourceVector?.id) {
         setSourceVector(newSourceVector);
         stateChanged = true;
         console.log("Source Vector Changed:", getSourceVector()?.name);
         // If a new source vector is selected, clear the gradient group context.
         if (getSourceVector()) setCurrentGradientGroup(null);
     }
      if (getCurrentGradientGroup()?.id !== newGradientGroup?.id) {
         setCurrentGradientGroup(newGradientGroup);
         stateChanged = true;
         console.log("Gradient Group Changed:", getCurrentGradientGroup()?.name);
         // If a gradient group is selected, clear the source vector context.
         if (getCurrentGradientGroup()) setSourceVector(null);
     }

    // Only post message if state changed AND UI is ready
    if (stateChanged && isUIReady) {
        // Very safe way to send messages
        try {
            figma.ui.postMessage({
                type: 'selection-update',
                hasSelection: !!getSourceVector() || !!getCurrentGradientGroup(),
                isGradientGroup: !!getCurrentGradientGroup(),
            });
        } catch (error) {
            console.log("Error when trying to post message to UI:", error);
        }
    } else if (stateChanged && !isUIReady) {
        console.log("State changed but UI not ready, skipping message");
    }
}

// Function to set up event listeners 
export function setupSelectionListeners() {
    figma.on('selectionchange', () => {
        safeUpdateSelectionState();
    });
    
    // Initial update is fine to call, since our function is now safe
    safeUpdateSelectionState();
}