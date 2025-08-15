export type ChannelShape = 'rectangular' | 'trapezoidal' | 'triangular' | 'circular';

export type FlowState = 'Subcritical' | 'Critical' | 'Supercritical';

export type LiningType = 'hard-surface' | 'earth-lining' | 'custom';

export interface ChannelGeometry {
  shape: ChannelShape;
  bottomWidth?: number; // b (required for rectangular/trapezoidal)
  sideSlope?: number; // z (H:1V for trapezoidal/triangular)
  diameter?: number; // D for circular channels
}

export interface FlowParameters {
  flowRate: number; // Q
  slope: number; // S
  manningN: number; // n
}

export interface ChannelInputs extends FlowParameters {
  geometry: ChannelGeometry;
  units: 'metric' | 'imperial';
}

export interface HydraulicProperties {
  area: number; // A
  wettedPerimeter: number; // P
  hydraulicRadius: number; // R = A/P
  topWidth: number; // T
  hydraulicDepth: number; // D = A/T
}

export interface HydraulicResults {
  normalDepth: number;
  velocity: number;
  froudeNumber: number;
  flowState: FlowState;
  reynoldsNumber: number;
  specificEnergy: number;
  criticalDepth: number;
  criticalSlope: number;
  hydraulicProperties: HydraulicProperties;
  freeboard: {
    lining: number;
    bank: number;
    controlling: number;
  };
  geometry: {
    totalDepth: number;
    topWidth: number;
  };
}

export interface SolverResult {
  value: number;
  converged: boolean;
  iterations: number;
  residual: number;
  error?: string;
}

export interface RatingCurvePoint {
  flow: number;
  depth: number;
  velocity: number;
  area: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CalculationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  warnings?: string[];
}

export enum CalculationError {
  NO_CONVERGENCE = 'NO_CONVERGENCE',
  INVALID_GEOMETRY = 'INVALID_GEOMETRY',
  SUPERCRITICAL_UNSTABLE = 'SUPERCRITICAL_UNSTABLE',
  INVALID_INPUTS = 'INVALID_INPUTS',
  PHYSICALLY_UNREALISTIC = 'PHYSICALLY_UNREALISTIC'
}

export interface ManningCoefficient {
  label: string;
  value: number;
  type: LiningType;
  description?: string;
  range?: { min: number; max: number };
}