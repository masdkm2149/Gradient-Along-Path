// --- Global State Variables ---

// --- Type Definitions ---
import { GradientStop } from './gradientTypes';

// Currently selected/active gradient group node
let currentGradientGroup: GroupNode | null = null;
// Initially selected source vector node
let sourceVector: VectorNode | null = null;
// Current set of gradient stops (cached from UI)
let currentStops: GradientStop[] = [];

// Setters to change values
export const setCurrentGradientGroup = (group: GroupNode | null) => {
    currentGradientGroup = group;
  };
  
  export const setSourceVector = (vector: VectorNode | null) => {
    sourceVector = vector;
  };
  
  export const setCurrentStops = (stops: GradientStop[]) => {
    currentStops = stops;
  };
  
  // Optional: Getters to access values
  export const getCurrentGradientGroup = () => currentGradientGroup;
  export const getSourceVector = () => sourceVector;
  export const getCurrentStops = () => currentStops;