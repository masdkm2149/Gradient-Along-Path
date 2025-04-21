// --- State and UI Communication ---

/**
 * Updates the plugin's internal state (sourceVector, currentGradientGroup)
 * based on the current selection in the Figma document and notifies the UI.
 */

import { setSourceVector,getSourceVector,getCurrentGradientGroup,setCurrentGradientGroup } from "./globalStateVariables";

export function updateSelectionState(): void {
    const selection = figma.currentPage.selection;
    let newSourceVector: VectorNode | null = null;
    let newGradientGroup: GroupNode | null = null;

    // Analyze the single selected node, if any.
    if (selection.length === 1) {
        const selectedNode = selection[0];
        if (selectedNode.type === 'VECTOR') {
             // Identify as source vector only if it's not part of a known gradient group structure.
             // A simple check: is its parent *not* named 'Gradient Path'?
             const isLikelySource = !(selectedNode.parent && selectedNode.parent.name === 'Gradient Path');
             if (isLikelySource) {
                newSourceVector = selectedNode as VectorNode;
             }
        } else if (selectedNode.type === 'GROUP') {
            // Check if it's a group created by this plugin, matching the NEW structure:
            // Structure: Group("Gradient Path") -> [ Group("Color Layer"), Group("Mask Layer", isMask=true, maskType='LUMINANCE') ]
            if (selectedNode.name === 'Gradient Path' && selectedNode.children.length >= 2) {
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
     let stateChanged = false;
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

    // Only post message if state changed.
    // Send message to UI to update its state (e.g., enable/disable Apply button).
     if (stateChanged) {
         figma.ui.postMessage({
            type: 'selection-update',
            hasSelection: !!getSourceVector() || !!getCurrentGradientGroup(),
            isGradientGroup: !!getCurrentGradientGroup(),
             // TODO: Consider sending stop data here if a group is selected,
             // but extracting stops back from the segments is non-trivial.
             // For now, rely on the UI's state persistence.
        });
     }
}

// Listen for selection changes in Figma and update state accordingly.
figma.on('selectionchange', () => {
    updateSelectionState();
});

// Run initial state check when the plugin loads.
updateSelectionState();
