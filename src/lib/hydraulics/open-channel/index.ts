// Export all types
export * from './types';

// Export calculation functions
export { 
  calculateChannelHydraulics,
  calculateNormalDepth,
  calculateCriticalDepth,
  calculateCriticalSlope,
  calculateReynoldsNumber,
  calculateSpecificEnergy,
  determineFlowState
} from './calculations';

// Export geometry functions
export {
  calculateHydraulicProperties,
  calculateRectangularProperties,
  calculateTrapezoidalProperties,
  calculateTriangularProperties,
  calculateCircularProperties,
  getMaximumDepth,
  validateGeometry,
  getOptimalTrapezoidalDimensions
} from './geometry';

// Export Manning's coefficient data and functions
export {
  manningCoefficients,
  getManningByLabel,
  getManningByValue,
  validateManningN,
  getLiningTypeFromManningN,
  getTypicalRangeForLining
} from './manning';

// Export rating curve functions
export {
  generateRatingCurve,
  generateOptimizedRatingCurve,
  interpolateFromRatingCurve,
  exportRatingCurveCSV
} from './rating-curve';

// Export solver functions
export {
  solveUsingBrent,
  solveUsingNewtonRaphson,
  solveRobust,
  findBracket
} from './solver';