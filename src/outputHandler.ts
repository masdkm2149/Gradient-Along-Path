// --- outputHandler.ts ---
// This file handles the output of gradients as either vector shapes or images.

// --- Gradient Application Logic ---
import { applyGradient } from './applyGradient';
// ---  Image Rendering Logic ---
import { renderAsImage } from './renderAsImage';
// --- Type Definitions ---
import { GradientStop } from './gradientTypes';
// --- Global State Variables ---
import { setCurrentStops, getCurrentStops } from './globalStateVariables';

/**
 * Handles the vector output button action - applies the gradient as vector segments
 * @param stops - Array of gradient stops
 * @param strokeWeight - Width of the stroke
 * @param startCap - Start cap style for the stroke
 * @param endCap - End cap style for the stroke
 * @param strokeJoin - Join style for the stroke segments
 */
export async function handleApplyVector(
    stops: GradientStop[],
    strokeWeight: number,
    startCap: StrokeCap,
    endCap: StrokeCap,
    strokeJoin: StrokeJoin
): Promise<void> {
    try {
        // Validate inputs
        if (stops.length < 2) {
            figma.notify('Error: Need at least two color stops');
            return;
        }

        // Apply the gradient with vector output
        await applyGradient(stops, strokeWeight, startCap, endCap, strokeJoin);
        
        // The applyGradient function already handles selection and notifications
        // But we can add a success message specific to vector output
        console.log('Vector gradient output completed.');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error in handleApplyVector:', errorMessage);
        figma.notify('Error applying vector gradient: ' + errorMessage);
    }
}

/**
 * Handles the image output button action - applies the gradient and then renders it as an image
 * @param stops - Array of gradient stops
 * @param strokeWeight - Width of the stroke
 * @param startCap - Start cap style for the stroke
 * @param endCap - End cap style for the stroke
 * @param strokeJoin - Join style for the stroke segments
 */
export async function handleApplyAndRenderImage(
    stops: GradientStop[],
    strokeWeight: number,  
    startCap: StrokeCap,
    endCap: StrokeCap,
    strokeJoin: StrokeJoin
): Promise<void> {
    try {
        // Validate inputs
        if (stops.length < 2) {
            figma.notify('Error: Need at least two color stops');
            return;
        }
        // Apply the gradient as vectors before getting the reference for group
        const gradientGroup = await applyGradient(stops, strokeWeight, startCap, endCap, strokeJoin);
        // Check if the gradient group was created successfully
        if (!gradientGroup) {
            figma.notify('Error: No gradient group found to render as image');
            return;
        }
        console.log('Gradient group after applying:', gradientGroup);
        console.log('Gradient group ID:', gradientGroup?.id);
        console.log('Gradient group dimensions:', gradientGroup?.width, 'x', gradientGroup?.height);
        // Add a small delay to ensure everything is applied
        await new Promise(resolve => setTimeout(resolve, 100));

        // Double-check that the node still exists in the document
        try {
            const nodeCheck = await figma.getNodeByIdAsync(gradientGroup.id);
            if (!nodeCheck) {
                figma.notify('Error: Gradient group no longer exists in the document');
            return;
            }
            // Now render that gradient group as an image
            await renderAsImage(nodeCheck as SceneNode, strokeWeight);
            console.log('Image gradient output completed.');
    
        } catch (nodeError) {
            console.error('Error accessing gradient node:', nodeError);
            figma.notify('Error: Cannot access gradient node - ' + String(nodeError));
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error in handleApplyAndRenderImage:', errorMessage);
        figma.notify('Error applying image gradient: ' + errorMessage);
    }
}

/**
 * Plugin message handler function that routes messages from UI to the appropriate handler
 * @param msg - The message object from the UI
 */
export function handleOutputMessage(msg: {
    type: string;
    stops?: GradientStop[];
    strokeWeight?: string;
    startCap?: StrokeCap;
    endCap?: StrokeCap;
    strokeJoin?: StrokeJoin;
}): void {
    // Extract common parameters
    const stops = msg.stops || getCurrentStops();
    setCurrentStops([...stops]); // Update local cache.
    if (stops.length < 2) {
        figma.notify('Error: Need at least two color stops');
        return;
    }

    // Ensure stops are sorted before applying.
    stops.sort((a, b) => a.position - b.position);

    const strokeWeight = parseFloat(msg.strokeWeight || '1');
    const startCap = msg.startCap || 'NONE';
    const endCap = msg.endCap || 'NONE';
    const strokeJoin = msg.strokeJoin || 'MITER';

    // Validate Stroke Caps
    const validCaps: StrokeCap[] = ['NONE', 'ROUND', 'SQUARE', 'ARROW_LINES', 'ARROW_EQUILATERAL'];
    const validatedStartCap = validCaps.indexOf(startCap as StrokeCap) !== -1 ? startCap : 'NONE';
    const validatedEndCap = validCaps.indexOf(endCap as StrokeCap) !== -1 ? endCap : 'NONE';
    
    // Validate Stroke Joins
    const validJoins: StrokeJoin[] = ['MITER', 'BEVEL', 'ROUND'];
    const validatedJoin = validJoins.indexOf(strokeJoin as StrokeJoin) !== -1 ? strokeJoin : 'MITER';
    
    // Route to appropriate handler based on message type
    switch (msg.type) {
        case 'apply-vector':
            handleApplyVector(stops, strokeWeight, validatedStartCap, validatedEndCap, validatedJoin);
            break;
            
        case 'apply-image':
            handleApplyAndRenderImage(stops, strokeWeight, validatedStartCap, validatedEndCap, validatedJoin);
            break;
            
        default:
            console.warn(`Unknown output type: ${msg.type}`);
            break;
    }
}