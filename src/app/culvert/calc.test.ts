import {
  validateInputs,
  getFilteredSizes,
  getManningsN,
  getEntranceLossCoef,
  getInletControlCoefficients,
  getTailwaterDepth,
  calculateCriticalDepth,
  calculateCriticalDepthCircular,
  calculateNormalDepth,
  calculateNormalDepthCircular,
  calculateNormalDepthRectangular,
  calculateInletControl,
  calculateOutletControl,
  calculateHydraulics,
  createFallbackHydraulics,
  generateWarnings,
  evaluateFishPassage,
  evaluateCulvertScenarios,
  createEmergencyFallbackResults
} from './calc';
import { CulvertParams, CulvertSize, RatingCurvePoint } from '@/lib/hydraulics/culvert-types';

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

describe('Culvert Calculator Functions', () => {
  describe('Input Validation', () => {
    it('should validate correct inputs', () => {
      const params = createTestParams();
      expect(() => validateInputs(params)).not.toThrow();
    });

    it('should throw error for negative design flow', () => {
      expect(() => {
        validateInputs(createTestParams({ designFlow: -10 }));
      }).toThrow('Design flow must be positive');
    });

    it('should throw error for upstream invert lower than downstream', () => {
      expect(() => {
        validateInputs(createTestParams({
          upstreamInvert: 95,
          downstreamInvert: 100
        }));
      }).toThrow('Upstream invert must be higher than downstream invert');
    });

    it('should throw error for excessive blockage factor', () => {
      expect(() => {
        validateInputs(createTestParams({ blockageFactor: 0.8 }));
      }).toThrow('Blockage factor must be between 0 and 0.5');
    });

    it('should throw error for excessive skew angle', () => {
      expect(() => {
        validateInputs(createTestParams({ skewAngle: 60 }));
      }).toThrow('Skew angle must be between 0 and 45 degrees');
    });
  });

  describe('Utility Functions', () => {
    it('should return correct Manning\'s n value', () => {
      expect(getManningsN('concrete')).toBe(0.013);
      expect(getManningsN('corrugatedMetal')).toBe(0.024);
      expect(getManningsN('hdpe')).toBe(0.009);
      expect(getManningsN('unknown')).toBe(0.013); // default
    });

    it('should calculate entrance loss coefficient', () => {
      const params = createTestParams({ entranceType: 'projecting', skewAngle: 0 });
      const coef = getEntranceLossCoef(params);
      expect(coef).toBe(0.9);
    });

    it('should return inlet control coefficients', () => {
      const params = createTestParams({ shape: 'circular', material: 'concrete' });
      const coeffs = getInletControlCoefficients(params);
      expect(coeffs.c).toBe(0.0398);
      expect(coeffs.Y).toBe(0.67);
    });

    it('should calculate tailwater depth', () => {
      const ratingCurve: RatingCurvePoint[] = [
        { flow: 50, depth: 2 },
        { flow: 100, depth: 3 },
        { flow: 200, depth: 4.5 }
      ];
      
      expect(getTailwaterDepth(75, ratingCurve)).toBeCloseTo(2.5, 1);
      expect(getTailwaterDepth(150, ratingCurve)).toBeCloseTo(3.75, 1);
      expect(getTailwaterDepth(250, ratingCurve)).toBe(4.5); // extrapolation
    });
  });

  describe('Size Filtering', () => {
    it('should return filtered sizes', () => {
      const params = createTestParams();
      const sizes = getFilteredSizes(params);
      expect(sizes.length).toBeGreaterThan(0);
      expect(sizes.some(s => s.shape === 'circular')).toBe(true);
      expect(sizes.some(s => s.shape === 'box')).toBe(true);
    });
  });

  describe('Critical Depth Calculations', () => {
    it('should calculate critical depth for circular culvert', () => {
      const depth = calculateCriticalDepthCircular(3, 50); // 3ft diameter, 50 cfs flow
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThan(3); // Less than diameter
    });

    it('should calculate critical depth for rectangular culvert', () => {
      const size: CulvertSize = {
        shape: 'box',
        width: 4,
        height: 3,
        area: 12
      };
      const params = createTestParams();
      const depth = calculateCriticalDepth(size, 50, params);
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThan(3);
    });
  });

  describe('Normal Depth Calculations', () => {
    it('should calculate normal depth for circular culvert', () => {
      const depth = calculateNormalDepthCircular(3, 50, 0.013, 0.01); // 3ft diameter, 50 cfs flow, n=0.013, slope=0.01
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThan(3);
    });

    it('should calculate normal depth for rectangular culvert', () => {
      const depth = calculateNormalDepthRectangular(4, 3, 50, 0.013, 0.01); // 4ft x 3ft, 50 cfs flow, n=0.013, slope=0.01
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThan(3);
    });
  });

  describe('Hydraulic Calculations', () => {
    it('should calculate inlet control headwater', () => {
      const size: CulvertSize = {
        shape: 'circular',
        diameter: 3,
        area: Math.PI * 1.5 * 1.5
      };
      const params = createTestParams();
      const hw = calculateInletControl(size, 50, params);
      expect(hw).toBeGreaterThan(0);
    });

    it('should calculate outlet control headwater', () => {
      const size: CulvertSize = {
        shape: 'circular',
        diameter: 3,
        area: Math.PI * 1.5 * 1.5
      };
      const params = createTestParams();
      const hw = calculateOutletControl(size, 50, params);
      expect(hw).toBeGreaterThan(0);
    });

    it('should calculate complete hydraulics', () => {
      const size: CulvertSize = {
        shape: 'circular',
        diameter: 3,
        area: Math.PI * 1.5 * 1.5
      };
      const params = createTestParams();
      const hydraulics = calculateHydraulics(size, 50, params);
      
      expect(hydraulics.headwater).toBeGreaterThan(0);
      expect(hydraulics.velocity).toBeGreaterThan(0);
      expect(hydraulics.froudeNumber).toBeGreaterThan(0);
      expect(hydraulics.criticalDepth).toBeGreaterThan(0);
      expect(hydraulics.normalDepth).toBeGreaterThan(0);
    });

    it('should create fallback hydraulics on error', () => {
      const size: CulvertSize = {
        shape: 'circular',
        diameter: 3,
        area: Math.PI * 1.5 * 1.5
      };
      const params = createTestParams();
      const hydraulics = createFallbackHydraulics(50, size, params);
      
      expect(hydraulics.headwater).toBeGreaterThan(0);
      expect(hydraulics.velocity).toBeGreaterThan(0);
      expect(hydraulics.froudeNumber).toBeGreaterThan(0);
    });
  });

  describe('Warnings and Environmental Analysis', () => {
    it('should generate warnings for high headwater', () => {
      const size: CulvertSize = {
        shape: 'circular',
        diameter: 1,
        area: Math.PI * 0.5 * 0.5
      };
      const hydraulics = {
        flowType: 'inlet' as const,
        headwater: 2,
        velocity: 5,
        froudeNumber: 0.8,
        criticalDepth: 0.5,
        normalDepth: 0.6,
        outletVelocity: 5,
        energyGrade: 2.5
      };
      const params = createTestParams();
      const warnings = generateWarnings(size, hydraulics, params);
      
      expect(warnings.some(w => w.includes('Headwater to diameter ratio'))).toBe(true);
    });

    it('should evaluate fish passage', () => {
      const size: CulvertSize = {
        shape: 'box',
        width: 4,
        height: 3,
        area: 12
      };
      const hydraulics = {
        flowType: 'inlet' as const,
        headwater: 2,
        velocity: 3,
        froudeNumber: 0.5,
        criticalDepth: 1,
        normalDepth: 1.2,
        outletVelocity: 3,
        energyGrade: 2.5
      };
      const params = createTestParams({
        environmentalFactors: {
          debrisLoad: 'low',
          sedimentTransport: false,
          aquaticPassage: true,
          fishPassageParams: {
            lowFlowVelocity: 4,
            lowFlowDepth: 1,
            baffles: false
          }
        }
      });
      
      const fishPassage = evaluateFishPassage(size, hydraulics, params);
      expect(fishPassage).toBeDefined();
      expect(fishPassage.overallStatus).toBe(true);
    });
  });

  describe('Scenario Evaluation', () => {
    it('should evaluate culvert scenarios', () => {
      const params = createTestParams();
      const results = evaluateCulvertScenarios(params);
      
      expect(results).toBeDefined();
      expect(Object.keys(results).length).toBeGreaterThan(0);
    });

    it('should create emergency fallback results', () => {
      const params = createTestParams();
      const results = createEmergencyFallbackResults(params);
      
      expect(results.circular).toBeDefined();
      expect(results.circular?.length).toBeGreaterThan(0);
      expect(results.circular?.[0].warnings.length).toBeGreaterThan(0);
    });
  });
});