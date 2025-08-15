import { ChannelInputs, RatingCurvePoint, CalculationResult } from './types';
import { calculateHydraulicProperties } from './geometry';
import { solveRobust } from './solver';

/**
 * Generate a rating curve for the channel
 */
export function generateRatingCurve(
  inputs: ChannelInputs,
  options: {
    minFlow?: number;
    maxFlow?: number;
    numberOfPoints?: number;
    flowMultipliers?: number[];
  } = {}
): CalculationResult<RatingCurvePoint[]> {
  const {
    minFlow = inputs.flowRate * 0.1,
    maxFlow = inputs.flowRate * 2.0,
    numberOfPoints = 20,
    flowMultipliers
  } = options;

  try {
    const { slope, manningN, geometry, units } = inputs;
    const unitConversion = units === 'metric' ? 1.0 : 1.486;
    
    // Generate flow rates
    let flowRates: number[];
    if (flowMultipliers) {
      flowRates = flowMultipliers.map(mult => inputs.flowRate * mult);
    } else {
      flowRates = [];
      const flowIncrement = (maxFlow - minFlow) / (numberOfPoints - 1);
      for (let i = 0; i < numberOfPoints; i++) {
        flowRates.push(minFlow + i * flowIncrement);
      }
    }

    const ratingPoints: RatingCurvePoint[] = [];
    const errors: any[] = [];

    for (const flowRate of flowRates) {
      if (flowRate <= 0) continue;

      // Create Manning's equation for this flow rate
      const manningFunction = (depth: number): number => {
        if (depth <= 0) return -flowRate;
        
        try {
          const props = calculateHydraulicProperties(geometry, depth);
          if (props.wettedPerimeter === 0) return -flowRate;
          
          const conveyance = (unitConversion / manningN) * props.area * 
                           Math.pow(props.hydraulicRadius, 2/3);
          const calculatedFlow = conveyance * Math.pow(slope, 0.5);
          
          return calculatedFlow - flowRate;
        } catch (error) {
          return -flowRate;
        }
      };

      // Solve for depth
      const depthResult = solveRobust(manningFunction, {
        tolerance: 1e-6,
        maxIterations: 50,
        bracket: { lower: 0.001, upper: 50 }
      });

      if (depthResult.converged) {
        const depth = depthResult.value;
        const props = calculateHydraulicProperties(geometry, depth);
        const velocity = flowRate / props.area;

        ratingPoints.push({
          flow: flowRate,
          depth,
          velocity,
          area: props.area
        });
      } else {
        errors.push({
          field: 'calculation',
          message: `Failed to calculate depth for flow rate ${flowRate.toFixed(2)}`,
          severity: 'warning'
        });
      }
    }

    if (ratingPoints.length === 0) {
      return {
        success: false,
        errors: [{
          field: 'rating-curve',
          message: 'Failed to generate any points for the rating curve',
          severity: 'error'
        }]
      };
    }

    return {
      success: true,
      data: ratingPoints,
      warnings: errors.length > 0 ? errors.map(e => e.message) : undefined
    };

  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'rating-curve',
        message: error instanceof Error ? error.message : 'Unknown error generating rating curve',
        severity: 'error'
      }]
    };
  }
}

/**
 * Generate optimized rating curve with adaptive point spacing
 */
export function generateOptimizedRatingCurve(
  inputs: ChannelInputs,
  targetPoints: number = 25
): CalculationResult<RatingCurvePoint[]> {
  // Start with a basic curve to understand the flow range
  const basicCurve = generateRatingCurve(inputs, {
    numberOfPoints: 10,
    minFlow: inputs.flowRate * 0.2,
    maxFlow: inputs.flowRate * 1.8
  });

  if (!basicCurve.success || !basicCurve.data) {
    return basicCurve;
  }

  // Analyze the curve to find regions needing more points
  const basicPoints = basicCurve.data;
  const adaptiveFlows: number[] = [];

  // Always include the design flow
  adaptiveFlows.push(inputs.flowRate);

  // Add more points in regions with high curvature
  for (let i = 1; i < basicPoints.length - 1; i++) {
    const prev = basicPoints[i - 1];
    const curr = basicPoints[i];
    const next = basicPoints[i + 1];

    // Calculate second derivative approximation (curvature)
    const d2y = (next.depth - 2 * curr.depth + prev.depth) / 
                Math.pow((next.flow - prev.flow) / 2, 2);

    // If curvature is high, add intermediate points
    if (Math.abs(d2y) > 0.01) {
      const midFlow1 = (prev.flow + curr.flow) / 2;
      const midFlow2 = (curr.flow + next.flow) / 2;
      adaptiveFlows.push(midFlow1, midFlow2);
    }

    adaptiveFlows.push(curr.flow);
  }

  // Add boundary points
  adaptiveFlows.push(basicPoints[0].flow);
  adaptiveFlows.push(basicPoints[basicPoints.length - 1].flow);

  // Remove duplicates and sort
  const uniqueFlows = [...new Set(adaptiveFlows)].sort((a, b) => a - b);

  // Limit to target number of points
  let finalFlows: number[];
  if (uniqueFlows.length > targetPoints) {
    // Keep the most important points (design flow and boundaries)
    const step = Math.floor(uniqueFlows.length / targetPoints);
    finalFlows = uniqueFlows.filter((_, index) => 
      index % step === 0 || 
      Math.abs(uniqueFlows[index] - inputs.flowRate) < inputs.flowRate * 0.01
    ).slice(0, targetPoints);
  } else {
    finalFlows = uniqueFlows;
  }

  // Generate the final optimized curve
  return generateRatingCurve(inputs, {
    flowMultipliers: finalFlows.map(flow => flow / inputs.flowRate)
  });
}

/**
 * Interpolate depth from rating curve for a given flow rate
 */
export function interpolateFromRatingCurve(
  ratingCurve: RatingCurvePoint[],
  flowRate: number
): { depth: number; velocity: number; area: number } | null {
  if (ratingCurve.length === 0) return null;

  // Sort by flow rate to ensure proper interpolation
  const sortedCurve = [...ratingCurve].sort((a, b) => a.flow - b.flow);

  // Check if flow rate is outside the range
  if (flowRate < sortedCurve[0].flow || flowRate > sortedCurve[sortedCurve.length - 1].flow) {
    return null;
  }

  // Find the bracketing points
  for (let i = 0; i < sortedCurve.length - 1; i++) {
    const lower = sortedCurve[i];
    const upper = sortedCurve[i + 1];

    if (flowRate >= lower.flow && flowRate <= upper.flow) {
      // Linear interpolation
      const factor = (flowRate - lower.flow) / (upper.flow - lower.flow);
      
      return {
        depth: lower.depth + factor * (upper.depth - lower.depth),
        velocity: lower.velocity + factor * (upper.velocity - lower.velocity),
        area: lower.area + factor * (upper.area - lower.area)
      };
    }
  }

  return null;
}

/**
 * Export rating curve data for external use (CSV format)
 */
export function exportRatingCurveCSV(
  ratingCurve: RatingCurvePoint[],
  units: 'metric' | 'imperial'
): string {
  const flowUnit = units === 'metric' ? 'm³/s' : 'ft³/s';
  const lengthUnit = units === 'metric' ? 'm' : 'ft';
  const areaUnit = units === 'metric' ? 'm²' : 'ft²';
  const velocityUnit = units === 'metric' ? 'm/s' : 'ft/s';

  let csv = `Flow Rate (${flowUnit}),Depth (${lengthUnit}),Velocity (${velocityUnit}),Area (${areaUnit})\n`;
  
  ratingCurve.forEach(point => {
    csv += `${point.flow.toFixed(3)},${point.depth.toFixed(3)},${point.velocity.toFixed(3)},${point.area.toFixed(3)}\n`;
  });

  return csv;
}