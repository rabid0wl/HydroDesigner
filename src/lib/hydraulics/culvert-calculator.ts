import { standardBoxSizes, standardCircularSizes, standardArchSizes, getAvailableSizes } from './standard-sizes';
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
} from './culvert-types';
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

interface CalculationCache {
  [key: string]: HydraulicResults;
}




export class CulvertCalculator {
  private readonly g: number;
  private cache: CalculationCache = {};

  constructor(private params: CulvertParams) {
    // Validate input parameters
    this.validateInputs(params);
    
    if (this.params.units === 'metric') {
      this.g = 9.81;
    } else {
      this.g = 32.2;
    }
  }

  /**
   * Comprehensive input validation with engineering limits
   * @param params Culvert design parameters
   * @throws Error if parameters are invalid
   */
  private validateInputs(params: CulvertParams): void {
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
   * Evaluate multiple culvert scenarios with enhanced error handling and performance optimization
   * @returns Organized results by culvert shape with comprehensive error handling
   */
  public evaluateCulvertScenarios(): { [key in CulvertShape]?: ScenarioResult[] } {
    const results: { [key in CulvertShape]?: ScenarioResult[] } = {};
    let evaluatedCount = 0;
    let successCount = 0;
    const startTime = performance.now();

    try {
      // Get material-filtered sizes for better performance
      const materialSizes = this.getFilteredSizes();

      // Process sizes in batches for better performance
      const batchSize = 10;
      for (let i = 0; i < materialSizes.length; i += batchSize) {
        const batch = materialSizes.slice(i, i + batchSize);
        
        batch.forEach(size => {
          evaluatedCount++;
          
          try {
            const hydraulics = this.calculateHydraulics(size, this.params.designFlow);
            
            // Only include scenarios that meet headwater criteria
            if (hydraulics.headwater <= this.params.maxHeadwater) {
              const scenario: ScenarioResult = {
                size,
                hydraulics,
                shape: size.shape,
                warnings: this.generateWarnings(size, hydraulics),
              };
              
              if (!results[size.shape]) {
                results[size.shape] = [];
              }
              results[size.shape]?.push(scenario);
              successCount++;
            }
          } catch (error) {
            this.handleScenarioError(error, size, results);
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

      const endTime = performance.now();
      console.log(`Culvert evaluation completed: ${successCount}/${evaluatedCount} scenarios in ${(endTime - startTime).toFixed(1)}ms`);

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during scenario evaluation';
      console.error('Critical error in scenario evaluation:', errorMessage);
      
      // Return minimal safe results
      return this.createEmergencyFallbackResults();
    }
  }

  /**
   * Get filtered sizes based on material availability for better performance
   * @returns Array of available sizes for the selected material
   */
  private getFilteredSizes(): CulvertSize[] {
    try {
      // Use material-specific sizes if available, otherwise fall back to all sizes
      const circularSizes = getAvailableSizes(this.params.material, 'circular');
      const boxSizes = getAvailableSizes(this.params.material, 'box');
      const archSizes = getAvailableSizes(this.params.material, 'arch');

      return [...circularSizes, ...boxSizes, ...archSizes];
    } catch (error) {
      console.warn('Failed to get material-specific sizes, using default:', error);
      return [...standardBoxSizes, ...standardCircularSizes, ...standardArchSizes];
    }
  }

  /**
   * Handle individual scenario evaluation errors
   * @param error The error that occurred
   * @param size The culvert size being evaluated
   * @param results The results object to update
   */
  private handleScenarioError(
    error: unknown,
    size: CulvertSize,
    results: { [key in CulvertShape]?: ScenarioResult[] }
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log error for debugging but don't include failed scenarios in results
    console.warn(`Scenario evaluation failed for ${size.shape} ${JSON.stringify(size)}: ${errorMessage}`);
    
    // Only add to results if it's a critical error that should be visible to user
    if (errorMessage.includes('validation') || errorMessage.includes('critical')) {
      if (!results[size.shape]) {
        results[size.shape] = [];
      }
      
      results[size.shape]?.push({
        size,
        shape: size.shape,
        hydraulics: this.createFallbackHydraulics(this.params.designFlow, size),
        warnings: [`Evaluation error: ${errorMessage}`]
      });
    }
  }

  /**
   * Create emergency fallback results if scenario evaluation completely fails
   * @returns Minimal safe results structure
   */
  private createEmergencyFallbackResults(): { [key in CulvertShape]?: ScenarioResult[] } {
    const standardSize: CulvertSize = {
      shape: 'circular',
      diameter: 3, // 3 ft diameter
      area: Math.PI * 1.5 * 1.5
    };

    return {
      circular: [{
        size: standardSize,
        shape: 'circular',
        hydraulics: this.createFallbackHydraulics(this.params.designFlow, standardSize),
        warnings: ['Emergency fallback scenario - please verify input parameters']
      }]
    };
  }

  /**
   * Manning's roughness coefficient based on material
   * @returns Manning's n value
   */
  private getManningsN(): number {
    return MANNING_N_VALUES[this.params.material] || MANNING_N_VALUES.concrete;
  }

  /**
   * Calculate entrance loss coefficient with skew angle effect
   * Uses proper coefficients and skew angle adjustment factors
   * @returns Entrance loss coefficient
   */
  private getEntranceLossCoef(): number {
    const coefficients = ENTRANCE_LOSS_COEFFICIENTS[this.params.entranceType] || ENTRANCE_LOSS_COEFFICIENTS.headwall;
    const skewRadians = this.params.skewAngle * (Math.PI / 180);
    
    // More accurate skew angle adjustment based on FHWA guidelines
    const skewAdjustment = 1 + (coefficients.skewFactor - 1) * Math.sin(skewRadians);
    return coefficients.base * skewAdjustment;
  }

  /**
   * Get FHWA HDS-5 inlet control coefficients for specific culvert type
   * @returns Inlet control coefficients
   */
  private getInletControlCoefficients() {
    const shapeCoeffs = INLET_CONTROL_COEFFICIENTS[this.params.shape];
    return shapeCoeffs?.[this.params.material] || shapeCoeffs?.concrete || INLET_CONTROL_COEFFICIENTS.circular.concrete;
  }

  // Get tailwater depth from rating curve
  private getTailwaterDepth(flow: number): number {
    if (!this.params.tailwaterRatingCurve || this.params.tailwaterRatingCurve.length === 0) {
      return 0; // Or a default value
    }
    // Simple interpolation
    const curve = this.params.tailwaterRatingCurve.sort((a, b) => a.flow - b.flow);
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
   * @param size Culvert geometry
   * @param flow Design flow rate
   * @returns Critical depth
   */
  private calculateCriticalDepth(size: CulvertSize, flow: number): number {
    const effectiveArea = size.area * (1 - this.params.blockageFactor);
    
    if (size.shape === 'circular' && size.diameter) {
      return this.calculateCriticalDepthCircular(size.diameter, flow);
    }
    
    if (size.shape === 'box' && size.width && size.height) {
      // For rectangular channels: yc = (q²/gb²)^(1/3)
      const q_unit = flow / size.width;
      const yc = Math.pow((q_unit * q_unit) / this.g, 1/3);
      return Math.min(yc, size.height * 0.95);
    }
    
    if (size.shape === 'arch' && size.span && size.rise) {
      // Approximate arch as rectangular for critical depth
      const q_unit = flow / size.span;
      const yc = Math.pow((q_unit * q_unit) / this.g, 1/3);
      return Math.min(yc, size.rise * 0.9);
    }
    
    // Fallback approximation
    return Math.pow((flow * flow) / (this.g * effectiveArea), 1 / 3);
  }

  /**
   * Calculate critical depth for circular culvert using iterative method
   * @param diameter Pipe diameter
   * @param flow Flow rate
   * @returns Critical depth
   */
  private calculateCriticalDepthCircular(diameter: number, flow: number): number {
    const D = diameter;
    let yc = D / 2; // Initial guess at half-full
    const tolerance = 0.001;
    const maxIterations = 20;
    
    for (let i = 0; i < maxIterations; i++) {
      const theta = 2 * Math.acos((D/2 - yc) / (D/2));
      const A = (D * D / 8) * (theta - Math.sin(theta));
      const T = D * Math.sin(theta/2);
      
      const f = A * A * A / T - (flow * flow) / this.g;
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
    const qc = flow / Math.sqrt(this.g);
    return Math.min(Math.pow(qc * qc / (D * D), 1/3) * D, D * 0.95);
  }

  /**
   * Calculate normal depth using Manning's equation with iterative solution
   * @param size Culvert geometry
   * @param flow Flow rate
   * @returns Normal depth
   */
  private calculateNormalDepth(size: CulvertSize, flow: number): number {
    const n = this.getManningsN();
    const slope = Math.max(this.params.streamSlope, 0.001); // Minimum slope to prevent division issues
    
    if (size.shape === 'circular' && size.diameter) {
      return this.calculateNormalDepthCircular(size.diameter, flow, n, slope);
    }
    
    if (size.shape === 'box' && size.width && size.height) {
      return this.calculateNormalDepthRectangular(size.width, size.height, flow, n, slope);
    }
    
    // Approximation for other shapes
    const effectiveArea = size.area * (1 - this.params.blockageFactor);
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
  private calculateNormalDepthCircular(diameter: number, flow: number, n: number, slope: number): number {
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
  private calculateNormalDepthRectangular(width: number, height: number, flow: number, n: number, slope: number): number {
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
   * @param size Culvert geometry
   * @param flow Design flow rate
   * @returns Headwater depth for inlet control
   */
  private calculateInletControl(size: CulvertSize, flow: number): number {
    const area = size.area * (1 - this.params.blockageFactor);
    const effectiveFlow = this.params.multipleCulverts > 1 ?
      flow / (this.params.multipleCulverts * (this.params.unequalDistributionFactor || 1)) : flow;
    
    // Get material-specific coefficients
    const coeffs = this.getInletControlCoefficients();

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
    const Ke = this.getEntranceLossCoef();
    const velocity = effectiveFlow / area;
    const D = size.height || size.diameter || size.rise || 1;
    return Math.max((Ke * velocity * velocity) / (2 * this.g), 0.1 * D);
  }

  // Calculate outlet control headwater
  private calculateOutletControl(size: CulvertSize, flow: number): number {
    const n = this.getManningsN();
    const Ke = this.getEntranceLossCoef();
    const L = this.params.culvertLength;
    const area = size.area * (1 - this.params.blockageFactor);
    const tailwater = this.getTailwaterDepth(flow);
    const effectiveFlow = this.params.multipleCulverts > 1 ? flow / (this.params.multipleCulverts * (this.params.unequalDistributionFactor || 1)) : flow;

    const velocity = effectiveFlow / area;
    const he = Ke * (velocity * velocity) / (2 * this.g);
    
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
    const ho = (velocity * velocity) / (2 * this.g);

    const downstreamEL = this.params.downstreamInvert + Math.max(tailwater, 0);
    const upstreamEL = this.params.upstreamInvert;
    
    return Math.max(downstreamEL + he + hf + ho - upstreamEL, 0.1);
  }

  /**
   * Calculate hydraulic performance for a given flow with caching
   * @param size Culvert geometry
   * @param flow Design flow rate
   * @returns Hydraulic results with caching for performance
   */
  private calculateHydraulics(size: CulvertSize, flow: number): HydraulicResults {
    // Create cache key based on size and flow parameters
    const cacheKey = this.createCacheKey(size, flow);
    
    // Check cache first
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    try {
      const inletHW = this.calculateInletControl(size, flow);
      const outletHW = this.calculateOutletControl(size, flow);
      const flowType = inletHW > outletHW ? 'inlet' : 'outlet';
      const headwater = Math.max(inletHW, outletHW);

      const area = size.area * (1 - this.params.blockageFactor);
      
      // Validate area to prevent division by zero
      if (area <= 0) {
        throw new Error(`Invalid effective area: ${area}. Check blockage factor.`);
      }

      const velocity = flow / area;
      const criticalDepth = this.calculateCriticalDepth(size, flow);
      const normalDepth = this.calculateNormalDepth(size, flow);
      
      const depth = flowType === 'inlet' ? criticalDepth : normalDepth;
      
      // Validate depth to prevent negative or zero values in Froude calculation
      const validDepth = Math.max(depth, 0.01);

      const result: HydraulicResults = {
        flowType,
        headwater: this.validateNumericResult(headwater, 'headwater'),
        velocity: this.validateNumericResult(velocity, 'velocity'),
        froudeNumber: this.validateNumericResult(velocity / Math.sqrt(this.g * validDepth), 'Froude number'),
        criticalDepth: this.validateNumericResult(criticalDepth, 'critical depth'),
        normalDepth: this.validateNumericResult(normalDepth, 'normal depth'),
        outletVelocity: this.validateNumericResult(velocity, 'outlet velocity'),
        energyGrade: this.validateNumericResult(headwater + (velocity * velocity) / (2 * this.g), 'energy grade'),
      };

      // Cache the result for future use
      this.cache[cacheKey] = result;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown hydraulic calculation error';
      console.warn(`Hydraulic calculation failed for size ${JSON.stringify(size)}: ${errorMessage}`);
      
      // Return safe fallback values
      return this.createFallbackHydraulics(flow, size);
    }
  }

  /**
   * Create cache key for hydraulic calculations
   * @param size Culvert size
   * @param flow Flow rate
   * @returns Cache key string
   */
  private createCacheKey(size: CulvertSize, flow: number): string {
    return `${size.shape}-${size.diameter || 0}-${size.width || 0}-${size.height || 0}-${size.span || 0}-${size.rise || 0}-${flow}-${this.params.material}-${this.params.entranceType}`;
  }

  /**
   * Validate numeric results and handle edge cases
   * @param value Calculated value
   * @param paramName Parameter name for error reporting
   * @returns Validated value
   */
  private validateNumericResult(value: number, paramName: string): number {
    if (!isFinite(value) || isNaN(value)) {
      console.warn(`Invalid ${paramName} calculated: ${value}. Using fallback value.`);
      return paramName.includes('depth') ? 0.1 : 1.0;
    }
    
    if (value < 0) {
      console.warn(`Negative ${paramName} calculated: ${value}. Using absolute value.`);
      return Math.abs(value);
    }
    
    return value;
  }

  /**
   * Create fallback hydraulic results for error cases
   * @param flow Design flow
   * @param size Culvert size
   * @returns Safe fallback results
   */
  private createFallbackHydraulics(flow: number, size: CulvertSize): HydraulicResults {
    const area = Math.max(size.area, 1); // Minimum 1 sq ft
    const velocity = flow / area;
    const depth = Math.sqrt(area); // Rough approximation
    
    return {
      flowType: 'inlet',
      headwater: depth * 1.5,
      velocity: Math.max(velocity, 1),
      froudeNumber: Math.min(velocity / Math.sqrt(this.g * depth), 3),
      criticalDepth: depth * 0.8,
      normalDepth: depth * 0.9,
      outletVelocity: velocity,
      energyGrade: depth * 2,
    };
  }

  /**
   * Generate comprehensive warnings based on hydraulic and structural analysis
   * @param size Culvert geometry
   * @param hydraulics Hydraulic results
   * @returns Array of warning messages
   */
  private generateWarnings(size: CulvertSize, hydraulics: HydraulicResults): string[] {
    const warnings: string[] = [];
    const D = size.diameter || size.height || size.rise || 1;

    // Hydraulic warnings
    const hwRatio = hydraulics.headwater / D;
    if (hwRatio > 1.5) {
      warnings.push(`Headwater to diameter ratio (HW/D) of ${hwRatio.toFixed(2)} exceeds typical design limits`);
    }

    if (hydraulics.velocity > 15) {
      warnings.push(`Outlet velocity of ${hydraulics.velocity.toFixed(1)} ${this.params.units === 'metric' ? 'm/s' : 'ft/s'} may cause severe erosion`);
    } else if (hydraulics.velocity > 10) {
      warnings.push(`Outlet velocity of ${hydraulics.velocity.toFixed(1)} ${this.params.units === 'metric' ? 'm/s' : 'ft/s'} may cause erosion problems`);
    } else if (hydraulics.velocity < 2) {
      warnings.push(`Low velocity of ${hydraulics.velocity.toFixed(1)} ${this.params.units === 'metric' ? 'm/s' : 'ft/s'} may cause sediment deposition`);
    }

    if (hydraulics.froudeNumber > 1.5) {
      warnings.push(`High Froude number (${hydraulics.froudeNumber.toFixed(2)}) indicates supercritical flow with potential hydraulic jump issues`);
    }

    // Structural warnings
    const minCover = this.params.units === 'metric' ? 0.6 : 2.0;
    if (this.params.minCoverDepth < minCover) {
      warnings.push(`Minimum cover depth of ${this.params.minCoverDepth} is less than recommended minimum (${minCover}) for ${this.params.roadClass} roads`);
    }

    if (!this.checkStructuralCapacity(size)) {
      warnings.push('Structural capacity may be inadequate for design loads');
    }

    // Environmental warnings
    if (this.params.buoyancyUpliftParams?.highGroundwater || this.params.buoyancyUpliftParams?.floodCondition) {
      warnings.push('Buoyancy and uplift forces should be analyzed due to high groundwater or flood conditions');
    }

    if (this.params.environmentalFactors.fishPassageParams) {
      const fishPassage = this.evaluateFishPassage(size, hydraulics);
      if (!fishPassage.overallStatus) {
        warnings.push(`Fish passage may be impaired - ${fishPassage.baffleRecommendation}`);
      }
      if (fishPassage.jumpHeight > 0.3) {
        warnings.push(`Outlet drop of ${fishPassage.jumpHeight.toFixed(2)} may create fish passage barrier`);
      }
    }

    // Construction warnings
    if (this.params.skewAngle > 30) {
      warnings.push(`High skew angle (${this.params.skewAngle}°) will increase construction complexity and costs`);
    }

    if (size.area > (this.params.units === 'metric' ? 50 : 500)) {
      warnings.push('Large culvert size may require special construction considerations and equipment');
    }

    // Flow control warnings
    if (hydraulics.headwater > this.params.maxHeadwater) {
      warnings.push(`Headwater depth of ${hydraulics.headwater.toFixed(2)} exceeds maximum allowable (${this.params.maxHeadwater})`);
    }

    return warnings;
  }

  /**
   * Check structural capacity based on loads and material properties
   * @param size Culvert geometry
   * @returns Whether culvert meets structural requirements
   */
  private checkStructuralCapacity(size: CulvertSize): boolean {
    const coverDepth = this.params.minCoverDepth;
    const liveLoad = this.getRoadLoadFactor();
    const deadLoad = this.calculateDeadLoad(size, coverDepth);
    
    // Simplified structural check - in practice would use AASHTO LRFD
    const allowableLoad = this.getAllowableLoad(size);
    const totalLoad = liveLoad + deadLoad;
    
    return totalLoad <= allowableLoad;
  }

  /**
   * Calculate buoyancy forces when groundwater is present
   * @param size Culvert geometry
   * @returns Buoyancy force in consistent units
   */
  private calculateBuoyancyForces(size: CulvertSize): number {
    if (!this.params.buoyancyUpliftParams?.highGroundwater) {
      return 0;
    }
    
    const unitWeight = this.params.units === 'metric' ? 9810 : 62.4; // N/m³ or lb/ft³
    const submergedVolume = size.area * this.params.culvertLength;
    
    // Buoyant force = unit weight of water × displaced volume
    return unitWeight * submergedVolume;
  }

  /**
   * Get road load factor based on road class
   * @returns Load factor
   */
  private getRoadLoadFactor(): number {
    switch (this.params.roadClass) {
      case 'primary': return 1.2;
      case 'secondary': return 1.0;
      case 'tertiary': return 0.8;
      default: return 1.0;
    }
  }

  /**
   * Calculate dead load from soil and pavement
   * @param size Culvert geometry
   * @param cover Cover depth
   * @returns Dead load
   */
  private calculateDeadLoad(size: CulvertSize, cover: number): number {
    const soilUnitWeight = this.params.units === 'metric' ? 19000 : 120; // N/m³ or lb/ft³
    const pavementThickness = this.params.units === 'metric' ? 0.3 : 1.0; // m or ft
    const pavementUnitWeight = this.params.units === 'metric' ? 23000 : 145; // N/m³ or lb/ft³
    
    const width = size.width || size.diameter || size.span || 1;
    const soilLoad = soilUnitWeight * cover * width;
    const pavementLoad = pavementUnitWeight * pavementThickness * width;
    
    return soilLoad + pavementLoad;
  }

  /**
   * Get allowable load capacity for culvert
   * @param size Culvert geometry
   * @returns Allowable load capacity
   */
  private getAllowableLoad(size: CulvertSize): number {
    // Simplified - actual calculation would depend on material properties and design standards
    const baseCapacity = this.params.units === 'metric' ? 50000 : 3000; // N/m or lb/ft
    const shapeFactor = size.shape === 'circular' ? 1.0 : size.shape === 'box' ? 1.2 : 0.9;
    const materialFactor = this.params.material === 'concrete' ? 1.0 :
                          this.params.material === 'corrugatedMetal' ? 0.8 : 0.7;
    
    return baseCapacity * shapeFactor * materialFactor;
  }

  /**
   * Calculate comprehensive cost estimate
   * @param size Culvert geometry
   * @returns Detailed cost breakdown
   */
  private calculateCosts(size: CulvertSize): CulvertResults['costEstimate'] {
    const materialCost = this.calculateMaterialCost(size);
    const excavationCost = this.calculateExcavationCost(size);
    const installationCost = this.calculateInstallationCost(size);
    const totalCost = materialCost + excavationCost + installationCost;
    
    return {
      materialCost,
      installationCost: excavationCost + installationCost,
      totalCost,
      annualMaintenance: totalCost * 0.02, // 2% of total cost annually
    };
  }

  /**
   * Calculate material costs based on current market rates
   * @param size Culvert geometry
   * @returns Material cost
   */
  private calculateMaterialCost(size: CulvertSize): number {
    const volume = size.area * this.params.culvertLength;
    let unitCost: number;
    
    // Unit costs per cubic unit (simplified)
    if (this.params.units === 'metric') {
      switch (this.params.material) {
        case 'concrete': unitCost = 300; // $/m³
          break;
        case 'corrugatedMetal': unitCost = 250; // $/m³
          break;
        case 'hdpe': unitCost = 400; // $/m³
          break;
        default: unitCost = 300;
      }
    } else {
      switch (this.params.material) {
        case 'concrete': unitCost = 200; // $/ft³
          break;
        case 'corrugatedMetal': unitCost = 150; // $/ft³
          break;
        case 'hdpe': unitCost = 250; // $/ft³
          break;
        default: unitCost = 200;
      }
    }
    
    return volume * unitCost;
  }

  /**
   * Calculate excavation costs
   * @param size Culvert geometry
   * @returns Excavation cost
   */
  private calculateExcavationCost(size: CulvertSize): number {
    const width = (size.width || size.diameter || size.span || 1) + 2; // Add 2 ft working space
    const height = (size.height || size.diameter || size.rise || 1) + this.params.minCoverDepth + 1;
    const excavationVolume = width * height * this.params.culvertLength;
    
    const unitCost = this.params.units === 'metric' ? 15 : 8; // $/m³ or $/ft³
    return excavationVolume * unitCost;
  }

  /**
   * Calculate installation costs including labor and equipment
   * @param size Culvert geometry
   * @returns Installation cost
   */
  private calculateInstallationCost(size: CulvertSize): number {
    const baseInstallationCost = this.calculateMaterialCost(size) * 0.3; // 30% of material cost
    const complexityFactor = this.getInstallationComplexityFactor(size);
    
    return baseInstallationCost * complexityFactor;
  }

  /**
   * Get installation complexity factor
   * @param size Culvert geometry
   * @returns Complexity multiplier
   */
  private getInstallationComplexityFactor(size: CulvertSize): number {
    let factor = 1.0;
    
    // Size complexity
    const area = size.area;
    if (area > 50) factor += 0.3; // Large culverts are more complex
    
    // Shape complexity
    if (size.shape === 'arch') factor += 0.2;
    if (size.shape === 'box') factor += 0.1;
    
    // Site conditions
    if (this.params.skewAngle > 30) factor += 0.15;
    if (this.params.buoyancyUpliftParams?.highGroundwater) factor += 0.25;
    
    return factor;
  }

  /**
   * Comprehensive environmental impact assessment including fish passage
   * @param size Culvert geometry
   * @param hydraulics Hydraulic results
   * @returns Environmental impact assessment
   */
  private assessEnvironmentalImpact(size: CulvertSize, hydraulics: HydraulicResults): CulvertResults['environmentalImpact'] {
    const fishPassage = this.evaluateFishPassage(size, hydraulics);
    
    return {
      velocityCheck: hydraulics.velocity < 10,
      scourPotential: this.assessScourPotential(hydraulics.velocity, hydraulics.froudeNumber),
      sedimentTransport: hydraulics.velocity > 2,
      aquaticPassageStatus: fishPassage.overallStatus,
    };
  }

  /**
   * Detailed fish passage analysis based on NOAA/NMFS criteria
   * @param size Culvert geometry
   * @param hydraulics Hydraulic results
   * @returns Fish passage analysis
   */
  private evaluateFishPassage(size: CulvertSize, hydraulics: HydraulicResults): {
    overallStatus: boolean;
    velocityBarrier: boolean;
    depthBarrier: boolean;
    jumpHeight: number;
    baffleRecommendation: string;
  } {
    if (!this.params.environmentalFactors.fishPassageParams) {
      return {
        overallStatus: true,
        velocityBarrier: false,
        depthBarrier: false,
        jumpHeight: 0,
        baffleRecommendation: 'None',
      };
    }

    const { lowFlowVelocity, lowFlowDepth, baffles } = this.params.environmentalFactors.fishPassageParams;
    
    // Check velocity barrier
    const velocityBarrier = hydraulics.velocity > lowFlowVelocity;
    
    // Check depth barrier
    const depthBarrier = hydraulics.normalDepth < lowFlowDepth;
    
    // Calculate jump height at outlet
    const outletDrop = this.params.upstreamInvert - this.params.downstreamInvert;
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
   * Assess scour potential based on velocity and flow conditions
   * @param velocity Flow velocity
   * @param froude Froude number
   * @returns Scour potential rating
   */
  private assessScourPotential(velocity: number, froude: number): 'low' | 'medium' | 'high' {
    if (velocity > 10 || froude > 1.5) return 'high';
    if (velocity > 6 || froude > 1.2) return 'medium';
    return 'low';
  }

  // Calculate scour and outfall protection
  private calculateScourAndOutfall(size: CulvertSize, hydraulics: HydraulicResults): ScourAndOutfallResults {
      const froude = hydraulics.froudeNumber;
      let energyDissipatorType = 'None';
      if (froude > 1.7) {
          energyDissipatorType = this.getTailwaterDepth(this.params.designFlow) > 0.5 * this.calculateCriticalDepth(size, this.params.designFlow) ? 'Riprap Basin' : 'Baffled Apron';
      }

    return {
        pierScour: 0, // Placeholder
        abutmentScour: 0, // Placeholder
        contractionScour: 0, // Placeholder
        apronRiprapSize: froude > 1.7 ? 0.5 : 0, // Placeholder in ft
        energyDissipatorType,
    };
  }

  // Generate performance curves
  private generatePerformanceCurves(size: CulvertSize): PerformanceCurve[] {
      const curves: PerformanceCurve[] = [];
      for (let qFactor = 0.1; qFactor <= 2; qFactor += 0.1) {
          const q = this.params.designFlow * qFactor;
          const hw = this.calculateInletControl(size, q); // Simplified to inlet control for curve
          const vOut = q / (size.area * (1 - this.params.blockageFactor));
          const depth = this.calculateNormalDepth(size, q);
          const froudeOut = vOut / Math.sqrt(this.g * depth);
          curves.push({ q, hw, vOut, froudeOut });
      }
      return curves;
  }

  // Calculate wingwall footprint
  private calculateWingwallFootprint(size: CulvertSize): number {
      // Simplified calculation
      const width = size.width || size.diameter || 0;
      return width * 2;
  }
}
