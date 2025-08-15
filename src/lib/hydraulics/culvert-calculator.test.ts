import { CulvertCalculator } from './culvert-calculator';
import { CulvertParams, CulvertSize } from './culvert-types';
import { getAvailableSizes, isSizeAvailable, MATERIAL_PROPERTIES } from './standard-sizes';

const createTestParams = (overrides: Partial<CulvertParams> = {}): CulvertParams => ({
    projectName: 'Test Project',
    location: 'Test Location',
    designDate: new Date().toISOString().split('T')[0],
    designFlow: 100,
    returnPeriod: 25,
    upstreamInvert: 100,
    downstreamInvert: 98,
    culvertLength: 50,
    maxHeadwater: 10,
    tailwaterRatingCurve: [],
    streamSlope: 0.02,
    roadClass: 'primary',
    skewAngle: 0,
    material: 'concrete',
    shape: 'circular',
    entranceType: 'headwall',
    multipleCulverts: 1,
    blockageFactor: 0,
    minCoverDepth: 2,
    maxWidth: 20,
    environmentalFactors: {
      debrisLoad: 'low',
      sedimentTransport: false,
      aquaticPassage: false,
    },
    units: 'english',
    ...overrides
  });

describe('CulvertCalculator', () => {

  describe('Basic Functionality', () => {
    it('should return a list of valid culvert scenarios', () => {
      const params = createTestParams();
      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      expect(results).toBeDefined();
      expect(Object.keys(results).length).toBeGreaterThan(0);
    });

    it('should evaluate scenarios for all culvert shapes', () => {
      const params = createTestParams();
      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      expect(results.circular).toBeDefined();
      expect(results.box).toBeDefined();
      expect(results.arch).toBeDefined();
    });

    it('should sort results by headwater depth', () => {
      const params = createTestParams();
      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      if (results.circular && results.circular.length > 1) {
        for (let i = 1; i < results.circular.length; i++) {
          expect(results.circular[i].hydraulics.headwater)
            .toBeGreaterThanOrEqual(results.circular[i-1].hydraulics.headwater);
        }
      }
    });
  });

  describe('Input Validation', () => {
    it('should throw error for negative design flow', () => {
      expect(() => {
        new CulvertCalculator(createTestParams({ designFlow: -10 }));
      }).toThrow('Design flow must be positive');
    });

    it('should throw error for upstream invert lower than downstream', () => {
      expect(() => {
        new CulvertCalculator(createTestParams({
          upstreamInvert: 95,
          downstreamInvert: 100
        }));
      }).toThrow('Upstream invert must be higher than downstream invert');
    });

    it('should throw error for excessive blockage factor', () => {
      expect(() => {
        new CulvertCalculator(createTestParams({ blockageFactor: 0.8 }));
      }).toThrow('Blockage factor must be between 0 and 0.5');
    });

    it('should throw error for excessive skew angle', () => {
      expect(() => {
        new CulvertCalculator(createTestParams({ skewAngle: 60 }));
      }).toThrow('Skew angle must be between 0 and 45 degrees');
    });
  });

  describe('Hydraulic Calculations', () => {
    it('should calculate reasonable headwater values', () => {
      const params = createTestParams();
      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      if (results.circular && results.circular.length > 0) {
        const result = results.circular[0];
        expect(result.hydraulics.headwater).toBeGreaterThan(0);
        expect(result.hydraulics.headwater).toBeLessThan(params.maxHeadwater * 2);
      }
    });

    it('should calculate velocities within reasonable range', () => {
      const params = createTestParams();
      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      Object.values(results).forEach(shapeResults => {
        if (shapeResults) {
          shapeResults.forEach(result => {
            expect(result.hydraulics.velocity).toBeGreaterThan(0);
            expect(result.hydraulics.velocity).toBeLessThan(50); // 50 ft/s is very high
          });
        }
      });
    });

    it('should calculate Froude numbers correctly', () => {
      const params = createTestParams();
      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      Object.values(results).forEach(shapeResults => {
        if (shapeResults) {
          shapeResults.forEach(result => {
            expect(result.hydraulics.froudeNumber).toBeGreaterThan(0);
            expect(result.hydraulics.froudeNumber).toBeLessThan(10); // Very high Fr
          });
        }
      });
    });
  });

  describe('Environmental Features', () => {
    it('should evaluate fish passage when parameters are provided', () => {
      const params = createTestParams({
        environmentalFactors: {
          debrisLoad: 'low',
          sedimentTransport: false,
          aquaticPassage: true,
          fishPassageParams: {
            lowFlowVelocity: 4,
            lowFlowDepth: 0.5,
            baffles: false
          }
        }
      });

      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      // Should have scenarios and some may have fish passage warnings
      expect(Object.keys(results).length).toBeGreaterThan(0);
    });
  });

  describe('Different Materials', () => {
    const materials = ['concrete', 'corrugatedMetal', 'hdpe'] as const;

    materials.forEach(material => {
      it(`should handle ${material} material correctly`, () => {
        const params = createTestParams({ material });
        const calculator = new CulvertCalculator(params);
        const results = calculator.evaluateCulvertScenarios();

        expect(results).toBeDefined();
        expect(Object.keys(results).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Multiple Culverts', () => {
    it('should handle multiple culvert scenarios', () => {
      const params = createTestParams({
        multipleCulverts: 2,
        unequalDistributionFactor: 0.9
      });
      
      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      expect(results).toBeDefined();
      expect(Object.keys(results).length).toBeGreaterThan(0);
    });
  });

  describe('Units Handling', () => {
    it('should handle metric units correctly', () => {
      const params = createTestParams({
        units: 'metric',
        designFlow: 10, // m³/s
        upstreamInvert: 30, // m
        downstreamInvert: 29.5, // m
        culvertLength: 15, // m
        maxHeadwater: 3, // m
        minCoverDepth: 0.6 // m
      });

      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      expect(results).toBeDefined();
      expect(Object.keys(results).length).toBeGreaterThan(0);
    });
  });

  describe('Warning Generation', () => {
    it('should generate warnings for high velocities', () => {
      const params = createTestParams({
        designFlow: 1000, // Very high flow
        maxHeadwater: 20   // Allow high headwater to get scenarios
      });

      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      // Should have some results with velocity warnings
      let hasVelocityWarning = false;
      Object.values(results).forEach(shapeResults => {
        if (shapeResults) {
          shapeResults.forEach(result => {
            if (result.warnings.some(w => w.includes('velocity'))) {
              hasVelocityWarning = true;
            }
          });
        }
      });
      
      expect(hasVelocityWarning).toBe(true);
    });

    it('should generate warnings for low cover depth', () => {
      const params = createTestParams({
        minCoverDepth: 1.5 // Low cover that passes validation but triggers warning
      });

      const calculator = new CulvertCalculator(params);
      const results = calculator.evaluateCulvertScenarios();

      // Should have warnings about low cover
      let hasCoverWarning = false;
      Object.values(results).forEach(shapeResults => {
        if (shapeResults) {
          shapeResults.forEach(result => {
            if (result.warnings.some(w => w.includes('cover depth'))) {
              hasCoverWarning = true;
            }
          });
        }
      });
      
      expect(hasCoverWarning).toBe(true);
    });
  });
});

describe('Standard Sizes Database', () => {
  describe('Material-Specific Availability', () => {
    it('should return concrete circular sizes', () => {
      const sizes = getAvailableSizes('concrete', 'circular');
      expect(sizes.length).toBeGreaterThan(10);
      expect(sizes.every(s => s.shape === 'circular')).toBe(true);
    });

    it('should return HDPE sizes only for circular culverts', () => {
      const circularSizes = getAvailableSizes('hdpe', 'circular');
      const boxSizes = getAvailableSizes('hdpe', 'box');
      
      expect(circularSizes.length).toBeGreaterThan(5);
      expect(boxSizes.length).toBe(0);
    });

    it('should validate size availability correctly', () => {
      const concreteSize: CulvertSize = {
        shape: 'circular',
        diameter: 3, // 36" diameter
        area: Math.PI * 1.5 * 1.5
      };

      expect(isSizeAvailable(concreteSize, 'concrete')).toBe(true);
      
      const invalidSize: CulvertSize = {
        shape: 'circular',
        diameter: 13.5, // Non-standard size
        area: Math.PI * 6.75 * 6.75
      };

      expect(isSizeAvailable(invalidSize, 'concrete')).toBe(false);
    });
  });

  describe('Material Properties', () => {
    it('should have properties for all materials', () => {
      expect(MATERIAL_PROPERTIES.concrete).toBeDefined();
      expect(MATERIAL_PROPERTIES.corrugatedMetal).toBeDefined();
      expect(MATERIAL_PROPERTIES.hdpe).toBeDefined();
    });

    it('should have reasonable property values', () => {
      expect(MATERIAL_PROPERTIES.concrete.designLife).toBeGreaterThan(50);
      expect(MATERIAL_PROPERTIES.hdpe.designLife).toBeGreaterThan(75);
      expect(MATERIAL_PROPERTIES.corrugatedMetal.designLife).toBeGreaterThan(30);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle very small flows gracefully', () => {
    const params = createTestParams({
      designFlow: 1, // Very small flow
    });

    const calculator = new CulvertCalculator(params);
    const results = calculator.evaluateCulvertScenarios();

    expect(results).toBeDefined();
    // Should still return some viable options
    expect(Object.keys(results).length).toBeGreaterThan(0);
  });

  it('should handle steep slopes', () => {
    const params = createTestParams({
      upstreamInvert: 100,
      downstreamInvert: 95, // 5 ft drop over 50 ft = 10% slope
      culvertLength: 50
    });

    // Should not throw but may generate warnings
    const calculator = new CulvertCalculator(params);
    const results = calculator.evaluateCulvertScenarios();

    expect(results).toBeDefined();
  });

  it('should handle tailwater rating curves', () => {
    const params = createTestParams({
      tailwaterRatingCurve: [
        { flow: 50, depth: 2 },
        { flow: 100, depth: 3 },
        { flow: 200, depth: 4.5 }
      ]
    });

    const calculator = new CulvertCalculator(params);
    const results = calculator.evaluateCulvertScenarios();

    expect(results).toBeDefined();
    expect(Object.keys(results).length).toBeGreaterThan(0);
  });
});
