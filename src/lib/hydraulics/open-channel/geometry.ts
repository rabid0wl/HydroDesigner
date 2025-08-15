import { ChannelGeometry, HydraulicProperties } from './types';

/**
 * Calculate hydraulic properties for any channel shape at a given depth
 */
export function calculateHydraulicProperties(
  geometry: ChannelGeometry,
  depth: number
): HydraulicProperties {
  switch (geometry.shape) {
    case 'rectangular':
      if (!geometry.bottomWidth) throw new Error('Bottom width is required for rectangular channels');
      return calculateRectangularProperties(geometry.bottomWidth, depth);
    case 'trapezoidal':
      if (!geometry.bottomWidth) throw new Error('Bottom width is required for trapezoidal channels');
      return calculateTrapezoidalProperties(geometry.bottomWidth, geometry.sideSlope || 0, depth);
    case 'triangular':
      if (!geometry.sideSlope) throw new Error('Side slope is required for triangular channels');
      return calculateTriangularProperties(geometry.sideSlope, depth);
    case 'circular':
      if (!geometry.diameter) throw new Error('Diameter is required for circular channels');
      return calculateCircularProperties(geometry.diameter, depth);
    default:
      throw new Error(`Unsupported channel shape: ${geometry.shape}`);
  }
}

/**
 * Rectangular channel hydraulic properties
 */
export function calculateRectangularProperties(
  bottomWidth: number,
  depth: number
): HydraulicProperties {
  if (bottomWidth <= 0 || depth <= 0) {
    throw new Error('Width and depth must be positive');
  }

  const area = bottomWidth * depth;
  const wettedPerimeter = bottomWidth + 2 * depth;
  const hydraulicRadius = area / wettedPerimeter;
  const topWidth = bottomWidth;
  const hydraulicDepth = area / topWidth;

  return {
    area,
    wettedPerimeter,
    hydraulicRadius,
    topWidth,
    hydraulicDepth
  };
}

/**
 * Trapezoidal channel hydraulic properties
 */
export function calculateTrapezoidalProperties(
  bottomWidth: number,
  sideSlope: number,
  depth: number
): HydraulicProperties {
  if (bottomWidth <= 0 || depth <= 0 || sideSlope < 0) {
    throw new Error('Width, depth must be positive and side slope must be non-negative');
  }

  const area = (bottomWidth + sideSlope * depth) * depth;
  const wettedPerimeter = bottomWidth + 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
  const hydraulicRadius = area / wettedPerimeter;
  const topWidth = bottomWidth + 2 * sideSlope * depth;
  const hydraulicDepth = area / topWidth;

  return {
    area,
    wettedPerimeter,
    hydraulicRadius,
    topWidth,
    hydraulicDepth
  };
}

/**
 * Triangular channel hydraulic properties (V-shaped)
 */
export function calculateTriangularProperties(
  sideSlope: number,
  depth: number
): HydraulicProperties {
  if (depth <= 0 || sideSlope <= 0) {
    throw new Error('Depth and side slope must be positive for triangular channels');
  }

  const area = sideSlope * depth * depth;
  const wettedPerimeter = 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
  const hydraulicRadius = area / wettedPerimeter;
  const topWidth = 2 * sideSlope * depth;
  const hydraulicDepth = area / topWidth;

  return {
    area,
    wettedPerimeter,
    hydraulicRadius,
    topWidth,
    hydraulicDepth
  };
}

/**
 * Circular channel hydraulic properties (partially filled pipe)
 */
export function calculateCircularProperties(
  diameter: number,
  depth: number
): HydraulicProperties {
  if (diameter <= 0 || depth <= 0) {
    throw new Error('Diameter and depth must be positive');
  }

  if (depth > diameter) {
    throw new Error('Depth cannot exceed diameter for circular channels');
  }

  const radius = diameter / 2;
  const h = depth;
  const R = radius;

  // For partially filled circular pipe
  // θ = central angle in radians
  const theta = 2 * Math.acos((R - h) / R);
  
  const area = (R * R / 2) * (theta - Math.sin(theta));
  const wettedPerimeter = R * theta;
  const hydraulicRadius = area / wettedPerimeter;
  
  // Top width at water surface
  const topWidth = 2 * Math.sqrt(h * (2 * R - h));
  const hydraulicDepth = area / topWidth;

  return {
    area,
    wettedPerimeter,
    hydraulicRadius,
    topWidth,
    hydraulicDepth
  };
}

/**
 * Get the maximum depth for a given channel geometry
 */
export function getMaximumDepth(geometry: ChannelGeometry): number {
  switch (geometry.shape) {
    case 'circular':
      return geometry.diameter || 0;
    case 'rectangular':
    case 'trapezoidal':
    case 'triangular':
      return 50; // Practical maximum for open channels
    default:
      return 50;
  }
}

/**
 * Validate channel geometry parameters
 */
export function validateGeometry(geometry: ChannelGeometry): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (geometry.shape) {
    case 'rectangular':
      if (!geometry.bottomWidth || geometry.bottomWidth <= 0) {
        errors.push('Bottom width must be positive for rectangular channels');
      }
      break;

    case 'trapezoidal':
      if (!geometry.bottomWidth || geometry.bottomWidth <= 0) {
        errors.push('Bottom width must be positive for trapezoidal channels');
      }
      if (!geometry.sideSlope || geometry.sideSlope < 0) {
        errors.push('Side slope must be non-negative for trapezoidal channels');
      }
      break;

    case 'triangular':
      if (!geometry.sideSlope || geometry.sideSlope <= 0) {
        errors.push('Side slope must be positive for triangular channels');
      }
      break;

    case 'circular':
      if (!geometry.diameter || geometry.diameter <= 0) {
        errors.push('Diameter must be positive for circular channels');
      }
      break;

    default:
      errors.push(`Unsupported channel shape: ${geometry.shape}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate the hydraulically optimal dimensions for a trapezoidal channel
 */
export function getOptimalTrapezoidalDimensions(
  area: number,
  sideSlope: number
): { bottomWidth: number; depth: number } {
  // For minimum perimeter (most efficient section)
  // b = 2y(√(1 + z²) - z) where b = bottom width, y = depth, z = side slope
  
  const depth = Math.sqrt(area / (sideSlope + Math.sqrt(1 + sideSlope * sideSlope)));
  const bottomWidth = 2 * depth * (Math.sqrt(1 + sideSlope * sideSlope) - sideSlope);
  
  return { bottomWidth, depth };
}