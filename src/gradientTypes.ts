// --- Type Definitions ---

// Defines the structure for parsed SVG path segments.
export type PathSegment =
    | { type: 'MOVE'; x: number; y: number }
    | { type: 'LINE'; x: number; y: number }
    | { type: 'CUBIC'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
    | { type: 'QUADRATIC'; x1: number; y1: number; x: number; y: number };

// Defines the structure for a gradient color stop.
export type GradientStop = {
    position: number; // Percentage (0-100)
    color: string;    // Hex color string (e.g., "#RRGGBB")
    id: string;       // Unique identifier for the stop
    alpha?: number;   // Optional opacity (0-1, defaults to 1)
    isEndpoint?: boolean; // Optional flag for start/end stops
};