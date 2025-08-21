import { PipeSizingCalculator } from './pipe-calculator';
import { 
  PipeSizingInputs, 
  PipeSize, 
  PipeMaterial,
  CalculationMethod
} from './types';

// Helper function to create test inputs
function createTestInputs(): PipeSizingInputs {
  return {
    designFlow: 100, // gpm
    pipeLength: 1000, // ft
    elevationChange: 0,
    systemType: 'pressure',
    safetyFactor: 1.2,
    preferredMaterials: ['pvc', 'ductileIron'],
    fittings: [],
    installationMethod: 'trench',
    projectLife: 50,
    discountRate: 5,
    temperature: 68, // °F
    fluidType: 'water',
    corrosiveEnvironment: false,
    units: 'imperial'
  };
}

// Helper function to create a test pipe size
function createTestPipeSize(): PipeSize {
  return {
    nominalDiameter: 6,
    internalDiameter: 6.235,
    wallThickness: 0.288,
    area: 0.212, // sq ft
    material: 'pvc',
    pressureClass: 'DR18',
    availableJoints: ['Bell & Spigot', 'Mechanical Joint']
  };
}

describe('PipeSizingCalculator', () => {
  let calculator: PipeSizingCalculator;
  let testInputs: PipeSizingInputs;

  beforeEach(() => {
    testInputs = createTestInputs();
    calculator = new PipeSizingCalculator(testInputs);
  });

  describe('constructor', () => {
    it('should create a new PipeSizingCalculator instance', () => {
      expect(calculator).toBeInstanceOf(PipeSizingCalculator);
    });

    it('should validate inputs', () => {
      const invalidInputs = { ...testInputs, designFlow: -10 };
      expect(() => new PipeSizingCalculator(invalidInputs)).toThrow();
    });
  });

  describe('calculateRecommendations', () => {
    it('should return calculation results', () => {
      const result = calculator.calculateRecommendations();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should handle cases with no available pipe sizes gracefully', () => {
      // Create inputs with no preferred materials - this should be caught by validation
      const inputsWithNoMaterials = { ...testInputs, preferredMaterials: [] };
      expect(() => new PipeSizingCalculator(inputsWithNoMaterials)).toThrow();
    });
  });

  describe('evaluatePipeSize', () => {
    it('should evaluate a pipe size and return results', () => {
      const pipeSize = createTestPipeSize();
      const result = calculator['evaluatePipeSize'](pipeSize);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.pipeSize).toEqual(pipeSize);
    });
  });

  describe('calculateEconomics', () => {
    it('should calculate economic results for a pipe size', () => {
      const pipeSize = createTestPipeSize();
      const hydraulicResult = {
        velocity: 5,
        headLoss: 10,
        totalHeadLoss: 10,
        pressureDrop: 4.33,
        reynoldsNumber: 100000,
        flowRegime: 'turbulent' as const,
        frictionFactor: 0.02,
        minorLosses: 0,
        majorLosses: 10
      };
      
      const economics = calculator['calculateEconomics'](pipeSize, hydraulicResult);
      
      expect(economics).toHaveProperty('materialCost');
      expect(economics).toHaveProperty('installationCost');
      expect(economics).toHaveProperty('excavationCost');
      expect(economics).toHaveProperty('fittingsCost');
      expect(economics).toHaveProperty('totalCapitalCost');
      expect(economics).toHaveProperty('lifeCycleCost');
    });
  });

  describe('evaluateDesignCriteria', () => {
    it('should evaluate if a pipe size meets design criteria', () => {
      const pipeSize = createTestPipeSize();
      const hydraulics = {
        velocity: 5,
        headLoss: 10,
        totalHeadLoss: 10,
        pressureDrop: 4.33,
        reynoldsNumber: 1000,
        flowRegime: 'turbulent' as const,
        frictionFactor: 0.02,
        minorLosses: 0,
        majorLosses: 10
      };
      
      const meetsCriteria = calculator['evaluateDesignCriteria'](pipeSize, hydraulics);
      expect(typeof meetsCriteria).toBe('boolean');
    });
  });

  describe('calculateSuitabilityScore', () => {
    it('should calculate a suitability score between 0 and 100', () => {
      const pipeSize = createTestPipeSize();
      const hydraulics = {
        velocity: 5,
        headLoss: 10,
        totalHeadLoss: 10,
        pressureDrop: 4.33,
        reynoldsNumber: 1000,
        flowRegime: 'turbulent' as const,
        frictionFactor: 0.02,
        minorLosses: 0,
        majorLosses: 10
      };
      const economics = {
        materialCost: 1000,
        installationCost: 500,
        excavationCost: 300,
        fittingsCost: 200,
        totalCapitalCost: 2000,
        annualEnergyCost: 100,
        lifeCycleCost: 5000,
        maintenanceCost: 100
      };
      
      const score = calculator['calculateSuitabilityScore'](pipeSize, hydraulics, economics);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});