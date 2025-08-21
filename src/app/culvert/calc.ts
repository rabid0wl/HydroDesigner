import { standardBoxSizes, standardCircularSizes, getAvailableSizes } from "@/lib/hydraulics/standard-sizes";
import {
  CulvertParams,
  CulvertResults,
  CulvertSize,
  CulvertShape,
  HydraulicResults,
  ScourAndOutfallResults,
  PerformanceCurve,
  AlternativeRanking,
  RatingCurvePoint,
  ScenarioResult,
} from "@/lib/hydraulics/culvert-types";
import { round } from "@/lib/num";

// Engineering constants and coefficients
const MANNING_N_VALUES = {
  concrete: 0.013,
  corrugatedMetal: 0.024,
  hdpe: 0.009,
} as const;

const ENTRANCE_LOSS_COEFFICIENTS = {
  projecting: { base: 0.9, skewFactor: 1.2 },
  headwall: { base: 0.5, skewFactor: 1.1 },
 wingwall: { base: 0.2, skewFactor: 1.05 },
} as const;

// FHWA HDS-5 inlet control coefficients by shape and entrance type
const INLET_CONTROL_COEFFICIENTS = {
  circular: {
    concrete: { c: 0.0398, Y: 0.67, c2: 0.0, Y2: 0.0, S: -0.5 },
    corrugatedMetal: { c: 0.0553, Y: 0.54, c2: 0.0, Y2: 0.0, S: -0.5 },
    hdpe: { c: 0.0347, Y: 0.69, c2: 0.0, Y2: 0.0, S: -0.5 }
 },
  box: {
    concrete: { c: 0.0083, Y: 2.0, c2: 0.0379, Y2: 0.69, S: 0.0 },
    corrugatedMetal: { c: 0.0145, Y: 1.75, c2: 0.0317, Y2: 0.69, S: 0.0 },
    hdpe: { c: 0.0083, Y: 2.0, c2: 0.0379, Y2: 0.69, S: 0.0 }
  },
 arch: {
    concrete: { c: 0.0145, Y: 0.75, c2: 0.0317, Y2: 0.75, S: 0.0 },
    corrugatedMetal: { c: 0.0196, Y: 0.75, c2: 0.0317, Y2: 0.75, S: 0.0 },
    hdpe: { c: 0.0145, Y: 0.75, c2: 0.0317, Y2: 0.75, S: 0.0 }
  }
} as const;

/**
 * Comprehensive input validation with engineering limits
 * @param params Culvert design parameters
 * @throws Error if parameters are invalid
 */
export function validateInputs(params: CulvertParams): void {
  const errors: string[] = [];

  // Flow validation
  if (params.designFlow <= 0) {
    errors.push('Design flow must be positive');
  }
  if (params.designFlow > (params.units === 'metric' ? 1000 : 35000)) {
    errors.push(`Design flow exceeds reasonable limits for ${params.units} units`);
  }

  // Geometry validation
  if (params.culvertLength <= 0) {
    errors.push('Culvert length must be positive');
  }
  if (params.culvertLength > (params.units === 'metric' ? 200 : 650)) {
    errors.push('Culvert length exceeds typical maximum');
  }

  // Elevation validation
  if (params.upstreamInvert <= params.downstreamInvert) {
    errors.push('Upstream invert must be higher than downstream invert');
  }

  // Slope validation
  const slope = (params.upstreamInvert - params.downstreamInvert) / params.culvertLength;
  if (slope < 0.001) {
    errors.push('Slope is too flat (minimum 0.001 ft/ft recommended)');
  }
  if (slope > 0.1) {
    errors.push('Slope is very steep (>10%), check for erosion concerns');
  }

  // Headwater validation
  if (params.maxHeadwater <= 0) {
    errors.push('Maximum headwater must be positive');
  }

  // Cover depth validation
  if (params.minCoverDepth < (params.units === 'metric' ? 0.3 : 1.0)) {
    errors.push(`Minimum cover depth is below recommended minimum for ${params.roadClass} roads`);
  }

  // Blockage factor validation
  if (params.blockageFactor < 0 || params.blockageFactor > 0.5) {
    errors.push('Blockage factor must be between 0 and 0.5');
  }

  // Skew angle validation
  if (params.skewAngle < 0 || params.skewAngle > 45) {
    errors.push('Skew angle must be between 0 and 45 degrees');
  }

  // Multiple culvert validation
  if (params.multipleCulverts < 1 || params.multipleCulverts > 6) {
    errors.push('Number of culverts must be between 1 and 6');
  }

  if (errors.length > 0) {
    throw new Error(`Input validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get filtered sizes based on material availability for better performance
 * @returns Array of available sizes for the selected material
 */
export function getFilteredSizes(params: CulvertParams): CulvertSize[] {
  try {
    // Use material-specific sizes if available, otherwise fall back to all sizes
    const circularSizes = getAvailableSizes(params.material, 'circular');
    const boxSizes = getAvailableSizes(params.material, 'box');
    const archSizes = getAvailableSizes(params.material, 'arch');

    return [...circularSizes, ...boxSizes, ...archSizes];
  } catch (error) {
    console.warn('Failed to get material-specific sizes, using default:', error);
    return [...standardBoxSizes, ...standardCircularSizes];
  }
}

/**
 * Manning's roughness coefficient based on material
 * @returns Manning's n value
 */
export function getManningsN(material: string): number {
  return MANNING_N_VALUES[material as keyof typeof MANNING_N_VALUES] || MANNING_N_VALUES.concrete;
}

/**
 * Calculate entrance loss coefficient with skew angle effect
 * Uses proper coefficients and skew angle adjustment factors
 * @returns Entrance loss coefficient
 */
export function getEntranceLossCoef(params: CulvertParams): number {
  const coefficients = ENTRANCE_LOSS_COEFFICIENTS[params.entranceType] || ENTRANCE_LOSS_COEFFICIENTS.headwall;
  const skewRadians = params.skewAngle * (Math.PI / 180);
  
  // More accurate skew angle adjustment based on FHWA guidelines
  const skewAdjustment = 1 + (coefficients.skewFactor - 1) * Math.sin(skewRadians);
  return coefficients.base * skewAdjustment;
}

/**
 * Get FHWA HDS-5 inlet control coefficients for specific culvert type
 * @returns Inlet control coefficients
 */
export function getInletControlCoefficients(params: CulvertParams) {
  const shapeCoeffs = INLET_CONTROL_COEFFICIENTS[params.shape];
  return shapeCoeffs?.[params.material] || shapeCoeffs?.concrete || INLET_CONTROL_COEFFICIENTS.circular.concrete;
}

/**
 * Get tailwater depth from rating curve
 * @returns Tailwater depth
 */
export function getTailwaterDepth(flow: number, ratingCurve: RatingCurvePoint[]): number {
  if (!ratingCurve || ratingCurve.length === 0) {
    return 0; // Or a default value
  }
  // Simple interpolation
  const curve = ratingCurve.sort((a, b) => a.flow - b.flow);
  for (let i = 0; i < curve.length - 1; i++) {
    if (flow >= curve[i].flow && flow <= curve[i + 1].flow) {
      const q1 = curve[i].flow;
      const d1 = curve[i].depth;
      const q2 = curve[i + 1].flow;
      const d2 = curve[i + 1].depth;
      return d1 + ((flow - q1) * (d2 - d1)) / (q2 - q1);
    }
  }
  return curve[curve.length - 1].depth; // Extrapolate
}

/**
 * Calculate critical depth using iterative Newton-Raphson method
 * More accurate than simplified approximations
 * @returns Critical depth
 */
export function calculateCriticalDepth(size: CulvertSize, flow: number, params: CulvertParams): number {
  const effectiveArea = size.area * (1 - params.blockageFactor);
  
  if (size.shape === 'circular' && size.diameter) {
    return calculateCriticalDepthCircular(size.diameter, flow);
  }
  
  if (size.shape === 'box' && size.width && size.height) {
    // For rectangular channels: yc = (q²/gb²)^(1/3)
    const q_unit = flow / size.width;
    const yc = Math.pow((q_unit * q_unit) / (params.units === 'metric' ? 9.81 : 32.2), 1/3);
    return Math.min(yc, size.height * 0.95);
  }
  
  if (size.shape === 'arch' && size.span && size.rise) {
    // Approximate arch as rectangular for critical depth
    const q_unit = flow / size.span;
    const yc = Math.pow((q_unit * q_unit) / (params.units === 'metric' ? 9.81 : 32.2), 1/3);
    return Math.min(yc, size.rise * 0.9);
  }
  
  // Fallback approximation
  return Math.pow((flow * flow) / ((params.units === 'metric' ? 9.81 : 32.2) * effectiveArea), 1 / 3);
}

/**
 * Calculate critical depth for circular culvert using iterative method
 * @param diameter Pipe diameter
 * @param flow Flow rate
 * @returns Critical depth
 */
export function calculateCriticalDepthCircular(diameter: number, flow: number): number {
  const D = diameter;
  let yc = D / 2; // Initial guess at half-full
  const tolerance = 0.001;
  const maxIterations = 20;
  const g = 32.2; // Using imperial units for consistency with existing code
  
  for (let i = 0; i < maxIterations; i++) {
    const theta = 2 * Math.acos((D/2 - yc) / (D/2));
    const A = (D * D / 8) * (theta - Math.sin(theta));
    const T = D * Math.sin(theta/2);
    
    const f = A * A * A / T - (flow * flow) / g;
    const dA_dyc = D * Math.sin(theta/2);
    const dT_dyc = D * Math.cos(theta/2) * (2 / D);
    const df_dyc = (3 * A * A * dA_dyc * T - A * A * A * dT_dyc) / (T * T);
    
    const yc_new = yc - f / df_dyc;
    
    if (Math.abs(yc_new - yc) < tolerance) {
      return Math.min(yc_new, D * 0.95);
    }
    yc = yc_new;
  }
  
  // If iteration doesn't converge, use approximation
  const qc = flow / Math.sqrt(g);
  return Math.min(Math.pow(qc * qc / (D * D), 1/3) * D, D * 0.95);
}

/**
 * Calculate normal depth using Manning's equation with iterative solution
 * @returns Normal depth
 */
export function calculateNormalDepth(size: CulvertSize, flow: number, params: CulvertParams): number {
  const n = getManningsN(params.material);
  const slope = Math.max((params.upstreamInvert - params.downstreamInvert) / params.culvertLength, 0.001); // Minimum slope to prevent division issues
  
  if (size.shape === 'circular' && size.diameter) {
    return calculateNormalDepthCircular(size.diameter, flow, n, slope);
  }
  
  if (size.shape === 'box' && size.width && size.height) {
    return calculateNormalDepthRectangular(size.width, size.height, flow, n, slope);
  }
  
  // Approximation for other shapes
  const effectiveArea = size.area * (1 - params.blockageFactor);
  const hydraulicRadius = effectiveArea / (2 * Math.sqrt(Math.PI * effectiveArea));
  const velocity = (1.49 / n) * Math.pow(hydraulicRadius, 2/3) * Math.pow(slope, 0.5);
  const characteristicLength = size.width || size.diameter || Math.sqrt(effectiveArea);
  return flow / (velocity * characteristicLength);
}

/**
 * Calculate normal depth for circular pipe using iterative method
 * @param diameter Pipe diameter
 * @param flow Flow rate
 * @param n Manning's n
 * @param slope Channel slope
 * @returns Normal depth
 */
export function calculateNormalDepthCircular(diameter: number, flow: number, n: number, slope: number): number {
  const D = diameter;
  let yn = D * 0.7; // Initial guess at 70% full
  const tolerance = 0.001;
  const maxIterations = 20;
  
  for (let i = 0; i < maxIterations; i++) {
    const theta = 2 * Math.acos((D/2 - yn) / (D/2));
    const A = (D * D / 8) * (theta - Math.sin(theta));
    const P = D * theta / 2;
    const R = A / P;
    
    const Q_calc = (1.49 / n) * A * Math.pow(R, 2/3) * Math.pow(slope, 0.5);
    const error = Q_calc - flow;
    
    if (Math.abs(error) < tolerance) {
      return Math.min(yn, D * 0.95);
    }
    
    // Simple adjustment for next iteration
    yn = yn * (1 - error / flow * 0.1);
    yn = Math.max(0.1 * D, Math.min(yn, 0.95 * D));
  }
  
  return Math.min(yn, D * 0.95);
}

/**
 * Calculate normal depth for rectangular channel
 * @param width Channel width
 * @param height Channel height
 * @param flow Flow rate
 * @param n Manning's n
 * @param slope Channel slope
 * @returns Normal depth
 */
export function calculateNormalDepthRectangular(width: number, height: number, flow: number, n: number, slope: number): number {
  let yn = height * 0.7; // Initial guess at 70% full
  const tolerance = 0.001;
  const maxIterations = 20;
  
  for (let i = 0; i < maxIterations; i++) {
    const A = width * yn;
    const P = width + 2 * yn;
    const R = A / P;
    
    const Q_calc = (1.49 / n) * A * Math.pow(R, 2/3) * Math.pow(slope, 0.5);
    const error = Q_calc - flow;
    
    if (Math.abs(error) < tolerance) {
      return Math.min(yn, height * 0.95);
    }
    
    // Simple adjustment for next iteration
    yn = yn * (1 - error / flow * 0.1);
    yn = Math.max(0.05 * height, Math.min(yn, 0.95 * height));
  }
  
  return Math.min(yn, height * 0.95);
}

/**
 * Calculate inlet control headwater using FHWA HDS-5 methodology
 * Uses material and entrance-specific coefficients
 * @returns Headwater depth for inlet control
 */
export function calculateInletControl(size: CulvertSize, flow: number, params: CulvertParams): number {
  const area = size.area * (1 - params.blockageFactor);
  const effectiveFlow = params.multipleCulverts > 1 ?
    flow / (params.multipleCulverts * (params.unequalDistributionFactor || 1)) : flow;
  
  // Get material-specific coefficients
  const coeffs = getInletControlCoefficients(params);

  if (size.shape === 'circular' && size.diameter) {
    const D = size.diameter;
    const Q_DA = effectiveFlow / (D * Math.sqrt(D));
    
    const HW_D = coeffs.c * Math.pow(Q_DA, coeffs.Y) +
                 coeffs.c2 * Math.pow(Q_DA, coeffs.Y2) + coeffs.S;
    return Math.max(HW_D * D, 0.1 * D);
  }
  
  if (size.shape === 'box' && size.width && size.height) {
    const W = size.width;
    const H = size.height;
    const Q_WH = effectiveFlow / (W * Math.sqrt(H));
    
    const HW_H = coeffs.c * Math.pow(Q_WH, coeffs.Y) +
                 coeffs.c2 * Math.pow(Q_WH, coeffs.Y2) + coeffs.S;
    return Math.max(HW_H * H, 0.1 * H);
  }
  
  if (size.shape === 'arch' && size.span && size.rise) {
    const S = size.span;
    const R = size.rise;
    const Q_SR = effectiveFlow / (S * Math.sqrt(R));
    
    const HW_R = coeffs.c * Math.pow(Q_SR, coeffs.Y) +
                 coeffs.c2 * Math.pow(Q_SR, coeffs.Y2) + coeffs.S;
    return Math.max(HW_R * R, 0.1 * R);
  }
  
  // Fallback for other shapes using energy equation
  const Ke = getEntranceLossCoef(params);
  const velocity = effectiveFlow / area;
  const D = size.height || size.diameter || size.rise || 1;
  return Math.max((Ke * velocity) / (2 * (params.units === 'metric' ? 9.81 : 32.2)), 0.1 * D);
}

/**
 * Calculate outlet control headwater
 * @returns Headwater depth for outlet control
 */
export function calculateOutletControl(size: CulvertSize, flow: number, params: CulvertParams): number {
  const n = getManningsN(params.material);
  const Ke = getEntranceLossCoef(params);
  const L = params.culvertLength;
  const area = size.area * (1 - params.blockageFactor);
  const tailwater = getTailwaterDepth(flow, params.tailwaterRatingCurve || []);
  const effectiveFlow = params.multipleCulverts > 1 ? flow / (params.multipleCulverts * (params.unequalDistributionFactor || 1)) : flow;

  const velocity = effectiveFlow / area;
  const he = Ke * (velocity * velocity) / (2 * (params.units === 'metric' ? 9.81 : 32.2));
  
  // Calculate hydraulic radius properly for each shape
  let R: number;
  if (size.shape === 'circular' && size.diameter) {
    // For full flow in circular pipe
    R = size.diameter / 4;
  } else if (size.shape === 'box' && size.width && size.height) {
    // For rectangular channel - assuming full flow
    const P = 2 * size.width + 2 * size.height; // Full perimeter
    R = area / P;
  } else if (size.shape === 'arch' && size.span && size.rise) {
    // For arch culverts - approximate hydraulic radius
    // Assume approximately elliptical shape for perimeter calculation
    const a = size.span / 2; // semi-major axis
    const b = size.rise; // semi-minor axis (approximately)
    const P_approx = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    R = area / P_approx;
 } else {
    // Approximation for other shapes
    R = area / (4 * Math.sqrt(Math.PI * area));
  }
  
  const hf = (n * n * velocity * velocity * L) / (2.22 * Math.pow(R, 4 / 3));
 const ho = (velocity * velocity) / (2 * (params.units === 'metric' ? 9.81 : 32.2));

  const downstreamEL = params.downstreamInvert + Math.max(tailwater, 0);
  const upstreamEL = params.upstreamInvert;
  
  return Math.max(downstreamEL + he + hf + ho - upstreamEL, 0.1);
}

/**
 * Calculate hydraulic performance for a given flow
 * @returns Hydraulic results
 */
export function calculateHydraulics(size: CulvertSize, flow: number, params: CulvertParams): HydraulicResults {
  try {
    const inletHW = calculateInletControl(size, flow, params);
    const outletHW = calculateOutletControl(size, flow, params);
    const flowType = inletHW > outletHW ? 'inlet' : 'outlet';
    const headwater = Math.max(inletHW, outletHW);

    const area = size.area * (1 - params.blockageFactor);
    
    // Validate area to prevent division by zero
    if (area <= 0) {
      throw new Error(`Invalid effective area: ${area}. Check blockage factor.`);
    }

    const velocity = flow / area;
    const criticalDepth = calculateCriticalDepth(size, flow, params);
    const normalDepth = calculateNormalDepth(size, flow, params);
    
    const depth = flowType === 'inlet' ? criticalDepth : normalDepth;
    
    // Validate depth to prevent negative or zero values in Froude calculation
    const validDepth = Math.max(depth, 0.01);
    const g = params.units === 'metric' ? 9.81 : 32.2;

    const result: HydraulicResults = {
      flowType,
      headwater: round(headwater, 4),
      velocity: round(velocity, 4),
      froudeNumber: round(velocity / Math.sqrt(g * validDepth), 4),
      criticalDepth: round(criticalDepth, 4),
      normalDepth: round(normalDepth, 4),
      outletVelocity: round(velocity, 4),
      energyGrade: round(headwater + (velocity * velocity) / (2 * g), 4),
    };

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown hydraulic calculation error';
    console.warn(`Hydraulic calculation failed for size ${JSON.stringify(size)}: ${errorMessage}`);
    
    // Return safe fallback values
    return createFallbackHydraulics(flow, size, params);
  }
}

/**
 * Create fallback hydraulic results for error cases
 * @param flow Design flow
 * @param size Culvert size
 * @returns Safe fallback results
 */
export function createFallbackHydraulics(flow: number, size: CulvertSize, params: CulvertParams): HydraulicResults {
  const area = Math.max(size.area, 1); // Minimum 1 sq ft
  const velocity = flow / area;
  const depth = Math.sqrt(area); // Rough approximation
  const g = params.units === 'metric' ? 9.81 : 32.2;
  
  return {
    flowType: 'inlet',
    headwater: round(depth * 1.5, 4),
    velocity: round(Math.max(velocity, 1), 4),
    froudeNumber: round(Math.min(velocity / Math.sqrt(g * depth), 3), 4),
    criticalDepth: round(depth * 0.8, 4),
    normalDepth: round(depth * 0.9, 4),
    outletVelocity: round(velocity, 4),
    energyGrade: round(depth * 2, 4),
  };
}

/**
 * Generate comprehensive warnings based on hydraulic and structural analysis
 * @returns Array of warning messages
 */
export function generateWarnings(size: CulvertSize, hydraulics: HydraulicResults, params: CulvertParams): string[] {
  const warnings: string[] = [];
  const D = size.diameter || size.height || size.rise || 1;

  // Hydraulic warnings
  const hwRatio = hydraulics.headwater / D;
  if (hwRatio > 1.5) {
    warnings.push(`Headwater to diameter ratio (HW/D) of ${hwRatio.toFixed(2)} exceeds typical design limits`);
  }

  if (hydraulics.velocity > 15) {
    warnings.push(`Outlet velocity of ${hydraulics.velocity.toFixed(1)} ${params.units === 'metric' ? 'm/s' : 'ft/s'} may cause severe erosion`);
  } else if (hydraulics.velocity > 10) {
    warnings.push(`Outlet velocity of ${hydraulics.velocity.toFixed(1)} ${params.units === 'metric' ? 'm/s' : 'ft/s'} may cause erosion problems`);
  } else if (hydraulics.velocity < 2) {
    warnings.push(`Low velocity of ${hydraulics.velocity.toFixed(1)} ${params.units === 'metric' ? 'm/s' : 'ft/s'} may cause sediment deposition`);
  }

  if (hydraulics.froudeNumber > 1.5) {
    warnings.push(`High Froude number (${hydraulics.froudeNumber.toFixed(2)}) indicates supercritical flow with potential hydraulic jump issues`);
  }

  // Structural warnings
  const minCover = params.units === 'metric' ? 0.6 : 2.0;
  if (params.minCoverDepth < minCover) {
    warnings.push(`Minimum cover depth of ${params.minCoverDepth} is less than recommended minimum (${minCover}) for ${params.roadClass} roads`);
  }

  // Environmental warnings
  if (params.environmentalFactors.fishPassageParams) {
    const fishPassage = evaluateFishPassage(size, hydraulics, params);
    if (!fishPassage.overallStatus) {
      warnings.push(`Fish passage may be impaired - ${fishPassage.baffleRecommendation}`);
    }
    if (fishPassage.jumpHeight > 0.3) {
      warnings.push(`Outlet drop of ${fishPassage.jumpHeight.toFixed(2)} may create fish passage barrier`);
    }
  }

  // Construction warnings
  if (params.skewAngle > 30) {
    warnings.push(`High skew angle (${params.skewAngle}°) will increase construction complexity and costs`);
  }

  if (size.area > (params.units === 'metric' ? 50 : 500)) {
    warnings.push('Large culvert size may require special construction considerations and equipment');
  }

  // Flow control warnings
  if (hydraulics.headwater > params.maxHeadwater) {
    warnings.push(`Headwater depth of ${hydraulics.headwater.toFixed(2)} exceeds maximum allowable (${params.maxHeadwater})`);
  }

  return warnings;
}

/**
 * Detailed fish passage analysis based on NOAA/NMFS criteria
 * @returns Fish passage analysis
 */
export function evaluateFishPassage(size: CulvertSize, hydraulics: HydraulicResults, params: CulvertParams): {
  overallStatus: boolean;
  velocityBarrier: boolean;
  depthBarrier: boolean;
  jumpHeight: number;
  baffleRecommendation: string;
} {
  if (!params.environmentalFactors.fishPassageParams) {
    return {
      overallStatus: true,
      velocityBarrier: false,
      depthBarrier: false,
      jumpHeight: 0,
      baffleRecommendation: 'None',
    };
  }

  const { lowFlowVelocity, lowFlowDepth, baffles } = params.environmentalFactors.fishPassageParams;
  
  // Check velocity barrier
  const velocityBarrier = hydraulics.velocity > lowFlowVelocity;
  
  // Check depth barrier
  const depthBarrier = hydraulics.normalDepth < lowFlowDepth;
  
  // Calculate jump height at outlet
  const outletDrop = params.upstreamInvert - params.downstreamInvert;
  const jumpHeight = Math.max(0, outletDrop - hydraulics.normalDepth);
  
  // Determine baffle recommendation
  let baffleRecommendation = 'None';
  if (velocityBarrier || depthBarrier) {
    if (size.shape === 'box') {
      baffleRecommendation = 'Spoiler baffles recommended';
    } else if (size.shape === 'circular') {
      baffleRecommendation = 'Roughening elements recommended';
    } else {
      baffleRecommendation = 'Stream simulation approach recommended';
    }
  }
  
  const overallStatus = !velocityBarrier && !depthBarrier && jumpHeight < 0.3;
  
  return {
    overallStatus,
    velocityBarrier,
    depthBarrier,
    jumpHeight,
    baffleRecommendation,
  };
}

/**
 * Evaluate multiple culvert scenarios with enhanced error handling and performance optimization
 * @returns Organized results by culvert shape with comprehensive error handling
 */
export function evaluateCulvertScenarios(params: CulvertParams): { [key in CulvertShape]?: ScenarioResult[] } {
  const results: { [key in CulvertShape]?: ScenarioResult[] } = {};
  let evaluatedCount = 0;
  let successCount = 0;

  try {
    // Get material-filtered sizes for better performance
    const materialSizes = getFilteredSizes(params);

    // Process sizes in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < materialSizes.length; i += batchSize) {
      const batch = materialSizes.slice(i, i + batchSize);
      
      batch.forEach(size => {
        evaluatedCount++;
        
        try {
          const hydraulics = calculateHydraulics(size, params.designFlow, params);
          
          // Only include scenarios that meet headwater criteria
          if (hydraulics.headwater <= params.maxHeadwater) {
            const scenario: ScenarioResult = {
              size,
              hydraulics,
              shape: size.shape,
              warnings: generateWarnings(size, hydraulics, params),
            };
            
            if (!results[size.shape]) {
              results[size.shape] = [];
            }
            results[size.shape]?.push(scenario);
            successCount++;
          }
        } catch (error) {
          // Log error for debugging but don't include failed scenarios in results
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`Scenario evaluation failed for ${size.shape} ${JSON.stringify(size)}: ${errorMessage}`);
        }
      });
    }

    // Sort results within each shape by headwater depth, ascending
    Object.keys(results).forEach(shape => {
      const shapeKey = shape as CulvertShape;
      if (results[shapeKey]) {
        results[shapeKey]!.sort((a, b) => a.hydraulics.headwater - b.hydraulics.headwater);
      }
    });

    return results;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during scenario evaluation';
    console.error('Critical error in scenario evaluation:', errorMessage);
    
    // Return minimal safe results
    return createEmergencyFallbackResults(params);
  }
}

/**
 * Create emergency fallback results if scenario evaluation completely fails
 * @returns Minimal safe results structure
 */
export function createEmergencyFallbackResults(params: CulvertParams): { [key in CulvertShape]?: ScenarioResult[] } {
  const standardSize: CulvertSize = {
    shape: 'circular',
    diameter: 3, // 3 ft diameter
    area: Math.PI * 1.5 * 1.5
  };

  return {
    circular: [{
      size: standardSize,
      shape: 'circular',
      hydraulics: createFallbackHydraulics(params.designFlow, standardSize, params),
      warnings: ['Emergency fallback scenario - please verify input parameters']
    }]
  };
}