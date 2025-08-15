export type PipeMaterial = 'pvc' | 'ductileIron' | 'steel' | 'hdpe' | 'concrete' | 'cast-iron';
export type SystemType = 'gravity' | 'pressure' | 'pumped';
export type FlowRegime = 'laminar' | 'transitional' | 'turbulent';
export type InstallationMethod = 'trench' | 'trenchless' | 'directional';

export interface PipeSize {
  nominalDiameter: number;    // inches or mm
  internalDiameter: number;   // inches or mm  
  wallThickness: number;      // inches or mm
  area: number;              // sq ft or sq m
  material: PipeMaterial;
  pressureClass?: string;    // e.g., 'DR17', 'Class 150'
  availableJoints: string[];
}

export interface PipeMaterialProperties {
  material: PipeMaterial;
  hazenWilliamsC: number;
  manningN: number;
  roughnessHeight: number;    // ft or mm (for Darcy-Weisbach)
  maxVelocity: number;        // ft/s or m/s
  minVelocity: number;        // ft/s or m/s
  maxPressure: number;        // psi or kPa
  thermalExpansion: number;   // in/in/°F or mm/mm/°C
  designLife: number;         // years
  costFactor: number;         // relative cost multiplier
}

export interface PipeSizingInputs {
  // Basic hydraulic parameters
  designFlow: number;         // gpm or L/s
  pipeLength: number;         // ft or m
  elevationChange: number;    // ft or m (positive = uphill)
  
  // System characteristics
  systemType: SystemType;
  operatingPressure?: number; // psi or kPa (for pressure systems)
  staticHead?: number;        // ft or m
  
  // Design criteria
  maxHeadLoss?: number;       // ft or m per 1000 units
  minVelocity?: number;       // ft/s or m/s (override material default)
  maxVelocity?: number;       // ft/s or m/s (override material default)
  safetyFactor: number;       // typically 1.1-1.5
  
  // Material preferences
  preferredMaterials: PipeMaterial[];
  excludedMaterials?: PipeMaterial[];
  
  // Fittings and appurtenances
  fittings: PipeFitting[];
  
  // Installation factors
  installationMethod: InstallationMethod;
  soilType?: string;
  trafficLoading?: string;
  frostDepth?: number;        // ft or m
  
  // Economic parameters
  projectLife: number;        // years
  discountRate: number;       // % (for NPV calculations)
  energyCost?: number;        // $/kWh
  
  // Environmental factors
  temperature: number;        // °F or °C
  fluidType: string;          // 'water', 'wastewater', etc.
  corrosiveEnvironment: boolean;
  
  units: 'imperial' | 'metric';
}

export interface PipeFitting {
  type: 'elbow-90' | 'elbow-45' | 'tee-branch' | 'tee-through' | 'gate-valve' | 'globe-valve' | 'check-valve' | 'reducer' | 'entrance' | 'exit';
  quantity: number;
  kValue?: number;            // Loss coefficient (if custom)
  diameter?: number;          // For reducers
}

export interface HydraulicResults {
  velocity: number;           // ft/s or m/s
  headLoss: number;           // ft or m per 1000 units length
  totalHeadLoss: number;      // ft or m
  pressureDrop: number;       // psi or kPa
  reynoldsNumber: number;
  flowRegime: FlowRegime;
  frictionFactor: number;
  minorLosses: number;        // ft or m
  majorLosses: number;        // ft or m
}

export interface EconomicResults {
  materialCost: number;       // $
  installationCost: number;   // $
  excavationCost: number;     // $
  fittingsCost: number;       // $
  totalCapitalCost: number;   // $
  annualEnergyCost?: number;  // $ (for pumped systems)
  lifeCycleCost: number;      // NPV
  maintenanceCost: number;    // $ annual
}

export interface PipeSizingResult {
  pipeSize: PipeSize;
  hydraulics: HydraulicResults;
  economics: EconomicResults;
  warnings: string[];
  suitabilityScore: number;   // 0-100
  meetsDesignCriteria: boolean;
  
  // Performance metrics
  headLossRatio: number;      // Actual/allowable
  velocityRatio: number;      // Actual/optimal
  capacityFactor: number;     // Design flow / maximum capacity
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

export interface PipeSizingResults {
  recommendations: PipeSizingResult[];
  bestOption: PipeSizingResult;
  alternativeOptions: PipeSizingResult[];
  summary: {
    totalOptions: number;
    viableOptions: number;
    costRange: { min: number; max: number };
    velocityRange: { min: number; max: number };
  };
  calculations: {
    timestamp: string;
    calculationTime: number; // ms
    cacheHits: number;
  };
}

export interface StandardSizeRange {
  material: PipeMaterial;
  sizes: PipeSize[];
  availability: {
    region: string;
    commonSizes: number[];    // Most readily available sizes
    specialOrderSizes: number[]; // Available but require special order
  };
}

export enum CalculationMethod {
  HAZEN_WILLIAMS = 'HAZEN_WILLIAMS',
  DARCY_WEISBACH = 'DARCY_WEISBACH',
  MANNING = 'MANNING'
}

export interface CalculationOptions {
  method: CalculationMethod;
  includeMinorLosses: boolean;
  temperatureCorrection: boolean;
  elevationCorrection: boolean;
  cacheResults: boolean;
}