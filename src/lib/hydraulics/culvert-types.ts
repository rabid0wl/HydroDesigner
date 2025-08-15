export type CulvertMaterial = 'concrete' | 'corrugatedMetal' | 'hdpe';
export type CulvertShape = 'circular' | 'box' | 'arch';
export type EntranceType = 'projecting' | 'headwall' | 'wingwall';
export type DebrisLoad = 'low' | 'medium' | 'high';
export type RoadClass = 'primary' | 'secondary' | 'tertiary';

export interface RatingCurvePoint {
  flow: number;
  depth: number;
}

export interface FishPassageParams {
  lowFlowVelocity: number;
  lowFlowDepth: number;
  baffles: boolean;
}

export interface BuoyancyUpliftParams {
  highGroundwater: boolean;
  floodCondition: boolean;
}

export interface CulvertParams {
  // Project Information
  projectName: string;
  location: string;
  designDate: string;

  // Design Flow Parameters
  designFlow: number; // cfs or m³/s
  returnPeriod: number; // years

  // Site Parameters
  upstreamInvert: number; // ft or m
  downstreamInvert: number; // ft or m
  culvertLength: number; // ft or m
  maxHeadwater: number; // ft or m
  tailwaterRatingCurve: RatingCurvePoint[];
  streamSlope: number; // ft/ft or m/m
  roadClass: RoadClass;
  skewAngle: number; // degrees

  // Physical Parameters
  material: CulvertMaterial;
  shape: CulvertShape;
  entranceType: EntranceType;
  multipleCulverts: number; // Number of barrels
  blockageFactor: number; // Factor for debris blockage
  unequalDistributionFactor?: number; // For multi-barrel
  entranceInteractionFactor?: number; // For multi-barrel

  // Site Constraints
  minCoverDepth: number; // ft or m
  maxWidth: number; // ft or m
  environmentalFactors: {
    debrisLoad: DebrisLoad;
    sedimentTransport: boolean;
    aquaticPassage: boolean;
    fishPassageParams?: FishPassageParams;
  };
  buoyancyUpliftParams?: BuoyancyUpliftParams;

  // Units
  units: 'english' | 'metric';
}

export interface CulvertSize {
  shape: CulvertShape;
  diameter?: number; // for circular
  width?: number; // for box
  height?: number; // for box
  span?: number; // for arch
  rise?: number; // for arch
  area: number;
}

export interface HydraulicResults {
  flowType: 'inlet' | 'outlet';
  headwater: number;
  velocity: number;
  froudeNumber: number;
  criticalDepth: number;
  normalDepth: number;
  outletVelocity: number;
  energyGrade: number;
}

export interface ScourAndOutfallResults {
  pierScour: number;
  abutmentScour: number;
  contractionScour: number;
  apronRiprapSize: number;
  energyDissipatorType: string;
}

export interface PerformanceCurve {
  q: number;
  hw: number;
  vOut: number;
  froudeOut: number;
  uncertainty?: number;
}

export interface AlternativeRanking {
  constructability: number; // weight
  maintenance: number; // weight
  hydraulicPerformance: number;
  cost: number;
  environmentalImpact: number;
  totalScore: number;
}

export interface CulvertResults {
  recommendedSize: CulvertSize;
  alternatives: {
    size: CulvertSize;
    ranking: AlternativeRanking;
  }[];
  hydraulicPerformance: HydraulicResults;
  scourAndOutfall: ScourAndOutfallResults;
  performanceCurves: PerformanceCurve[];
  warnings: string[];
  costEstimate: {
    materialCost: number;
    installationCost: number;
    totalCost: number;
    annualMaintenance: number;
  };
  environmentalImpact: {
    velocityCheck: boolean;
    scourPotential: 'low' | 'medium' | 'high';
    sedimentTransport: boolean;
    aquaticPassageStatus: boolean;
  };
  geometry: {
    wingwallFootprint: number;
  };
}

export interface ScenarioResult {
  shape: CulvertShape;
  size: CulvertSize;
  hydraulics: HydraulicResults;
  warnings: string[];
}
