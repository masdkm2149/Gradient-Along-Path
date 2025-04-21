// --- Color Conversion and Interpolation ---

/**
 * Converts a hex color string (#RGB or #RRGGBB) to an RGB object.
 * @param hex - The hex color string.
 * @returns RGB object with values normalized between 0 and 1. Defaults to black if invalid.
 */

export function hexToRGB(hex: string): RGB {
    const defaultColor = "#000000";
    let hexColor = hex || defaultColor;
    hexColor = hexColor.replace('#', '');

    let r = 0, g = 0, b = 0;

    // Parse hex string (3 or 6 digits).
    if (hexColor.length === 3) {
        r = parseInt(hexColor[0] + hexColor[0], 16);
        g = parseInt(hexColor[1] + hexColor[1], 16);
        b = parseInt(hexColor[2] + hexColor[2], 16);
    } else if (hexColor.length === 6) {
        r = parseInt(hexColor.substring(0, 2), 16);
        g = parseInt(hexColor.substring(2, 4), 16);
        b = parseInt(hexColor.substring(4, 6), 16);
    }
    // Return normalized RGB values (0-1), clamped.
    return {
        r: Math.min(1, Math.max(0, r / 255)),
        g: Math.min(1, Math.max(0, g / 255)),
        b: Math.min(1, Math.max(0, b / 255))
     };
}

/**
 * Converts an alpha value (0-1) to a grayscale RGB object (0-1).
 * This is used for the luminance mask layer.
 * @param alpha - The alpha value (0-1).
 * @returns RGB object representing the grayscale value (r=g=b=alpha).
 */

export function alphaToGrayscaleRGB(alpha: number): RGB {
    // Clamp alpha between 0 and 1
    const clampedAlpha = Math.min(1, Math.max(0, alpha));
    // Grayscale value is the same for R, G, B
    return { r: clampedAlpha, g: clampedAlpha, b: clampedAlpha };
}


/**
 * Interpolates between two RGB colors with alpha values.
 * @param color1 - Start color hex string.
 * @param color2 - End color hex string.
 * @param factor - Interpolation factor (0 = color1, 1 = color2).
 * @param alpha1 - Start color alpha (0-1).
 * @param alpha2 - End color alpha (0-1).
 * @returns Interpolated RGBA color object (values 0-1).
 */

export function interpolateColor(
    color1: string,
    color2: string,
    factor: number,
    alpha1: number = 1, // Default alpha to 1 (opaque) if not provided
    alpha2: number = 1  // Default alpha to 1 (opaque) if not provided
): { r: number; g: number; b: number; a: number } {
    const rgb1 = hexToRGB(color1);
    const rgb2 = hexToRGB(color2);

    // Linear interpolation for each color channel and alpha.
    return {
        r: rgb1.r + (rgb2.r - rgb1.r) * factor,
        g: rgb1.g + (rgb2.g - rgb1.g) * factor,
        b: rgb1.b + (rgb2.b - rgb1.b) * factor,
        a: alpha1 + (alpha2 - alpha1) * factor,
    };
}

/**
 * Gets the interpolated color at a specific distance along the path based on gradient stops.
 * @param distance - The distance along the path.
 * @param totalLength - The total length of the path.
 * @param stops - Array of GradientStop objects defining the gradient.
 * @returns The calculated RGBA color object (values 0-1).
 */

// --- Type Definitions ---
import { GradientStop } from './gradientTypes';

export function getColorAtDistance(
    distance: number,
    totalLength: number,
    stops: GradientStop[]
): { r: number; g: number; b: number; a: number } {
    // Ensure stops are sorted by position for correct interpolation.
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);

    if (sortedStops.length === 0) return { r: 0, g: 0, b: 0, a: 1 }; // Default to black if no stops.
    if (sortedStops.length === 1) {
        const rgb = hexToRGB(sortedStops[0].color);
        // Use alpha if defined, otherwise default to 1 (opaque).
        return { ...rgb, a: sortedStops[0].alpha !== undefined ? sortedStops[0].alpha : 1 };
    }

    // Normalize distance to a percentage position (0-100).
    const normalizedPosition = totalLength > 0 ? (distance / totalLength) * 100 : 0;

    // Find the stops surrounding the normalized position.
    let startStop = sortedStops[0];
    let endStop = sortedStops[sortedStops.length - 1];

    // Handle cases where the position is before the first stop or after the last stop.
    if (normalizedPosition <= startStop.position) {
        const rgb = hexToRGB(startStop.color);
        return { ...rgb, a: startStop.alpha !== undefined ? startStop.alpha : 1 };
    }
    if (normalizedPosition >= endStop.position) {
        const rgb = hexToRGB(endStop.color);
        return { ...rgb, a: endStop.alpha !== undefined ? endStop.alpha : 1 };
    }

    // Find the two stops the position falls between.
    for (let i = 0; i < sortedStops.length - 1; i++) {
        if (sortedStops[i].position <= normalizedPosition && sortedStops[i + 1].position >= normalizedPosition) {
            startStop = sortedStops[i];
            endStop = sortedStops[i + 1];
            break;
        }
    }

    // Calculate interpolation factor between the start and end stops.
    const stopDistance = endStop.position - startStop.position;
    // If stops are at the same position, return the color of the end stop found.
    if (stopDistance <= 0) {
        const rgb = hexToRGB(endStop.color);
        return { ...rgb, a: endStop.alpha !== undefined ? endStop.alpha : 1 };
    }

    const factor = (normalizedPosition - startStop.position) / stopDistance;
    // Get alpha values, defaulting to 1 if not defined
    const startAlpha = startStop.alpha !== undefined ? startStop.alpha : 1;
    const endAlpha = endStop.alpha !== undefined ? endStop.alpha : 1;

    // Interpolate the color with alpha.
    return interpolateColor(startStop.color, endStop.color, factor, startAlpha, endAlpha);
}