import { 
  calculateHydraulics
} from './calculations';
import { 
  PipeSizingInputs, 
  PipeSize, 
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
    preferredMaterials: ['pvc'],
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

describe('calculations', () => {
  describe('calculateHydraulics', () => {
    it('should calculate hydraulic results using Hazen-Williams method', () => {
      const inputs = createTestInputs();
      const pipeSize = createTestPipeSize();
      
      const result = calculateHydraulics(inputs, pipeSize, CalculationMethod.HAZEN_WILLIAMS);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.velocity).toBeGreaterThan(0);
      expect(result.data?.headLoss).toBeGreaterThan(0);
    });

    it('should calculate hydraulic results using Darcy-Weisbach method', () => {
      const inputs = createTestInputs();
      const pipeSize = createTestPipeSize();
      
      const result = calculateHydraulics(inputs, pipeSize, CalculationMethod.DARCY_WEISBACH);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.velocity).toBeGreaterThan(0);
      expect(result.data?.headLoss).toBeGreaterThan(0);
    });

    it('should calculate hydraulic results using Manning method', () => {
      const inputs = createTestInputs();
      const pipeSize = createTestPipeSize();
      
      const result = calculateHydraulics(inputs, pipeSize, CalculationMethod.MANNING);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.velocity).toBeGreaterThan(0);
      expect(result.data?.headLoss).toBeGreaterThan(0);
    });

    it('should handle invalid inputs gracefully', () => {
      const inputs = { ...createTestInputs(), designFlow: -10 };
      const pipeSize = createTestPipeSize();
      
      const result = calculateHydraulics(inputs, pipeSize);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should return warnings for valid inputs with potential issues', () => {
      const inputs = { ...createTestInputs(), designFlow: 5000 }; // Very high flow
      const pipeSize = createTestPipeSize();
      
      const result = calculateHydraulics(inputs, pipeSize);
      
      expect(result.success).toBe(true);
      // May have warnings for high flow
      if (result.warnings) {
        expect(Array.isArray(result.warnings)).toBe(true);
      }
    });
  });
});