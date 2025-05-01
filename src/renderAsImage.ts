// --- Render As An Image (Optimization) ---

/**
 * Renders a specific SceneNode (typically the output group from applyGradient)
 * as a PNG image, and then removes the original vector node.
 * @param sourceNode The specific vector SceneNode to render and then remove. Must be provided.
 */

export async function renderAsImage(sourceNode: SceneNode, strokeWeight: number = 0 ): Promise<void> {
    // --- Initial Checks ---
    if (!sourceNode || !sourceNode.id) {
        figma.notify("Error: Invalid or missing node provided for rendering.");
        console.error("renderAsImage called with invalid sourceNode:", sourceNode);
        return;
    }
    
    // Double-check that the node still exists and is valid
    try {
        const nodeCheck = await figma.getNodeByIdAsync(sourceNode.id);
        if (!nodeCheck) {
            figma.notify(`Error: Node "${sourceNode.name}" no longer exists in the document.`);
            console.error(`Node with ID ${sourceNode.id} no longer exists in the document.`);
            return;
        }
        
        // Use the freshly retrieved node reference
        sourceNode = nodeCheck as SceneNode;
    } catch (nodeError) {
        figma.notify(`Error accessing node: ${String(nodeError)}`);
        console.error('Error accessing node:', nodeError);
        return;
    }
    
    // Check dimensions
    if (typeof sourceNode.width !== 'number' || typeof sourceNode.height !== 'number' || 
        sourceNode.width <= 0 || sourceNode.height <= 0) {
        figma.notify(`Error: Cannot render node "${sourceNode.name}" with invalid dimensions (${sourceNode.width}x${sourceNode.height}).`);
        console.error(`renderAsImage: Node "${sourceNode.name}" (ID: ${sourceNode.id}) has invalid dimensions (${sourceNode.width}x${sourceNode.height})`);
        return;
    }

    // Store position and parent before potential removal
    const originalX = sourceNode.x;
    const originalY = sourceNode.y;
    const originalWidth = sourceNode.width;
    const originalHeight = sourceNode.height;
    const parent = sourceNode.parent || figma.currentPage; // Store parent

    // --- Scaling Logic ---
    const MAX_DIMENSION = 4096;
    const scale = Math.min(
      MAX_DIMENSION / sourceNode.width,
      MAX_DIMENSION / sourceNode.height,
      1
    );
    console.log(`Node dimensions: ${sourceNode.width}x${sourceNode.height}, Scale: ${scale}`);

    try {
        // --- Export ---
        const bytes = await sourceNode.exportAsync({
            format: "PNG",
            constraint: { type: "SCALE", value: scale },
            contentsOnly: true
        });
        console.log(`Exported ${bytes.length} bytes.`);

        // --- Create Image Rectangle ---
        const rect = figma.createRectangle();
        rect.name = `${sourceNode.name} (Rasterized)`;
        // Adjust both dimensions while maintaining the aspect ratio
        const adjustedWidth = originalWidth + strokeWeight;
        // Calculate the new height that preserves the aspect ratio
        const adjustedHeight = originalHeight + strokeWeight;
        // Resize the rectangle with the adjusted dimensions
        rect.resize(adjustedWidth, adjustedHeight);
        rect.x = originalX - strokeWeight/2; // Adjust X position to account for stroke weight
        rect.y = originalY - strokeWeight/2; // Adjust Y position to account for stroke weight

        const image = figma.createImage(bytes);
        rect.fills = [{
            type: "IMAGE",
            scaleMode: "FIT",
            imageHash: image.hash
        }];

        // --- Add Image Rectangle to Parent ---
         if ('appendChild' in parent) {
            parent.appendChild(rect);
        } else {
             figma.currentPage.appendChild(rect);
             console.warn("Could not append rasterized image to original parent, appended to page instead.");
        }
        console.log(`Image created successfully:(ID: ${rect.id})`);
        // --- Remove the Original Vector Node ---
        // This happens only AFTER the export and image creation are successful.
        try {
            // First check if the sourceNode is still accessible directly
            if (!sourceNode.removed) {
                try {
                    sourceNode.remove();
                    console.log(`Removed original vector group: ${sourceNode.name} (ID: ${sourceNode.id})`);
                } catch (directRemoveError) {
                    // If direct removal fails, try getting a fresh reference
                    console.log(`Direct removal failed, trying to get fresh node reference...`);
                    const finalNodeCheck = await figma.getNodeByIdAsync(sourceNode.id);
                    if (finalNodeCheck) {
                        finalNodeCheck.remove();
                        console.log(`Removed original vector group with fresh reference: ${sourceNode.name} (ID: ${sourceNode.id})`);
                    } else {
                        console.warn(`Node ${sourceNode.name} (ID: ${sourceNode.id}) was already removed or no longer exists.`);
                    }
                }
            } else {
                console.warn(`Node ${sourceNode.name} (ID: ${sourceNode.id}) was already marked as removed.`);
            }
        } catch (removeError) {
            // Don't make this an error, just a warning since the operation mostly succeeded
            console.warn('Could not remove original node, but image was created successfully:', removeError);
        }

        // --- Final Selection and Notification ---
        figma.currentPage.selection = [rect]; // Select the new image
        figma.notify("Image created successfully (Original vector removed)");

    } catch (err) {
         // --- Error Handling (same as before) ---
         const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes("EXPORT_FAILED") || errorMessage.includes("cannot export")) {
             figma.notify(`Error exporting node "${sourceNode.name}": ${errorMessage}. Original vector NOT removed.`);
        } else if (errorMessage.includes("too large")) {
             figma.notify(`Error: Exported image data is too large for node "${sourceNode.name}". Original vector NOT removed.`);
        }
        else {
            figma.notify("Error rendering image: " + errorMessage + ". Original vector NOT removed.");
        }
        console.error('Error rendering node as image:', err);
        // We do NOT remove the sourceNode if an error occurred during export/creation.
    }
}