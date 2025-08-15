// Import types for internal use
import type {
  PipeSizingInputs,
  PipeSizingResults,
  PipeSizingResult,
  PipeSize,
  PipeMaterial,
  PipeMaterialProperties,
  HydraulicResults,
  EconomicResults,
  SystemType,
  InstallationMethod,
  PipeFitting,
  FlowRegime,
  CalculationMethod,
  CalculationResult,
  ValidationError,
  StandardSizeRange
} from './types';

// Import classes and functions for internal use
import { PipeSizingCalculator } from './pipe-calculator';
import {
  getMaterialProperties,
  findPipeSize
} from './standard-sizes';

// Main exports for pipe sizing module
export { PipeSizingCalculator } from './pipe-calculator';
export { calculateHydraulics } from './calculations';

// Type exports
export type {
  PipeSizingInputs,
  PipeSizingResults,
  PipeSizingResult,
  PipeSize,
  PipeMaterial,
  PipeMaterialProperties,
  HydraulicResults,
  EconomicResults,
  SystemType,
  InstallationMethod,
  PipeFitting,
  FlowRegime,
  CalculationMethod,
  CalculationResult,
  ValidationError,
  StandardSizeRange
} from './types';

// Database exports
export {
  getAvailableSizes,
  getAllAvailableSizes,
  findPipeSize,
  getMaterialProperties,
  isCommonSize,
  getSizeAvailability,
  MATERIAL_PROPERTIES,
  STANDARD_PIPE_SIZES,
  STANDARD_SIZE_RANGES
} from './standard-sizes';

// Utility functions for component integration
export function createDefaultPipeSizingInputs(units: 'imperial' | 'metric' = 'imperial'): PipeSizingInputs {
  return {
    designFlow: 0,
    pipeLength: 0,
    elevationChange: 0,
    systemType: 'pressure',
    safetyFactor: 1.2,
    preferredMaterials: ['pvc', 'ductileIron'],
    fittings: [],
    installationMethod: 'trench',
    projectLife: 50,
    discountRate: 5,
    temperature: units === 'metric' ? 20 : 68,
    fluidType: 'water',
    corrosiveEnvironment: false,
    units
  };
}

export function validatePipeSizingInputs(inputs: Partial<PipeSizingInputs>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!inputs.designFlow || inputs.designFlow <= 0) {
    errors.push('Design flow rate is required and must be positive');
  }

  if (!inputs.pipeLength || inputs.pipeLength <= 0) {
    errors.push('Pipe length is required and must be positive');
  }

  if (!inputs.preferredMaterials || inputs.preferredMaterials.length === 0) {
    errors.push('At least one preferred material must be selected');
  }

  // Range validation
  if (inputs.designFlow && inputs.units) {
    const maxFlow = inputs.units === 'metric' ? 10000 : 40000; // L/s or gpm
    if (inputs.designFlow > maxFlow) {
      warnings.push(`Design flow (${inputs.designFlow}) is very high - verify requirements`);
    }
  }

  if (inputs.pipeLength && inputs.units) {
    const maxLength = inputs.units === 'metric' ? 5000 : 16000; // m or ft
    if (inputs.pipeLength > maxLength) {
      warnings.push(`Pipe length (${inputs.pipeLength}) is unusually long`);
    }
  }

  if (inputs.safetyFactor && (inputs.safetyFactor < 1.0 || inputs.safetyFactor > 3.0)) {
    warnings.push('Safety factor should typically be between 1.0 and 3.0');
  }

  // Elevation change validation
  if (inputs.elevationChange && inputs.pipeLength) {
    const slope = Math.abs(inputs.elevationChange / inputs.pipeLength);
    if (slope > 0.3) {
      warnings.push('Very steep slope detected - verify elevation data');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Quick sizing function for simple use cases
export function quickPipeSizing(
  flowRate: number,
  pipeLength: number,
  material: PipeMaterial = 'pvc',
  units: 'imperial' | 'metric' = 'imperial'
): Promise<PipeSizingResult | null> {
  const inputs: PipeSizingInputs = {
    ...createDefaultPipeSizingInputs(units),
    designFlow: flowRate,
    pipeLength: pipeLength,
    preferredMaterials: [material]
  };

  const calculator = new PipeSizingCalculator(inputs);
  
  return new Promise((resolve) => {
    try {
      const result = calculator.calculateRecommendations();
      if (result.success && result.data && result.data.bestOption) {
        resolve(result.data.bestOption);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Quick pipe sizing failed:', error);
      resolve(null);
    }
  });
}

// Helper function to convert between units
export function convertPipeSizingUnits(
  inputs: PipeSizingInputs,
  targetUnits: 'imperial' | 'metric'
): PipeSizingInputs {
  if (inputs.units === targetUnits) {
    return { ...inputs };
  }

  const isToMetric = targetUnits === 'metric';
  const flowFactor = isToMetric ? 0.0630901684 : 15.8503; // gpm <-> L/s
  const lengthFactor = isToMetric ? 0.3048 : 3.28084; // ft <-> m
  const pressureFactor = isToMetric ? 6.89476 : 0.145038; // psi <-> kPa
  const velocityFactor = isToMetric ? 0.3048 : 3.28084; // ft/s <-> m/s
  const tempOffset = isToMetric ? -32 : 32;
  const tempFactor = isToMetric ? 5/9 : 9/5;

  return {
    ...inputs,
    designFlow: inputs.designFlow * flowFactor,
    pipeLength: inputs.pipeLength * lengthFactor,
    elevationChange: inputs.elevationChange * lengthFactor,
    operatingPressure: inputs.operatingPressure ? inputs.operatingPressure * pressureFactor : undefined,
    staticHead: inputs.staticHead ? inputs.staticHead * lengthFactor : undefined,
    maxHeadLoss: inputs.maxHeadLoss ? inputs.maxHeadLoss * lengthFactor : undefined,
    minVelocity: inputs.minVelocity ? inputs.minVelocity * velocityFactor : undefined,
    maxVelocity: inputs.maxVelocity ? inputs.maxVelocity * velocityFactor : undefined,
    frostDepth: inputs.frostDepth ? inputs.frostDepth * lengthFactor : undefined,
    temperature: isToMetric ? 
      (inputs.temperature + tempOffset) * tempFactor : 
      inputs.temperature * tempFactor + tempOffset,
    units: targetUnits
  };
}

// Material selection helper
export function recommendMaterials(
  systemType: SystemType,
  corrosiveEnvironment: boolean = false,
  highPressure: boolean = false
): PipeMaterial[] {
  const recommendations: PipeMaterial[] = [];

  switch (systemType) {
    case 'gravity':
      recommendations.push('pvc', 'concrete');
      if (!corrosiveEnvironment) {
        recommendations.push('ductileIron');
      }
      break;
    
    case 'pressure':
      if (corrosiveEnvironment) {
        recommendations.push('hdpe', 'pvc');
      } else if (highPressure) {
        recommendations.push('steel', 'ductileIron');
      } else {
        recommendations.push('pvc', 'ductileIron', 'hdpe');
      }
      break;
    
    case 'pumped':
      if (highPressure) {
        recommendations.push('steel', 'ductileIron');
      } else {
        recommendations.push('pvc', 'ductileIron', 'hdpe');
      }
      break;
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
}

// Cost estimation helper
export function estimatePipeCost(
  nominalDiameter: number,
  material: PipeMaterial,
  length: number,
  units: 'imperial' | 'metric' = 'imperial'
): {
  materialCost: number;
  installationCost: number;
  totalCost: number;
  costPerUnit: number;
} {
  const materialProps = getMaterialProperties(material);
  const pipeSize = findPipeSize(nominalDiameter, material);
  
  if (!pipeSize) {
    throw new Error(`Pipe size ${nominalDiameter}" not available in ${material}`);
  }

  // Simplified cost calculation
  const materialCostPerUnit = units === 'metric' ? 
    materialProps.costFactor * 150 : // $/m
    materialProps.costFactor * 50;   // $/ft

  const installationCostPerUnit = units === 'metric' ?
    100 + nominalDiameter * 2 : // $/m
    30 + nominalDiameter * 0.5;  // $/ft

  const materialCost = length * materialCostPerUnit;
  const installationCost = length * installationCostPerUnit;
  const totalCost = materialCost + installationCost;
  const costPerUnit = totalCost / length;

  return {
    materialCost,
    installationCost,
    totalCost,
    costPerUnit
  };
}