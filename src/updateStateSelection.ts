// --- State and UI Communication ---

/**
 * updateStateSelection.ts
 * Re-export functions from the safe implementation
**/

export { safeUpdateSelectionState as updateSelectionState, setupSelectionListeners, markUIReady } from './safeStateUpdate';