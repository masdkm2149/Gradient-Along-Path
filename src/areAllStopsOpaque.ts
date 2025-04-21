// --- areAllStopsOpaque.ts ---

/**
 * Checks if all gradient stops are fully opaque (alpha = 1).
 * @param stops - Array of GradientStop objects.
 * @returns Boolean indicating if all stops are fully opaque.
 */

import { GradientStop } from './gradientTypes';

export function areAllStopsOpaque(stops: GradientStop[]): boolean {
    return stops.every(stop => stop.alpha === undefined || stop.alpha === 1);
}

