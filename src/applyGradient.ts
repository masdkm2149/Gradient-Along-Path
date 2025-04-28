/**
 * Applies the gradient to the selected vector or updates an existing gradient group
 * using a luminance mask for transparency.
 * @param stops - Array of GradientStop objects.
 * @param strokeWeight - Stroke weight for the gradient path.
 * @param startCap - Stroke cap for the start of the path.
 * @param endCap - Stroke cap for the end of the path.
 * @param strokeJoin - Stroke join style.
 */

// --- Type Definitions ---
import { GradientStop } from './gradientTypes';
// --- Global State Variables ---
import { setCurrentGradientGroup, setSourceVector, getCurrentGradientGroup, getSourceVector } from './globalStateVariables';
// --- UI Communication ---
import { updateSelectionState } from './updateStateSelection';
// --- Alpha Channel Check ---
import { areAllStopsOpaque } from './areAllStopsOpaque';
// --- Path Data Extraction ---
import { getPointsAlongPath, createGradientPath } from './createGradientPath';

export async function applyGradient(stops: GradientStop[], strokeWeight: number, startCap: StrokeCap, endCap: StrokeCap, strokeJoin: StrokeJoin): Promise<GroupNode | null> {
    // Determine the target node and source path data.
    let vectorPaths: ReadonlyArray<VectorPath> | null = null;
    let vectorPosition = { x: 0, y: 0 };
    let parentFrame: BaseNode & ChildrenMixin = figma.currentPage;
    let isUpdate = false; // Flag to indicate if we are updating an existing group

    // Check if all stops are fully opaque
    const isFullyOpaque = areAllStopsOpaque(stops);
    console.log(`Gradient is ${isFullyOpaque ? 'fully opaque' : 'has transparency'}`);

    // Same selection logic as before...
    if (getCurrentGradientGroup() && getCurrentGradientGroup()?.children && getCurrentGradientGroup()!.children.length > 0) {
        // Find the first suitable vector node within the group or its subgroups
        let templateVector: VectorNode | null = null;
        const findVectorRecursive = (node: SceneNode): VectorNode | null => {
            if (node.type === 'VECTOR') return node;
            if ('children' in node) {
                for (const child of node.children) {
                    const found = findVectorRecursive(child);
                    if (found) return found;
                }
            }
            return null;
        };
        templateVector = findVectorRecursive(getCurrentGradientGroup()!);

        if (templateVector) {
            vectorPaths = templateVector.vectorPaths;
            vectorPosition = { x: getCurrentGradientGroup()!.x, y: getCurrentGradientGroup()!.y };
            if (getCurrentGradientGroup()?.parent && 'children' in getCurrentGradientGroup()!.parent!) {
                parentFrame = getCurrentGradientGroup()?.parent as BaseNode & ChildrenMixin;
            }
            console.log("Updating existing gradient group. Using template vector:", templateVector.name);
            isUpdate = true;
        } else {
            console.warn("Could not find a template vector within the selected group.");
            if (!getSourceVector()) {
                figma.notify('Could not find path data in the selected group. Select the original path or a valid group.');
                return null; // Return null on early exit
            }
            vectorPaths = getSourceVector()!.vectorPaths;
            vectorPosition = { x: getSourceVector()!.x, y: getSourceVector()!.y };
            if (getSourceVector()!.parent && 'children' in getSourceVector()!.parent!) {
                parentFrame = getSourceVector()!.parent as BaseNode & ChildrenMixin;
            }
            console.log("Applying gradient to source vector (fallback):", getSourceVector()!.name);
            isUpdate = false;
        }
    }
    else if (getSourceVector()) {
        vectorPaths = getSourceVector()!.vectorPaths;
        vectorPosition = { x: getSourceVector()!.x, y: getSourceVector()!.y };
        if (getSourceVector()!.parent && 'children' in getSourceVector()!.parent!) {
            parentFrame = getSourceVector()!.parent as BaseNode & ChildrenMixin;
        }
        console.log("Applying gradient to source vector:", getSourceVector()!.name);
        isUpdate = false;
    }

    // Final check if we have path data
    if (!vectorPaths || vectorPaths.length === 0 || !vectorPaths[0].data) {
        figma.notify('No valid path data found. Please select a vector path or a previously created gradient group.');
        return null; // Return null on early exit
    }

    // --- Perform Gradient Creation ---
    try {
        const samplingDensity = 50;
        const { points, totalLength } = getPointsAlongPath(vectorPaths, samplingDensity);

        if (points.length < 2) {
            figma.notify('Not enough points generated from path data. Check path complexity.');
            return null; // Return null on early exit
        }

        // Create the color and mask segment nodes.
        const { colorSegments, maskSegments } = await createGradientPath(
            points, totalLength, stops, strokeWeight, startCap, endCap, strokeJoin
        );
        if (colorSegments.length === 0) {
            figma.notify('No valid segments were created. Check path data and parameters.');
            return null; // Return null on early exit
        }

        let finalGroup: GroupNode;

        // --- Update Figma Scene ---
        if (isUpdate && getCurrentGradientGroup()) {
            // --- Update Existing Group ---
            console.log(`Updating group ${getCurrentGradientGroup()!.id}. Removing old children...`);
            // Remove all existing children from the group.
            const numChildren = getCurrentGradientGroup()!.children.length;
            for (let i = numChildren - 1; i >= 0; i--) {
                getCurrentGradientGroup()!.children[i].remove(); // Simply remove the child
            }
            console.log("Old children removed.");
            if (isFullyOpaque) {
                // For fully opaque gradients, just add the color segments to the group
                // No need for a nested group structure or mask layer
                for (const segment of colorSegments) {
                    getCurrentGradientGroup()!.appendChild(segment);
                }
                getCurrentGradientGroup()!.name = 'Gradient Path (Opaque)'; // Ensure consistent naming
                setCurrentGradientGroup(getCurrentGradientGroup()); // Update state with the modified group
                console.log("Opaque gradient: Added color segments directly to group.");
            } else {
                // For transparent gradients, use the traditional color + mask approach
                const tempParent = figma.currentPage; // Use a temporary parent
                const colorGroup = figma.group(colorSegments, tempParent);
                colorGroup.name = "Color Layer";
                const maskGroup = figma.group(maskSegments, tempParent);
                maskGroup.name = "Mask Layer";
                maskGroup.isMask = true;
                maskGroup.maskType = 'LUMINANCE';

                // Now group the color and mask layers and append to the target parent
                const layers = [colorGroup, maskGroup];
                figma.group(layers, getCurrentGradientGroup()!); // Group into the existing gradient group
                getCurrentGradientGroup()!.name = 'Gradient Path'; // Ensure consistent naming
                setCurrentGradientGroup(getCurrentGradientGroup()); // Update state with the modified group
                console.log("Transparent gradient: Created color and mask layer groups.");
            }

            // Ensure group position is maintained
            getCurrentGradientGroup()!.x = vectorPosition.x;
            getCurrentGradientGroup()!.y = vectorPosition.y;
            // setCurrentGradientGroup(getCurrentGradientGroup()); // Already called above
            figma.notify(`Gradient updated with ${colorSegments.length} segments`);
            figma.currentPage.selection = [getCurrentGradientGroup()!]; // Select the updated group

            return getCurrentGradientGroup()!; // *** EXPLICIT RETURN ***

        } else {
            // --- Create New Group ---
            console.log("Creating new gradient group.");

            if (isFullyOpaque) {
                // For fully opaque gradients, create a simple group with just the color segments
                finalGroup = figma.group(colorSegments, parentFrame);
                finalGroup.name = 'Gradient Path (Opaque)'; // Ensure consistent naming
                console.log("Created simple opaque gradient group.");
            } else {
                // For transparent gradients, use the traditional approach with mask layer
                const tempParent = figma.currentPage; // Use a temporary parent
                const maskGroup = figma.group(maskSegments, tempParent);
                maskGroup.name = "Mask Layer";
                maskGroup.isMask = true;
                maskGroup.maskType = 'LUMINANCE';

                const colorGroup = figma.group(colorSegments, tempParent);
                colorGroup.name = "Color Layer";

                finalGroup = figma.group([colorGroup, maskGroup], parentFrame);
                finalGroup.name = 'Gradient Path'; // Ensure consistent naming
                console.log("Created gradient group with transparency mask.");
            }

            // Position the new group at the original vector's location.
            finalGroup.x = vectorPosition.x;
            finalGroup.y = vectorPosition.y;
            console.log(`Final group positioned at ${vectorPosition.x}, ${vectorPosition.y}`);

            // Update state to reflect the new group.
            setCurrentGradientGroup(finalGroup);
            figma.currentPage.selection = [finalGroup];
            figma.notify(`Gradient applied with ${colorSegments.length} segments`);

            // Reset sourceVector after use, as selection usually changes to the group.
            setSourceVector(null);
            updateSelectionState(); // Refresh UI state based on new selection.
            return finalGroup; // *** EXPLICIT RETURN ***
            
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error applying gradient:', error);
        figma.notify('Error applying gradient: ' + errorMessage);
        return null; // *** EXPLICIT RETURN NULL ON ERROR ***
    }
}