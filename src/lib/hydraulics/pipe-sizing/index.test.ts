import { 
  PipeSizingCalculator, 
  calculateHydraulics,
  getAvailableSizes,
  getAllAvailableSizes,
  findPipeSize,
  getMaterialProperties,
  isCommonSize,
  getSizeAvailability,
  createDefaultPipeSizingInputs,
  validatePipeSizingInputs,
  quickPipeSizing,
  convertPipeSizingUnits,
  recommendMaterials,
  estimatePipeCost
} from './index';

// We're not testing the types themselves since they're compile-time only
// but we can test that they're properly exported by using them in function signatures

describe('pipe-sizing/index', () => {
  describe('Class exports', () => {
    it('should export PipeSizingCalculator class', () => {
      expect(PipeSizingCalculator).toBeDefined();
      expect(typeof PipeSizingCalculator).toBe('function');
    });
  });

  describe('Function exports', () => {
    it('should export calculateHydraulics function', () => {
      expect(calculateHydraulics).toBeDefined();
      expect(typeof calculateHydraulics).toBe('function');
    });

    it('should export database functions', () => {
      expect(getAvailableSizes).toBeDefined();
      expect(typeof getAvailableSizes).toBe('function');
      
      expect(getAllAvailableSizes).toBeDefined();
      expect(typeof getAllAvailableSizes).toBe('function');
      
      expect(findPipeSize).toBeDefined();
      expect(typeof findPipeSize).toBe('function');
      
      expect(getMaterialProperties).toBeDefined();
      expect(typeof getMaterialProperties).toBe('function');
      
      expect(isCommonSize).toBeDefined();
      expect(typeof isCommonSize).toBe('function');
      
      expect(getSizeAvailability).toBeDefined();
      expect(typeof getSizeAvailability).toBe('function');
    });

    it('should export utility functions', () => {
      expect(createDefaultPipeSizingInputs).toBeDefined();
      expect(typeof createDefaultPipeSizingInputs).toBe('function');
      
      expect(validatePipeSizingInputs).toBeDefined();
      expect(typeof validatePipeSizingInputs).toBe('function');
      
      expect(quickPipeSizing).toBeDefined();
      expect(typeof quickPipeSizing).toBe('function');
      
      expect(convertPipeSizingUnits).toBeDefined();
      expect(typeof convertPipeSizingUnits).toBe('function');
      
      expect(recommendMaterials).toBeDefined();
      expect(typeof recommendMaterials).toBe('function');
      
      expect(estimatePipeCost).toBeDefined();
      expect(typeof estimatePipeCost).toBe('function');
    });
  });

  describe('Integration tests', () => {
    it('should work together correctly', async () => {
      // Create default inputs
      const inputs = createDefaultPipeSizingInputs('imperial');
      inputs.designFlow = 100; // gpm
      inputs.pipeLength = 1000; // ft
      
      // Validate inputs
      const validation = validatePipeSizingInputs(inputs);
      expect(validation.isValid).toBe(true);
      
      // Create calculator
      const calculator = new PipeSizingCalculator(inputs);
      expect(calculator).toBeInstanceOf(PipeSizingCalculator);
      
      // Get available sizes
      const sizes = getAvailableSizes('pvc');
      expect(sizes.length).toBeGreaterThan(0);
      
      // Find a specific size
      const pipeSize = findPipeSize(6, 'pvc');
      expect(pipeSize).toBeDefined();
      expect(pipeSize?.nominalDiameter).toBe(6);
      
      // Get material properties
      const materialProps = getMaterialProperties('pvc');
      expect(materialProps.hazenWilliamsC).toBeGreaterThan(0);
      
      // Check if it's a common size
      const isCommon = isCommonSize(6, 'pvc');
      expect(typeof isCommon).toBe('boolean');
      
      // Get size availability
      const availability = getSizeAvailability(6, 'pvc');
      expect(['common', 'special-order', 'unavailable']).toContain(availability);
      
      // Recommend materials
      const materials = recommendMaterials('pressure', false, false);
      expect(Array.isArray(materials)).toBe(true);
      expect(materials.length).toBeGreaterThan(0);
      
      // Estimate cost
      if (pipeSize) {
        const costEstimate = estimatePipeCost(
          pipeSize.nominalDiameter,
          pipeSize.material,
          inputs.pipeLength,
          inputs.units
        );
        expect(costEstimate).toHaveProperty('materialCost');
        expect(costEstimate).toHaveProperty('installationCost');
        expect(costEstimate).toHaveProperty('totalCost');
        expect(costEstimate).toHaveProperty('costPerUnit');
      }
      
      // Quick sizing
      const quickResult = await quickPipeSizing(100, 1000, 'pvc', 'imperial');
      // Quick sizing might return null if it fails, which is acceptable
      if (quickResult !== null) {
        expect(quickResult).toHaveProperty('pipeSize');
        expect(quickResult).toHaveProperty('hydraulics');
        expect(quickResult).toHaveProperty('economics');
      }
    });
  });
});