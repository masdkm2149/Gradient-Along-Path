// --- Path Sampling and Geometry Calculations ---

// --- Alpha Channel Check ---
import { areAllStopsOpaque } from "./areAllStopsOpaque";
// --- Type Definitions ---
import { GradientStop, PathSegment } from './gradientTypes';
// --- Color Handling ---
import { alphaToGrayscaleRGB, getColorAtDistance } from './colorHandler';

// --- Point Calculations ---

/**
 * Calculates a point on a Bezier curve (cubic or quadratic) at parameter t.
 * @param t - Parameter value (0 to 1).
 * @param P0 - Start point.
 * @param P1 - First control point.
 * @param P2 - Second control point (for cubic) or end point (for quadratic).
 * @param P3 - End point (for cubic). Optional.
 * @returns The calculated point {x, y}.
 */

function calculateBezierPoint(
    t: number,
    P0: { x: number; y: number },
    P1: { x: number; y: number },
    P2: { x: number; y: number },
    P3?: { x: number; y: number } // P3 is optional for quadratic
): { x: number; y: number } {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;

    if (P3) { // Cubic Bezier
        const uuu = uu * u;
        const ttt = tt * t;
        const x = uuu * P0.x + 3 * uu * t * P1.x + 3 * u * tt * P2.x + ttt * P3.x;
        const y = uuu * P0.y + 3 * uu * t * P1.y + 3 * u * tt * P2.y + ttt * P3.y;
        return { x, y };
    } else { // Quadratic Bezier
        const x = uu * P0.x + 2 * u * t * P1.x + tt * P2.x;
        const y = uu * P0.y + 2 * u * t * P1.y + tt * P2.y;
        return { x, y };
    }
}

/**
 * Approximates the length of a Bezier curve by summing lengths of small line segments.
 * @param P0 - Start point.
 * @param P1 - First control point.
 * @param P2 - Second control point (for cubic) or end point (for quadratic).
 * @param P3 - End point (for cubic). Optional.
 * @returns The approximate length of the curve.
 */

function approximateBezierLength(
    P0: { x: number; y: number },
    P1: { x: number; y: number },
    P2: { x: number; y: number },
    P3?: { x: number; y: number } // P3 optional
): number {
    let length = 0;
    let prevPoint = P0;
    const steps = 100; // Number of segments for approximation. More steps = more accuracy, less performance.
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        // Pass P3 only if it exists (for cubic curves).
        const point = calculateBezierPoint(t, P0, P1, P2, P3);
        length += calculateDistance(prevPoint, point);
        prevPoint = point;
    }
    return length;
}

// --- Path Parsing ---

/**
 * Samples points along the parsed path segments to create a list of points.
 * Uses dynamic sampling density based on segment length for better distribution.
 * @param vectorPaths - Array of VectorPath objects from a Figma node.
 * @param samplesPerSegment - Base number of samples per segment (adjusted dynamically).
 * @returns Object containing an array of sampled points and the total calculated path length.
 */

export function getPointsAlongPath(
    vectorPaths: ReadonlyArray<VectorPath>,
    samplesPerSegment: number
): { points: { x: number; y: number }[]; totalLength: number; } {
    const points: { x: number; y: number }[] = [];
    let totalLength = 0;

    for (const vectorPath of vectorPaths) {
        // Parse the SVG data string for this specific path object.
        const parsedSegments = parsePathData(vectorPath.data);
        if (parsedSegments.length === 0) continue; // Skip if path is empty.

        let currentPoint = { x: 0, y: 0 }; // Initialize origin for calculations.

        for (let i = 0; i < parsedSegments.length; i++) {
            const segment = parsedSegments[i];

            if (segment.type === 'MOVE') {
                 currentPoint = { x: segment.x, y: segment.y };
                 // Add the move point only if it's the very first point of the path.
                 if (points.length === 0) {
                     points.push({...currentPoint}); // Use spread to create a copy.
                 }
            } else if (segment.type === 'LINE') {
                const endPoint = { x: segment.x, y: segment.y };
                const segmentLength = calculateDistance(currentPoint, endPoint);
                 // Add start point of the line if it wasn't the last point added.
                 if (points.length === 0 || points[points.length - 1].x !== currentPoint.x || points[points.length - 1].y !== currentPoint.y) {
                    points.push({...currentPoint});
                 }
                 // Calculate number of samples based on segment length relative to total length estimate.
                 const numSamples = Math.max(1, Math.ceil(segmentLength / (totalLength / samplesPerSegment || 5)));
                // Add intermediate points along the line.
                for (let j = 1; j <= numSamples; j++) {
                    const t = j / numSamples;
                    const x = currentPoint.x + (endPoint.x - currentPoint.x) * t;
                    const y = currentPoint.y + (endPoint.y - currentPoint.y) * t;
                    points.push({ x, y });
                }
                totalLength += segmentLength;
                currentPoint = endPoint; // Update current point for the next segment.
            } else if (segment.type === 'CUBIC') {
                const P0 = currentPoint;
                const P1 = { x: segment.x1, y: segment.y1 };
                const P2 = { x: segment.x2, y: segment.y2 };
                const P3 = { x: segment.x, y: segment.y };
                const curveLength = approximateBezierLength(P0, P1, P2, P3);
                 // Add start point if needed.
                 if (points.length === 0 || points[points.length - 1].x !== P0.x || points[points.length - 1].y !== P0.y) {
                    points.push({...P0});
                 }
                 // Dynamic sampling for curves.
                 const numSamples = Math.max(samplesPerSegment, Math.ceil(curveLength / (totalLength / samplesPerSegment || 5)));
                // Sample points along the cubic curve.
                for (let j = 1; j <= numSamples; j++) {
                    const t = j / numSamples;
                    const point = calculateBezierPoint(t, P0, P1, P2, P3);
                    points.push(point);
                }
                totalLength += curveLength;
                currentPoint = P3; // Update current point.
            } else if (segment.type === 'QUADRATIC') {
                const P0 = currentPoint;
                const P1 = { x: segment.x1, y: segment.y1 };
                const P2 = { x: segment.x, y: segment.y };
                 const curveLength = approximateBezierLength(P0, P1, P2);
                 // Add start point if needed.
                 if (points.length === 0 || points[points.length - 1].x !== P0.x || points[points.length - 1].y !== P0.y) {
                    points.push({...P0});
                 }
                 // Dynamic sampling for curves.
                 const numSamples = Math.max(samplesPerSegment, Math.ceil(curveLength / (totalLength / samplesPerSegment || 5)));
                // Sample points along the quadratic curve.
                for (let j = 1; j <= numSamples; j++) {
                    const t = j / numSamples;
                    const point = calculateBezierPoint(t, P0, P1, P2);
                    points.push(point);
                }
                totalLength += curveLength;
                currentPoint = P2; // Update current point.
            }
        }
    }
     // Remove consecutive duplicate points that might arise from sampling.
     const uniquePoints = points.filter((point, index, arr) => {
        if (index === 0) return true; // Always keep the first point.
        // Keep point if it's different from the previous one.
        return point.x !== arr[index - 1].x || point.y !== arr[index - 1].y;
    });

    return { points: uniquePoints, totalLength };
}

/**
 * Calculates the Euclidean distance between two points.
 * @param p1 - First point {x, y}.
 * @param p2 - Second point {x, y}.
 * @returns The distance.
 */

function calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Creates arrays of VectorNode segments for both color and mask layers.
 * Each segment is a short line. Color layer uses opaque gradient color.
 * Mask layer uses grayscale representing the gradient alpha (for luminance masking).
 * Applies the specified start and end caps to the first and last segments of *both* layers.
 * @param points - Array of points sampled along the path.
 * @param totalLength - Total length of the path.
 * @param stops - Array of GradientStop objects.
 * @param strokeWeight - The desired stroke weight for the segments.
 * @param startCap - Stroke cap style for the start of the path.
 * @param endCap - Stroke cap style for the end of the path.
 * @param strokeJoin - Stroke join style for connecting segments (visually).
 * @returns An object containing arrays of VectorNode objects for color and mask layers.
 */

export async function createGradientPath(
    points: { x: number; y: number }[],
    totalLength: number,
    stops: GradientStop[],
    strokeWeight: number,
    startCap: StrokeCap,
    endCap: StrokeCap,
    strokeJoin: StrokeJoin
): Promise<{ colorSegments: VectorNode[], maskSegments: VectorNode[] }> {
    // Need at least two points to draw a line.
    if (points.length < 2) return { colorSegments: [], maskSegments: [] };

    const colorSegments: VectorNode[] = [];
    const maskSegments: VectorNode[] = [];
    let cumulativeDistance = 0;
    
    // Check if we need transparency handling
    const isFullyOpaque = areAllStopsOpaque(stops);

    // Handle very short paths (treat as a single line segment).
    if (points.length < 3) {
        const startPoint = points[0];
        const endPoint = points[points.length-1];
        const pathData = `M ${startPoint.x.toFixed(3)} ${startPoint.y.toFixed(3)} L ${endPoint.x.toFixed(3)} ${endPoint.y.toFixed(3)}`;

        // Use color at the midpoint for the single segment.
        const colorWithAlpha = getColorAtDistance(totalLength / 2, totalLength, stops);
        const { r, g, b, a } = colorWithAlpha;

        // Create Color Segment
        const colorSegment = figma.createVector();
        colorSegment.vectorPaths = [{ windingRule: 'NONZERO', data: pathData }];
        colorSegment.strokeWeight = strokeWeight;
        colorSegment.strokeCap = startCap; // Apply start cap directly
        colorSegment.strokeJoin = strokeJoin;
        
        if (isFullyOpaque) {
            // For opaque gradients, just use the color directly with full opacity
            colorSegment.strokes = [{ type: 'SOLID', color: { r, g, b }, opacity: 1 }];
        } else {
            // For transparent gradients, use the alpha value directly on the color segment
            colorSegment.strokes = [{ type: 'SOLID', color: { r, g, b }, opacity: a }];
        }
        
        colorSegment.fills = [];
        colorSegments.push(colorSegment);

        // Only create mask segment if we need transparency and using the luminance mask approach
        if (!isFullyOpaque) {
            // Create grayscale color based on alpha for the luminance mask
            const maskColor = alphaToGrayscaleRGB(a);
            
            const maskSegment = figma.createVector();
            maskSegment.vectorPaths = [{ windingRule: 'NONZERO', data: pathData }];
            maskSegment.strokeWeight = strokeWeight;
            maskSegment.strokeCap = startCap; // Apply start cap directly
            maskSegment.strokeJoin = strokeJoin;
            maskSegment.strokes = [{ type: 'SOLID', color: maskColor, opacity: 1 }]; // Grayscale mask color
            maskSegment.fills = [];
            maskSegments.push(maskSegment);
        }

        // Apply end cap via vector network modification if different from start cap
        if (startCap !== endCap) {
            const colorNetwork = JSON.parse(JSON.stringify(colorSegment.vectorNetwork));
            if (colorNetwork.vertices.length > 1) {
                 // Apply end cap to the second vertex (index 1)
                 colorNetwork.vertices[1].strokeCap = endCap;
                 await colorSegment.setVectorNetworkAsync(colorNetwork);
                 
                 // Only apply to mask if it exists
                 if (maskSegments.length > 0) {
                     const maskNetwork = JSON.parse(JSON.stringify(maskSegments[0].vectorNetwork));
                     maskNetwork.vertices[1].strokeCap = endCap;
                     await maskSegments[0].setVectorNetworkAsync(maskNetwork);
                 }
            }
        }

        return { colorSegments, maskSegments };
    }

    // Iterate through the points to create line segments between them.
    for (let i = 1; i < points.length; i++) {
        const startPoint = points[i - 1];
        const endPoint = points[i];
        const segmentLength = calculateDistance(startPoint, endPoint);

        // Skip creating segments with negligible length.
        if (segmentLength < 0.001) continue;

        // Calculate the midpoint distance of the segment for color sampling.
        const segmentMidDistance = cumulativeDistance + segmentLength / 2;
        const colorWithAlpha = getColorAtDistance(segmentMidDistance, totalLength, stops);

        // Ensure color values are valid (clamped 0-1).
        const safeColor = {
            r: Math.min(1, Math.max(0, colorWithAlpha.r)),
            g: Math.min(1, Math.max(0, colorWithAlpha.g)),
            b: Math.min(1, Math.max(0, colorWithAlpha.b)),
            a: Math.min(1, Math.max(0, colorWithAlpha.a))
        };

        const pathData = `M ${startPoint.x.toFixed(3)} ${startPoint.y.toFixed(3)} L ${endPoint.x.toFixed(3)} ${endPoint.y.toFixed(3)}`;

        // Create Color Segment
        const colorSegment = figma.createVector();
        colorSegment.vectorPaths = [{ windingRule: 'NONZERO', data: pathData }];
        colorSegment.strokeWeight = strokeWeight;
        colorSegment.strokeCap = 'ROUND'; // Default internal cap for smooth joins
        colorSegment.strokeJoin = strokeJoin;
        colorSegment.strokes = [{ type: 'SOLID', color: { r: safeColor.r, g: safeColor.g, b: safeColor.b }, opacity: 1 }];
        
        colorSegment.fills = [];
        colorSegments.push(colorSegment);

        // Only create mask segment if we need transparency and using the luminance mask approach
        if (!isFullyOpaque) {
            // Create grayscale color based on alpha for the luminance mask
            const maskColor = alphaToGrayscaleRGB(safeColor.a);
            
            const maskSegment = figma.createVector();
            maskSegment.vectorPaths = [{ windingRule: 'NONZERO', data: pathData }];
            maskSegment.strokeWeight = strokeWeight;
            maskSegment.strokeCap = 'ROUND'; // Default internal cap
            maskSegment.strokeJoin = strokeJoin;
            maskSegment.strokes = [{ type: 'SOLID', color: maskColor, opacity: 1 }]; // Grayscale mask color
            maskSegment.fills = [];
            maskSegments.push(maskSegment);
        }

        cumulativeDistance += segmentLength; // Update cumulative distance.
    }

    // Apply the specified start and end caps to the first/last segments
    if (colorSegments.length > 0) {
        const firstColorSegment = colorSegments[0];
        const lastColorSegment = colorSegments[colorSegments.length - 1];
        
        // First handle the color segments
        try {
            // --- Start Cap ---
            const firstColorNetwork = JSON.parse(JSON.stringify(firstColorSegment.vectorNetwork));

            if (firstColorNetwork.vertices && firstColorNetwork.vertices.length > 0) {
                // Determine the actual start vertex based on M command coordinates
                const firstPath = firstColorSegment.vectorPaths[0].data;
                const matches = firstPath.match(/M\s+([\d.-]+)\s+([\d.-]+)/);
                let startVertexIndex = 0; // Default assumption: first vertex is start
                if (matches && matches.length >= 3) {
                    const startX = parseFloat(matches[1]);
                    const startY = parseFloat(matches[2]);
                    // Find the vertex matching the M command's coordinates
                    const foundIndex = firstColorNetwork.vertices.findIndex((v: { x: number; y: number; }) =>
                        Math.abs(v.x - startX) < 0.001 && Math.abs(v.y - startY) < 0.001);
                    if (foundIndex !== -1) startVertexIndex = foundIndex;
                }
                const otherVertexIndex = startVertexIndex === 0 ? 1 : 0; // The other vertex in the segment

                // Apply start cap to the correct vertex, keep the other vertex ROUND
                firstColorNetwork.vertices[startVertexIndex].strokeCap = startCap;
                if (firstColorNetwork.vertices.length > 1) { // Ensure there is another vertex
                     firstColorNetwork.vertices[otherVertexIndex].strokeCap = "ROUND";
                }

                await firstColorSegment.setVectorNetworkAsync(firstColorNetwork);
            }

            // --- End Cap ---
            const lastColorNetwork = JSON.parse(JSON.stringify(lastColorSegment.vectorNetwork));

            if (lastColorNetwork.vertices && lastColorNetwork.vertices.length > 1) {
                 // Determine the actual end vertex based on L command coordinates
                 const lastPath = lastColorSegment.vectorPaths[0].data;
                 const lineMatch = lastPath.match(/L\s+([\d.-]+)\s+([\d.-]+)/);
                 let endVertexIndex = lastColorNetwork.vertices.length - 1; // Default assumption: last vertex is end
                 if (lineMatch && lineMatch.length >= 3) {
                     const endX = parseFloat(lineMatch[1]);
                     const endY = parseFloat(lineMatch[2]);
                      // Find the vertex matching the L command's coordinates
                     const foundIndex = lastColorNetwork.vertices.findIndex((v: { x: number; y: number; }) =>
                         Math.abs(v.x - endX) < 0.001 && Math.abs(v.y - endY) < 0.001);
                     if (foundIndex !== -1) endVertexIndex = foundIndex;
                 }
                 const otherVertexIndex = endVertexIndex === 0 ? 1 : 0; // The other vertex in the segment

                 // Apply end cap to the correct vertex, keep the other vertex ROUND
                 lastColorNetwork.vertices[otherVertexIndex].strokeCap = "ROUND";
                 lastColorNetwork.vertices[endVertexIndex].strokeCap = endCap;

                 await lastColorSegment.setVectorNetworkAsync(lastColorNetwork);
            }
        } catch (e) {
            console.error("Error applying caps via vector network:", e);
            // Fallback: Apply caps directly to segment nodes if network modification fails
            firstColorSegment.strokeCap = startCap;
            lastColorSegment.strokeCap = endCap;
        }
        
        // Now handle mask segments if they exist
        if (maskSegments.length > 0) {
            const firstMaskSegment = maskSegments[0];
            const lastMaskSegment = maskSegments[maskSegments.length - 1];
            
            try {
                // --- Start Cap for Mask ---
                const firstMaskNetwork = JSON.parse(JSON.stringify(firstMaskSegment.vectorNetwork));
                
                if (firstMaskNetwork.vertices && firstMaskNetwork.vertices.length > 0) {
                    // Similar logic as for color segment
                    const firstPath = firstMaskSegment.vectorPaths[0].data;
                    const matches = firstPath.match(/M\s+([\d.-]+)\s+([\d.-]+)/);
                    let startVertexIndex = 0;
                    if (matches && matches.length >= 3) {
                        const startX = parseFloat(matches[1]);
                        const startY = parseFloat(matches[2]);
                        const foundIndex = firstMaskNetwork.vertices.findIndex((v: { x: number; y: number; }) =>
                            Math.abs(v.x - startX) < 0.001 && Math.abs(v.y - startY) < 0.001);
                        if (foundIndex !== -1) startVertexIndex = foundIndex;
                    }
                    const otherVertexIndex = startVertexIndex === 0 ? 1 : 0;
                    
                    firstMaskNetwork.vertices[startVertexIndex].strokeCap = startCap;
                    if (firstMaskNetwork.vertices.length > 1) {
                        firstMaskNetwork.vertices[otherVertexIndex].strokeCap = "ROUND";
                    }
                    
                    await firstMaskSegment.setVectorNetworkAsync(firstMaskNetwork);
                }
                
                // --- End Cap for Mask ---
                const lastMaskNetwork = JSON.parse(JSON.stringify(lastMaskSegment.vectorNetwork));
                
                if (lastMaskNetwork.vertices && lastMaskNetwork.vertices.length > 1) {
                    const lastPath = lastMaskSegment.vectorPaths[0].data;
                    const lineMatch = lastPath.match(/L\s+([\d.-]+)\s+([\d.-]+)/);
                    let endVertexIndex = lastMaskNetwork.vertices.length - 1;
                    if (lineMatch && lineMatch.length >= 3) {
                        const endX = parseFloat(lineMatch[1]);
                        const endY = parseFloat(lineMatch[2]);
                        const foundIndex = lastMaskNetwork.vertices.findIndex((v: { x: number; y: number; }) =>
                            Math.abs(v.x - endX) < 0.001 && Math.abs(v.y - endY) < 0.001);
                        if (foundIndex !== -1) endVertexIndex = foundIndex;
                    }
                    const otherVertexIndex = endVertexIndex === 0 ? 1 : 0;
                    
                    lastMaskNetwork.vertices[otherVertexIndex].strokeCap = "ROUND";
                    lastMaskNetwork.vertices[endVertexIndex].strokeCap = endCap;
                    
                    await lastMaskSegment.setVectorNetworkAsync(lastMaskNetwork);
                }
            } catch (e) {
                console.error("Error applying caps to mask via vector network:", e);
                // Fallback
                firstMaskSegment.strokeCap = startCap;
                lastMaskSegment.strokeCap = endCap;
            }
        }
    }

    return { colorSegments, maskSegments };
}

// --- Path Data Parsing ---

/**
 * Parses an SVG path data string into an array of PathSegment objects.
 * Handles M, m, L, l, H, h, V, v, C, c, Q, q, Z, z commands.
 * Does not handle Arcs (A, a) or Smooth curves (S, s, T, t).
 * @param data - The SVG path data string (e.g., "M10 10 L 20 20 C 30 30, 40 40, 50 50 Z").
 * @returns An array of PathSegment objects representing the path.
 */

function parsePathData(data: string): PathSegment[] {
    const segments: PathSegment[] = [];
    // Regex to split path data into commands and their arguments.
    const commands = data.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g) || [];
    let currentX = 0;
    let currentY = 0;
    let startX = 0; // Track the start of the current subpath for 'Z' command.
    let startY = 0;

    for (const cmd of commands) {
        const type = cmd[0];
        const argsStr = cmd.slice(1).trim();
        // Parse arguments, filtering out potential NaNs.
        const args = argsStr ? argsStr.split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n)) : [];

        switch (type) {
            // --- Move Commands ---
            case 'M': // moveto (absolute)
                currentX = args[0];
                currentY = args[1];
                startX = currentX; // Update subpath start point.
                startY = currentY;
                segments.push({ type: 'MOVE', x: currentX, y: currentY });
                // Handle implicit Lineto commands if more args are provided.
                for (let i = 2; i < args.length; i += 2) {
                    currentX = args[i];
                    currentY = args[i + 1];
                    segments.push({ type: 'LINE', x: currentX, y: currentY });
                }
                break;
            case 'm': // moveto (relative)
                currentX += args[0];
                currentY += args[1];
                startX = currentX; // Update subpath start point.
                startY = currentY;
                segments.push({ type: 'MOVE', x: currentX, y: currentY });
                 // Handle implicit Lineto commands.
                 for (let i = 2; i < args.length; i += 2) {
                    currentX += args[i];
                    currentY += args[i + 1];
                    segments.push({ type: 'LINE', x: currentX, y: currentY });
                }
                break;

            // --- Line Commands ---
            case 'L': // lineto (absolute)
                for (let i = 0; i < args.length; i += 2) {
                    currentX = args[i];
                    currentY = args[i + 1];
                    segments.push({ type: 'LINE', x: currentX, y: currentY });
                }
                break;
            case 'l': // lineto (relative)
                for (let i = 0; i < args.length; i += 2) {
                    currentX += args[i];
                    currentY += args[i + 1];
                    segments.push({ type: 'LINE', x: currentX, y: currentY });
                }
                break;
            case 'H': // horizontal lineto (absolute)
                for (let i = 0; i < args.length; i++) {
                    currentX = args[i];
                    segments.push({ type: 'LINE', x: currentX, y: currentY });
                }
                break;
            case 'h': // horizontal lineto (relative)
                for (let i = 0; i < args.length; i++) {
                    currentX += args[i];
                    segments.push({ type: 'LINE', x: currentX, y: currentY });
                }
                break;
            case 'V': // vertical lineto (absolute)
                for (let i = 0; i < args.length; i++) {
                    currentY = args[i];
                    segments.push({ type: 'LINE', x: currentX, y: currentY });
                }
                break;
            case 'v': // vertical lineto (relative)
                for (let i = 0; i < args.length; i++) {
                    currentY += args[i];
                    segments.push({ type: 'LINE', x: currentX, y: currentY });
                }
                break;

            // --- Cubic Bezier Commands ---
            case 'C': // cubic bezier (absolute)
                 for (let i = 0; i < args.length; i += 6) {
                    const x1 = args[i], y1 = args[i + 1];
                    const x2 = args[i + 2], y2 = args[i + 3];
                    const x = args[i + 4], y = args[i + 5];
                    segments.push({ type: 'CUBIC', x1, y1, x2, y2, x, y });
                    currentX = x; currentY = y;
                }
                break;
            case 'c': // cubic bezier (relative)
                for (let i = 0; i < args.length; i += 6) {
                    const x1 = currentX + args[i], y1 = currentY + args[i + 1];
                    const x2 = currentX + args[i + 2], y2 = currentY + args[i + 3];
                    const x = currentX + args[i + 4], y = currentY + args[i + 5];
                    segments.push({ type: 'CUBIC', x1, y1, x2, y2, x, y });
                    currentX = x; currentY = y;
                }
                break;

             // --- Quadratic Bezier Commands ---
             case 'Q': // quadratic bezier (absolute)
                 for (let i = 0; i < args.length; i += 4) {
                    const x1 = args[i], y1 = args[i + 1];
                    const x = args[i + 2], y = args[i + 3];
                    segments.push({ type: 'QUADRATIC', x1, y1, x, y });
                    currentX = x; currentY = y;
                }
                break;
            case 'q': // quadratic bezier (relative)
                for (let i = 0; i < args.length; i += 4) {
                    const x1 = currentX + args[i], y1 = currentY + args[i + 1];
                    const x = currentX + args[i + 2], y = currentY + args[i + 3];
                    segments.push({ type: 'QUADRATIC', x1, y1, x, y });
                    currentX = x; currentY = y;
                }
                break;

             // --- Close Path Command ---
             case 'Z': // closepath (absolute)
             case 'z': // closepath (relative)
                // Draw a line back to the start of the current subpath if not already there.
                if (currentX !== startX || currentY !== startY) {
                    segments.push({ type: 'LINE', x: startX, y: startY });
                    currentX = startX;
                    currentY = startY;
                }
                break;

            // --- Unsupported Commands ---
            // Arcs (A, a) and Smooth curves (S, s, T, t) require complex conversion.
            default:
                console.warn(`Unsupported SVG path command: ${type}`);
        }
    }
    return segments;
}