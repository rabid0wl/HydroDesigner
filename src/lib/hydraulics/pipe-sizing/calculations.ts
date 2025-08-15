import {
  PipeSizingInputs,
  PipeSize,
  HydraulicResults,
  FlowRegime,
  PipeFitting,
  CalculationMethod,
  CalculationResult,
  ValidationError
} from './types';
import { getMaterialProperties } from './standard-sizes';

// Engineering constants
const GRAVITATIONAL_ACCELERATION = {
  imperial: 32.174, // ft/s²
  metric: 9.81      // m/s²
};

const WATER_KINEMATIC_VISCOSITY = {
  imperial: 1.08e-5, // ft²/s at 68°F
  metric: 1.004e-6   // m²/s at 20°C
};

const WATER_DENSITY = {
  imperial: 62.4, // lb/ft³
  metric: 1000     // kg/m³
};

// Fitting loss coefficients (K values)
const FITTING_LOSS_COEFFICIENTS: Record<PipeFitting['type'], number> = {
  'elbow-90': 0.9,
  'elbow-45': 0.42,
  'tee-branch': 1.8,
  'tee-through': 0.6,
  'gate-valve': 0.19,
  'globe-valve': 10.0,
  'check-valve': 2.5,
  'reducer': 0.5,
  'entrance': 0.5,
  'exit': 1.0
};

/**
 * Calculate hydraulic results using specified method
 * @param inputs Pipe sizing inputs
 * @param pipeSize Pipe size to evaluate
 * @param method Calculation method to use
 * @returns Hydraulic calculation results
 */
export function calculateHydraulics(
  inputs: PipeSizingInputs,
  pipeSize: PipeSize,
  method: CalculationMethod = CalculationMethod.HAZEN_WILLIAMS
): CalculationResult<HydraulicResults> {
  try {
    // Validate inputs
    const validation = validateCalculationInputs(inputs, pipeSize);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    // Convert units if necessary
    const normalizedInputs = normalizeUnits(inputs);
    const normalizedPipe = normalizePipeSize(pipeSize, inputs.units);

    // Calculate based on method
    let results: HydraulicResults;
    switch (method) {
      case CalculationMethod.HAZEN_WILLIAMS:
        results = calculateHazenWilliams(normalizedInputs, normalizedPipe);
        break;
      case CalculationMethod.DARCY_WEISBACH:
        results = calculateDarcyWeisbach(normalizedInputs, normalizedPipe);
        break;
      case CalculationMethod.MANNING:
        results = calculateManning(normalizedInputs, normalizedPipe);
        break;
      default:
        results = calculateHazenWilliams(normalizedInputs, normalizedPipe);
    }

    // Convert results back to user units
    const convertedResults = convertResultsToUserUnits(results, inputs.units);

    // Generate warnings
    const warnings = generateHydraulicWarnings(normalizedInputs, normalizedPipe, convertedResults);

    return {
      success: true,
      data: convertedResults,
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
 * Hazen-Williams calculation for water flow
 * Formula: V = 1.318 * C * R^0.63 * S^0.54
 * @param inputs Normalized pipe sizing inputs
 * @param pipe Normalized pipe size
 * @returns Hydraulic results
 */
function calculateHazenWilliams(inputs: PipeSizingInputs, pipe: PipeSize): HydraulicResults {
  const materialProps = getMaterialProperties(pipe.material);
  const C = materialProps.hazenWilliamsC;
  
  // Convert flow from gpm to cfs (assuming imperial normalized units)
  const flowCfs = inputs.designFlow / 448.831; // gpm to cfs
  
  // Calculate velocity
  const velocity = flowCfs / pipe.area;
  
  // Calculate hydraulic radius (R = A/P, for circular pipe R = D/4)
  const diameter = Math.sqrt(4 * pipe.area / Math.PI);
  const hydraulicRadius = diameter / 4;
  
  // Calculate slope needed for this velocity using Hazen-Williams
  // V = 1.318 * C * R^0.63 * S^0.54
  // S = (V / (1.318 * C * R^0.63))^(1/0.54)
  const requiredSlope = Math.pow(velocity / (1.318 * C * Math.pow(hydraulicRadius, 0.63)), 1/0.54);
  
  // Calculate head loss per 1000 ft
  const headLossPer1000ft = requiredSlope * 1000;
  
  // Calculate total head loss
  const totalHeadLoss = (requiredSlope * inputs.pipeLength) + Math.abs(inputs.elevationChange);
  
  // Calculate pressure drop (psi)
  const pressureDrop = totalHeadLoss * 0.433; // ft to psi conversion
  
  // Calculate Reynolds number for flow regime determination
  const reynoldsNumber = calculateReynoldsNumber(velocity, diameter, inputs.units);
  const flowRegime = determineFlowRegime(reynoldsNumber);
  
  // Calculate minor losses
  const minorLosses = calculateMinorLosses(inputs.fittings, velocity);
  
  // Calculate friction factor (approximate for Hazen-Williams)
  const frictionFactor = calculateHazenWilliamsFrictionFactor(C, hydraulicRadius);
  
  return {
    velocity,
    headLoss: headLossPer1000ft,
    totalHeadLoss: totalHeadLoss + minorLosses,
    pressureDrop,
    reynoldsNumber,
    flowRegime,
    frictionFactor,
    minorLosses,
    majorLosses: requiredSlope * inputs.pipeLength
  };
}

/**
 * Darcy-Weisbach calculation for general fluid flow
 * Formula: hf = f * (L/D) * (V²/2g)
 * @param inputs Normalized pipe sizing inputs
 * @param pipe Normalized pipe size
 * @returns Hydraulic results
 */
function calculateDarcyWeisbach(inputs: PipeSizingInputs, pipe: PipeSize): HydraulicResults {
  const materialProps = getMaterialProperties(pipe.material);
  const roughness = materialProps.roughnessHeight;
  
  // Convert flow to cfs
  const flowCfs = inputs.designFlow / 448.831;
  
  // Calculate velocity
  const velocity = flowCfs / pipe.area;
  
  // Calculate diameter
  const diameter = Math.sqrt(4 * pipe.area / Math.PI);
  
  // Calculate Reynolds number
  const reynoldsNumber = calculateReynoldsNumber(velocity, diameter, inputs.units);
  const flowRegime = determineFlowRegime(reynoldsNumber);
  
  // Calculate friction factor using Colebrook-White equation
  const frictionFactor = calculateFrictionFactor(reynoldsNumber, roughness, diameter);
  
  // Calculate head loss using Darcy-Weisbach
  const g = GRAVITATIONAL_ACCELERATION[inputs.units];
  const majorLosses = frictionFactor * (inputs.pipeLength / diameter) * (velocity * velocity) / (2 * g);
  
  // Calculate head loss per 1000 ft
  const headLossPer1000ft = (majorLosses / inputs.pipeLength) * 1000;
  
  // Calculate minor losses
  const minorLosses = calculateMinorLosses(inputs.fittings, velocity);
  
  // Total head loss including elevation change
  const totalHeadLoss = majorLosses + minorLosses + Math.abs(inputs.elevationChange);
  
  // Calculate pressure drop
  const pressureDrop = totalHeadLoss * 0.433;
  
  return {
    velocity,
    headLoss: headLossPer1000ft,
    totalHeadLoss,
    pressureDrop,
    reynoldsNumber,
    flowRegime,
    frictionFactor,
    minorLosses,
    majorLosses
  };
}

/**
 * Manning calculation for partially filled pipes or gravity flow
 * Formula: V = (1.486/n) * R^(2/3) * S^(1/2)
 * @param inputs Normalized pipe sizing inputs
 * @param pipe Normalized pipe size
 * @returns Hydraulic results
 */
function calculateManning(inputs: PipeSizingInputs, pipe: PipeSize): HydraulicResults {
  const materialProps = getMaterialProperties(pipe.material);
  const n = materialProps.manningN;
  
  // Convert flow to cfs
  const flowCfs = inputs.designFlow / 448.831;
  
  // Calculate velocity
  const velocity = flowCfs / pipe.area;
  
  // Calculate hydraulic radius (assuming full flow for circular pipe)
  const diameter = Math.sqrt(4 * pipe.area / Math.PI);
  const hydraulicRadius = diameter / 4;
  
  // Calculate slope required for this velocity
  // V = (1.486/n) * R^(2/3) * S^(1/2)
  // S = (V * n / (1.486 * R^(2/3)))^2
  const requiredSlope = Math.pow((velocity * n) / (1.486 * Math.pow(hydraulicRadius, 2/3)), 2);
  
  // Calculate head loss
  const majorLosses = requiredSlope * inputs.pipeLength;
  const headLossPer1000ft = requiredSlope * 1000;
  
  // Calculate minor losses
  const minorLosses = calculateMinorLosses(inputs.fittings, velocity);
  
  // Total head loss
  const totalHeadLoss = majorLosses + minorLosses + Math.abs(inputs.elevationChange);
  
  // Reynolds number and flow regime
  const reynoldsNumber = calculateReynoldsNumber(velocity, diameter, inputs.units);
  const flowRegime = determineFlowRegime(reynoldsNumber);
  
  // Approximate friction factor for Manning
  const frictionFactor = calculateManningFrictionFactor(n, hydraulicRadius);
  
  // Pressure drop
  const pressureDrop = totalHeadLoss * 0.433;
  
  return {
    velocity,
    headLoss: headLossPer1000ft,
    totalHeadLoss,
    pressureDrop,
    reynoldsNumber,
    flowRegime,
    frictionFactor,
    minorLosses,
    majorLosses
  };
}

/**
 * Calculate Reynolds number for flow regime determination
 * Re = (ρ * V * D) / μ = (V * D) / ν
 * @param velocity Flow velocity (ft/s or m/s)
 * @param diameter Pipe diameter (ft or m)
 * @param units Unit system
 * @returns Reynolds number (dimensionless)
 */
function calculateReynoldsNumber(velocity: number, diameter: number, units: 'imperial' | 'metric'): number {
  const kinematicViscosity = WATER_KINEMATIC_VISCOSITY[units];
  return (velocity * diameter) / kinematicViscosity;
}

/**
 * Determine flow regime based on Reynolds number
 * @param reynoldsNumber Reynolds number
 * @returns Flow regime classification
 */
function determineFlowRegime(reynoldsNumber: number): FlowRegime {
  if (reynoldsNumber < 2000) return 'laminar';
  if (reynoldsNumber > 4000) return 'turbulent';
  return 'transitional';
}

/**
 * Calculate friction factor using Colebrook-White equation
 * Iterative solution for turbulent flow
 * @param reynoldsNumber Reynolds number
 * @param roughness Pipe roughness (ft or m)
 * @param diameter Pipe diameter (ft or m)
 * @returns Friction factor
 */
function calculateFrictionFactor(reynoldsNumber: number, roughness: number, diameter: number): number {
  const relativeRoughness = roughness / diameter;
  
  // For laminar flow
  if (reynoldsNumber < 2000) {
    return 64 / reynoldsNumber;
  }
  
  // For turbulent flow - use Swamee-Jain approximation (explicit form of Colebrook-White)
  const term1 = Math.log10(relativeRoughness / 3.7 + 5.74 / Math.pow(reynoldsNumber, 0.9));
  return 0.25 / Math.pow(term1, 2);
}

/**
 * Calculate approximate friction factor for Hazen-Williams
 * @param C Hazen-Williams C coefficient
 * @param hydraulicRadius Hydraulic radius (ft or m)
 * @returns Approximate friction factor
 */
function calculateHazenWilliamsFrictionFactor(C: number, hydraulicRadius: number): number {
  // Approximate conversion from Hazen-Williams to Darcy-Weisbach
  // This is a rough approximation for comparison purposes
  return 0.02 * Math.pow(100/C, 1.85) / Math.pow(hydraulicRadius, 0.16);
}

/**
 * Calculate approximate friction factor for Manning
 * @param n Manning's n coefficient
 * @param hydraulicRadius Hydraulic radius (ft or m)
 * @returns Approximate friction factor
 */
function calculateManningFrictionFactor(n: number, hydraulicRadius: number): number {
  // Approximate conversion from Manning to Darcy-Weisbach
  // f ≈ 8g*n²/(R^(1/3))
  return 8 * 32.174 * n * n / Math.pow(hydraulicRadius, 1/3);
}

/**
 * Calculate minor losses from fittings and appurtenances
 * hL = K * (V²/2g)
 * @param fittings Array of pipe fittings
 * @param velocity Flow velocity (ft/s or m/s)
 * @returns Minor losses in feet or meters
 */
function calculateMinorLosses(fittings: PipeFitting[], velocity: number): number {
  if (!fittings || fittings.length === 0) return 0;
  
  const g = 32.174; // ft/s² - using imperial for now
  const velocityHead = (velocity * velocity) / (2 * g);
  
  let totalK = 0;
  
  fittings.forEach(fitting => {
    const kValue = fitting.kValue || FITTING_LOSS_COEFFICIENTS[fitting.type] || 0;
    totalK += kValue * fitting.quantity;
  });
  
  return totalK * velocityHead;
}

/**
 * Normalize units to imperial for consistent calculations
 * @param inputs Original inputs
 * @returns Inputs normalized to imperial units
 */
function normalizeUnits(inputs: PipeSizingInputs): PipeSizingInputs {
  if (inputs.units === 'imperial') {
    return { ...inputs };
  }
  
  // Convert metric to imperial
  return {
    ...inputs,
    designFlow: inputs.designFlow * 15.8503, // L/s to gpm
    pipeLength: inputs.pipeLength * 3.28084, // m to ft
    elevationChange: inputs.elevationChange * 3.28084, // m to ft
    operatingPressure: inputs.operatingPressure ? inputs.operatingPressure * 0.145038 : undefined, // kPa to psi
    staticHead: inputs.staticHead ? inputs.staticHead * 3.28084 : undefined, // m to ft
    maxHeadLoss: inputs.maxHeadLoss ? inputs.maxHeadLoss * 3.28084 : undefined, // m to ft
    minVelocity: inputs.minVelocity ? inputs.minVelocity * 3.28084 : undefined, // m/s to ft/s
    maxVelocity: inputs.maxVelocity ? inputs.maxVelocity * 3.28084 : undefined, // m/s to ft/s
    frostDepth: inputs.frostDepth ? inputs.frostDepth * 3.28084 : undefined, // m to ft
    temperature: (inputs.temperature - 32) * 5/9 + 32, // Keep in °F for calculations
    units: 'imperial'
  };
}

/**
 * Normalize pipe size to imperial units
 * @param pipe Original pipe size
 * @param originalUnits Original unit system
 * @returns Pipe size in imperial units
 */
function normalizePipeSize(pipe: PipeSize, originalUnits: 'imperial' | 'metric'): PipeSize {
  if (originalUnits === 'imperial') {
    return { ...pipe };
  }
  
  // Convert metric to imperial
  return {
    ...pipe,
    nominalDiameter: pipe.nominalDiameter * 0.0393701, // mm to inches
    internalDiameter: pipe.internalDiameter * 0.0393701, // mm to inches
    wallThickness: pipe.wallThickness * 0.0393701, // mm to inches
    area: pipe.area * 10.7639 // m² to ft²
  };
}

/**
 * Convert hydraulic results back to user units
 * @param results Results in imperial units
 * @param targetUnits Target unit system
 * @returns Results in target units
 */
function convertResultsToUserUnits(results: HydraulicResults, targetUnits: 'imperial' | 'metric'): HydraulicResults {
  if (targetUnits === 'imperial') {
    return { ...results };
  }
  
  // Convert imperial to metric
  return {
    ...results,
    velocity: results.velocity * 0.3048, // ft/s to m/s
    headLoss: results.headLoss * 0.3048, // ft per 1000ft to m per 1000m
    totalHeadLoss: results.totalHeadLoss * 0.3048, // ft to m
    pressureDrop: results.pressureDrop * 6.89476, // psi to kPa
    minorLosses: results.minorLosses * 0.3048, // ft to m
    majorLosses: results.majorLosses * 0.3048 // ft to m
  };
}

/**
 * Validate inputs for hydraulic calculations
 * @param inputs Pipe sizing inputs
 * @param pipe Pipe size
 * @returns Validation result
 */
function validateCalculationInputs(inputs: PipeSizingInputs, pipe: PipeSize): CalculationResult<null> {
  const errors: ValidationError[] = [];
  
  // Flow rate validation
  if (inputs.designFlow <= 0) {
    errors.push({ field: 'designFlow', message: 'Design flow must be positive', severity: 'error' });
  }
  
  if (inputs.designFlow > (inputs.units === 'metric' ? 10000 : 40000)) {
    errors.push({ field: 'designFlow', message: 'Design flow exceeds typical pipe capacity limits', severity: 'warning' });
  }
  
  // Pipe length validation
  if (inputs.pipeLength <= 0) {
    errors.push({ field: 'pipeLength', message: 'Pipe length must be positive', severity: 'error' });
  }
  
  if (inputs.pipeLength > (inputs.units === 'metric' ? 5000 : 16000)) {
    errors.push({ field: 'pipeLength', message: 'Very long pipe length may affect calculation accuracy', severity: 'warning' });
  }
  
  // Pipe size validation
  if (pipe.area <= 0) {
    errors.push({ field: 'pipeSize', message: 'Pipe area must be positive', severity: 'error' });
  }
  
  if (pipe.internalDiameter <= 0) {
    errors.push({ field: 'pipeSize', message: 'Internal diameter must be positive', severity: 'error' });
  }
  
  // Safety factor validation
  if (inputs.safetyFactor < 1.0) {
    errors.push({ field: 'safetyFactor', message: 'Safety factor should be at least 1.0', severity: 'warning' });
  }
  
  if (inputs.safetyFactor > 3.0) {
    errors.push({ field: 'safetyFactor', message: 'Very high safety factor may result in oversized pipes', severity: 'warning' });
  }
  
  return {
    success: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning').map(e => e.message)
  };
}

/**
 * Generate hydraulic warnings based on calculation results
 * @param inputs Pipe sizing inputs
 * @param pipe Pipe size
 * @param results Hydraulic results
 * @returns Array of warning messages
 */
function generateHydraulicWarnings(inputs: PipeSizingInputs, pipe: PipeSize, results: HydraulicResults): string[] {
  const warnings: string[] = [];
  const materialProps = getMaterialProperties(pipe.material);
  
  // Velocity warnings
  if (results.velocity < materialProps.minVelocity) {
    warnings.push(`Velocity (${results.velocity.toFixed(2)} ${inputs.units === 'metric' ? 'm/s' : 'ft/s'}) is below minimum recommended (${materialProps.minVelocity} ${inputs.units === 'metric' ? 'm/s' : 'ft/s'}) - may cause sediment deposition`);
  }
  
  if (results.velocity > materialProps.maxVelocity) {
    warnings.push(`Velocity (${results.velocity.toFixed(2)} ${inputs.units === 'metric' ? 'm/s' : 'ft/s'}) exceeds maximum recommended (${materialProps.maxVelocity} ${inputs.units === 'metric' ? 'm/s' : 'ft/s'}) - may cause erosion or noise`);
  }
  
  // Head loss warnings
  const headLossLimit = inputs.maxHeadLoss || (inputs.units === 'metric' ? 10 : 30);
  if (results.headLoss > headLossLimit) {
    warnings.push(`Head loss (${results.headLoss.toFixed(2)} ${inputs.units === 'metric' ? 'm/km' : 'ft/kft'}) exceeds typical design limits - consider larger pipe`);
  }
  
  // Reynolds number warnings
  if (results.reynoldsNumber < 4000 && results.reynoldsNumber > 2000) {
    warnings.push('Flow is in transitional regime - consider laminar or turbulent design assumptions');
  }
  
  if (results.reynoldsNumber < 2000) {
    warnings.push('Laminar flow detected - Manning\'s or Hazen-Williams equations may not be accurate');
  }
  
  // Pressure warnings
  if (results.pressureDrop > materialProps.maxPressure * 0.8) {
    warnings.push('Pressure drop approaches material pressure rating limits');
  }
  
  // Flow regime warnings
  if (results.flowRegime === 'laminar') {
    warnings.push('Laminar flow conditions - verify flow assumptions and consider viscosity effects');
  }
  
  return warnings;
}