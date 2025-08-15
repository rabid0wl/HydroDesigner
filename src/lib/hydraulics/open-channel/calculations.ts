import { 
  ChannelInputs, 
  HydraulicResults, 
  CalculationResult, 
  SolverResult,
  FlowState 
} from './types';
import { calculateHydraulicProperties, getMaximumDepth } from './geometry';
import { solveRobust, findBracket } from './solver';

/**
 * Calculate normal depth using Manning's equation
 */
export function calculateNormalDepth(inputs: ChannelInputs): SolverResult {
  const { flowRate, slope, manningN, geometry, units } = inputs;
  
  // Unit conversion factor
  const unitConversion = units === 'metric' ? 1.0 : 1.486;
  
  // Manning's equation: Q = (k/n) * A * R^(2/3) * S^(1/2)
  // Rearranged: f(y) = (k/n) * A(y) * R(y)^(2/3) * S^(1/2) - Q = 0
  const manningFunction = (depth: number): number => {
    if (depth <= 0) return -flowRate;
    
    try {
      const props = calculateHydraulicProperties(geometry, depth);
      if (props.wettedPerimeter === 0) return -flowRate;
      
      const hydraulicRadius = props.hydraulicRadius;
      const conveyance = (unitConversion / manningN) * props.area * Math.pow(hydraulicRadius, 2/3);
      const calculatedFlow = conveyance * Math.pow(slope, 0.5);
      
      return calculatedFlow - flowRate;
    } catch (error) {
      return -flowRate;
    }
  };

  const maxDepth = getMaximumDepth(geometry);
  
  // Try to find a good bracket
  const bracket = findBracket(manningFunction, 1.0) || { lower: 0.0001, upper: maxDepth };
  
  return solveRobust(manningFunction, {
    tolerance: 1e-6,
    maxIterations: 100,
    bracket
  });
}

/**
 * Calculate critical depth for the given flow rate
 */
export function calculateCriticalDepth(inputs: ChannelInputs): SolverResult {
  const { flowRate, geometry, units } = inputs;
  
  const g = units === 'metric' ? 9.81 : 32.2; // gravitational acceleration
  
  // Critical flow condition: Fr = 1, or V² = g * D
  // Where D = A/T (hydraulic depth)
  // Q²/A² = g * A/T
  // Rearranged: f(y) = Q²*T - g*A³ = 0
  const criticalFunction = (depth: number): number => {
    if (depth <= 0) return -1;
    
    try {
      const props = calculateHydraulicProperties(geometry, depth);
      const Q2T = flowRate * flowRate * props.topWidth;
      const gA3 = g * Math.pow(props.area, 3);
      
      return Q2T - gA3;
    } catch (error) {
      return -1;
    }
  };

  const maxDepth = getMaximumDepth(geometry);
  
  return solveRobust(criticalFunction, {
    tolerance: 1e-6,
    maxIterations: 100,
    bracket: { lower: 0.0001, upper: maxDepth }
  });
}

/**
 * Calculate critical slope for the given flow rate and normal depth
 */
export function calculateCriticalSlope(inputs: ChannelInputs, normalDepth: number): number {
  const { flowRate, manningN, geometry, units } = inputs;
  
  const unitConversion = units === 'metric' ? 1.0 : 1.486;
  
  try {
    const props = calculateHydraulicProperties(geometry, normalDepth);
    const conveyance = (unitConversion / manningN) * props.area * Math.pow(props.hydraulicRadius, 2/3);
    
    // S_c = (Q / conveyance)²
    return Math.pow(flowRate / conveyance, 2);
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate Reynolds number for the flow
 */
export function calculateReynoldsNumber(
  velocity: number,
  hydraulicRadius: number,
  units: 'metric' | 'imperial'
): number {
  // Kinematic viscosity of water at 20°C
  const kinematicViscosity = units === 'metric' ? 1.004e-6 : 1.08e-5; // m²/s or ft²/s
  
  // Re = V * R / ν (using hydraulic radius as characteristic length)
  return (velocity * hydraulicRadius * 4) / kinematicViscosity; // Factor of 4 for hydraulic diameter
}

/**
 * Calculate specific energy
 */
export function calculateSpecificEnergy(
  depth: number,
  velocity: number,
  units: 'metric' | 'imperial'
): number {
  const g = units === 'metric' ? 9.81 : 32.2;
  return depth + (velocity * velocity) / (2 * g);
}

/**
 * Determine flow state based on Froude number
 */
export function determineFlowState(froudeNumber: number): FlowState {
  if (froudeNumber < 0.95) return 'Subcritical';
  if (froudeNumber > 1.05) return 'Supercritical';
  return 'Critical';
}

/**
 * Main calculation function that combines all hydraulic calculations
 */
export function calculateChannelHydraulics(inputs: ChannelInputs): CalculationResult<HydraulicResults> {
  try {
    // Validate inputs
    const validation = validateInputs(inputs);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      } as CalculationResult<HydraulicResults>;
    }

    const { flowRate, units } = inputs;
    const g = units === 'metric' ? 9.81 : 32.2;

    // Calculate normal depth
    const normalDepthResult = calculateNormalDepth(inputs);
    if (!normalDepthResult.converged) {
      return {
        success: false,
        errors: [{
          field: 'calculation',
          message: normalDepthResult.error || 'Failed to calculate normal depth',
          severity: 'error'
        }]
      };
    }

    const normalDepth = normalDepthResult.value;
    
    // Calculate critical depth
    const criticalDepthResult = calculateCriticalDepth(inputs);
    const criticalDepth = criticalDepthResult.converged ? criticalDepthResult.value : 0;
    
    // Calculate critical slope
    const criticalSlope = calculateCriticalSlope(inputs, normalDepth);
    
    // Calculate hydraulic properties at normal depth
    const props = calculateHydraulicProperties(inputs.geometry, normalDepth);
    
    // Calculate velocity and flow parameters
    const velocity = flowRate / props.area;
    const froudeNumber = velocity / Math.sqrt(g * props.hydraulicDepth);
    const flowState = determineFlowState(froudeNumber);
    const reynoldsNumber = calculateReynoldsNumber(velocity, props.hydraulicRadius, units);
    const specificEnergy = calculateSpecificEnergy(normalDepth, velocity, units);
    
    // Calculate freeboard (simplified version for now)
    const freeboard = calculateFreeboard(flowRate, units);
    
    const results: HydraulicResults = {
      normalDepth,
      velocity,
      froudeNumber,
      flowState,
      reynoldsNumber,
      specificEnergy,
      criticalDepth,
      criticalSlope,
      hydraulicProperties: props,
      freeboard: {
        lining: freeboard.lining,
        bank: freeboard.bank,
        controlling: Math.max(freeboard.lining, freeboard.bank)
      },
      geometry: {
        totalDepth: normalDepth + Math.max(freeboard.lining, freeboard.bank),
        topWidth: props.topWidth
      }
    };

    // Add warnings for unusual conditions
    const warnings: string[] = [];
    if (froudeNumber > 1.5) {
      warnings.push('High Froude number indicates very supercritical flow - check for hydraulic jumps');
    }
    if (velocity > (units === 'metric' ? 6 : 20)) {
      warnings.push('High velocity may cause erosion - consider channel protection');
    }
    if (reynoldsNumber < 2000) {
      warnings.push('Low Reynolds number indicates laminar flow - Manning\'s n may not be accurate');
    }

    return {
      success: true,
      data: results,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'calculation',
        message: error instanceof Error ? error.message : 'Unknown calculation error',
        severity: 'error'
      }]
    };
  }
}

/**
 * Simplified freeboard calculation (can be enhanced later)
 */
function calculateFreeboard(flowRate: number, units: 'metric' | 'imperial'): { lining: number; bank: number } {
  // Basic freeboard based on flow rate - this is a simplified version
  const baseFreeboard = units === 'metric' ? 0.3 : 1.0; // 0.3m or 1.0ft minimum
  
  // Scale with flow rate (simplified approach)
  const flowFactor = units === 'metric' ? 
    Math.pow(flowRate / 10, 0.25) : 
    Math.pow(flowRate / 350, 0.25);
  
  const liningFreeboard = Math.max(baseFreeboard, baseFreeboard * flowFactor);
  const bankFreeboard = Math.max(baseFreeboard * 1.2, liningFreeboard * 1.1);
  
  return { lining: liningFreeboard, bank: bankFreeboard };
}

/**
 * Validate channel inputs
 */
function validateInputs(inputs: ChannelInputs): CalculationResult<null> {
  const errors: any[] = [];

  if (inputs.flowRate <= 0) {
    errors.push({ field: 'flowRate', message: 'Flow rate must be positive', severity: 'error' });
  }

  if (inputs.slope <= 0) {
    errors.push({ field: 'slope', message: 'Channel slope must be positive', severity: 'error' });
  }

  if (inputs.slope > 0.1) {
    errors.push({ field: 'slope', message: 'Very steep slope - results may be unrealistic', severity: 'warning' });
  }

  if (inputs.manningN <= 0) {
    errors.push({ field: 'manningN', message: 'Manning\'s n must be positive', severity: 'error' });
  }

  if (inputs.manningN < 0.008) {
    errors.push({ field: 'manningN', message: 'Manning\'s n is unusually low', severity: 'warning' });
  }

  if (inputs.manningN > 0.2) {
    errors.push({ field: 'manningN', message: 'Manning\'s n is unusually high', severity: 'warning' });
  }

  const geometryValidation = validateGeometryInputs(inputs.geometry);
  errors.push(...geometryValidation);

  return {
    success: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning').map(e => e.message)
  };
}

function validateGeometryInputs(geometry: any): any[] {
  const errors: any[] = [];

  switch (geometry.shape) {
    case 'rectangular':
      if (!geometry.bottomWidth || geometry.bottomWidth <= 0) {
        errors.push({ field: 'bottomWidth', message: 'Bottom width must be positive', severity: 'error' });
      }
      break;

    case 'trapezoidal':
      if (!geometry.bottomWidth || geometry.bottomWidth <= 0) {
        errors.push({ field: 'bottomWidth', message: 'Bottom width must be positive', severity: 'error' });
      }
      if (geometry.sideSlope === undefined || geometry.sideSlope < 0) {
        errors.push({ field: 'sideSlope', message: 'Side slope must be non-negative', severity: 'error' });
      }
      if (geometry.sideSlope > 10) {
        errors.push({ field: 'sideSlope', message: 'Very steep side slopes may be unstable', severity: 'warning' });
      }
      break;

    case 'triangular':
      if (!geometry.sideSlope || geometry.sideSlope <= 0) {
        errors.push({ field: 'sideSlope', message: 'Side slope must be positive for triangular channels', severity: 'error' });
      }
      break;

    case 'circular':
      if (!geometry.diameter || geometry.diameter <= 0) {
        errors.push({ field: 'diameter', message: 'Diameter must be positive', severity: 'error' });
      }
      break;

    default:
      errors.push({ field: 'shape', message: 'Invalid channel shape', severity: 'error' });
  }

  return errors;
}