import {
  calculateNormalDepth,
  calculateCriticalDepth,
  calculateChannelHydraulics,
  calculateReynoldsNumber,
  calculateSpecificEnergy,
  determineFlowState
} from '../calculations';
import { ChannelInputs } from '../types';

describe('Open Channel Calculations', () => {
  describe('Normal Depth Calculation', () => {
    it('should calculate normal depth for rectangular channel', () => {
      const inputs: ChannelInputs = {
        flowRate: 10, // m³/s
        slope: 0.001,
        manningN: 0.013,
        geometry: {
          shape: 'rectangular',
          bottomWidth: 5
        },
        units: 'metric'
      };

      const result = calculateNormalDepth(inputs);
      
      expect(result.converged).toBe(true);
      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeLessThan(10); // Reasonable depth
    });

    it('should calculate normal depth for trapezoidal channel', () => {
      const inputs: ChannelInputs = {
        flowRate: 100, // ft³/s
        slope: 0.005,
        manningN: 0.025,
        geometry: {
          shape: 'trapezoidal',
          bottomWidth: 10,
          sideSlope: 2
        },
        units: 'imperial'
      };

      const result = calculateNormalDepth(inputs);
      
      expect(result.converged).toBe(true);
      expect(result.value).toBeGreaterThan(0);
      expect(result.iterations).toBeLessThan(100);
    });

    it('should handle triangular channels', () => {
      const inputs: ChannelInputs = {
        flowRate: 5,
        slope: 0.01,
        manningN: 0.035,
        geometry: {
          shape: 'triangular',
          sideSlope: 3
        },
        units: 'metric'
      };

      const result = calculateNormalDepth(inputs);
      expect(result.converged).toBe(true);
      expect(result.value).toBeGreaterThan(0);
    });

    it('should handle circular channels', () => {
      const inputs: ChannelInputs = {
        flowRate: 2,
        slope: 0.002,
        manningN: 0.013,
        geometry: {
          shape: 'circular',
          diameter: 2
        },
        units: 'metric'
      };

      const result = calculateNormalDepth(inputs);
      expect(result.converged).toBe(true);
      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeLessThan(2); // Less than diameter
    });
  });

  describe('Critical Depth Calculation', () => {
    it('should calculate critical depth for rectangular channel', () => {
      const inputs: ChannelInputs = {
        flowRate: 10,
        slope: 0.001,
        manningN: 0.013,
        geometry: {
          shape: 'rectangular',
          bottomWidth: 5
        },
        units: 'metric'
      };

      const result = calculateCriticalDepth(inputs);
      
      expect(result.converged).toBe(true);
      expect(result.value).toBeGreaterThan(0);
      
      // For rectangular channel: yc = (Q²/(g*b²))^(1/3)
      const expectedCriticalDepth = Math.pow(
        (10 * 10) / (9.81 * 5 * 5), 
        1/3
      );
      expect(result.value).toBeCloseTo(expectedCriticalDepth, 2);
    });

    it('should calculate critical depth for trapezoidal channel', () => {
      const inputs: ChannelInputs = {
        flowRate: 50,
        slope: 0.01,
        manningN: 0.025,
        geometry: {
          shape: 'trapezoidal',
          bottomWidth: 8,
          sideSlope: 1.5
        },
        units: 'imperial'
      };

      const result = calculateCriticalDepth(inputs);
      
      expect(result.converged).toBe(true);
      expect(result.value).toBeGreaterThan(0);
    });
  });

  describe('Complete Channel Hydraulics', () => {
    it('should calculate complete hydraulics for subcritical flow', () => {
      const inputs: ChannelInputs = {
        flowRate: 10,
        slope: 0.0005, // Mild slope
        manningN: 0.025,
        geometry: {
          shape: 'rectangular',
          bottomWidth: 8
        },
        units: 'metric'
      };

      const result = calculateChannelHydraulics(inputs);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.normalDepth).toBeGreaterThan(0);
        expect(result.data.velocity).toBeGreaterThan(0);
        expect(result.data.froudeNumber).toBeGreaterThan(0);
        expect(result.data.flowState).toBe('Subcritical');
        expect(result.data.criticalDepth).toBeGreaterThan(0);
        expect(result.data.criticalSlope).toBeGreaterThan(0);
        expect(result.data.reynoldsNumber).toBeGreaterThan(0);
        expect(result.data.specificEnergy).toBeGreaterThan(result.data.normalDepth);
        
        // Check hydraulic properties
        expect(result.data.hydraulicProperties.area).toBeGreaterThan(0);
        expect(result.data.hydraulicProperties.wettedPerimeter).toBeGreaterThan(0);
        expect(result.data.hydraulicProperties.hydraulicRadius).toBeGreaterThan(0);
        expect(result.data.hydraulicProperties.topWidth).toBe(8); // Rectangular
        
        // Check freeboard and geometry
        expect(result.data.freeboard.controlling).toBeGreaterThan(0);
        expect(result.data.geometry.totalDepth).toBeGreaterThan(result.data.normalDepth);
        expect(result.data.geometry.topWidth).toBe(8);
      }
    });

    it('should calculate complete hydraulics for supercritical flow', () => {
      const inputs: ChannelInputs = {
        flowRate: 50,
        slope: 0.02, // Steep slope
        manningN: 0.015,
        geometry: {
          shape: 'rectangular',
          bottomWidth: 3
        },
        units: 'imperial'
      };

      const result = calculateChannelHydraulics(inputs);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.flowState).toBe('Supercritical');
        expect(result.data.froudeNumber).toBeGreaterThan(1);
      }
    });

    it('should handle validation errors', () => {
      const invalidInputs: ChannelInputs = {
        flowRate: 0, // Invalid
        slope: 0.001,
        manningN: 0.025,
        geometry: {
          shape: 'rectangular',
          bottomWidth: 5
        },
        units: 'metric'
      };

      const result = calculateChannelHydraulics(invalidInputs);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    it('should calculate Reynolds number correctly', () => {
      const velocity = 2; // m/s
      const hydraulicRadius = 1; // m
      const reynoldsNumber = calculateReynoldsNumber(velocity, hydraulicRadius, 'metric');
      
      expect(reynoldsNumber).toBeGreaterThan(0);
      // Re = V * 4R / ν where ν ≈ 1.004e-6 m²/s for water at 20°C
      const expected = (velocity * hydraulicRadius * 4) / 1.004e-6;
      expect(reynoldsNumber).toBeCloseTo(expected, -3); // Within order of magnitude
    });

    it('should calculate specific energy correctly', () => {
      const depth = 2; // m
      const velocity = 3; // m/s
      const specificEnergy = calculateSpecificEnergy(depth, velocity, 'metric');
      
      // E = y + V²/(2g)
      const expected = depth + (velocity * velocity) / (2 * 9.81);
      expect(specificEnergy).toBeCloseTo(expected, 6);
    });

    it('should determine flow state correctly', () => {
      expect(determineFlowState(0.8)).toBe('Subcritical');
      expect(determineFlowState(1.0)).toBe('Critical');
      expect(determineFlowState(1.2)).toBe('Supercritical');
      
      // Test boundary conditions
      expect(determineFlowState(0.94)).toBe('Subcritical');
      expect(determineFlowState(0.96)).toBe('Critical');
      expect(determineFlowState(1.04)).toBe('Critical');
      expect(determineFlowState(1.06)).toBe('Supercritical');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very small flow rates', () => {
      const inputs: ChannelInputs = {
        flowRate: 0.1,
        slope: 0.001,
        manningN: 0.013,
        geometry: {
          shape: 'rectangular',
          bottomWidth: 1
        },
        units: 'metric'
      };

      const result = calculateChannelHydraulics(inputs);
      expect(result.success).toBe(true);
    });

    it('should handle very large flow rates', () => {
      const inputs: ChannelInputs = {
        flowRate: 1000,
        slope: 0.001,
        manningN: 0.025,
        geometry: {
          shape: 'trapezoidal',
          bottomWidth: 20,
          sideSlope: 2
        },
        units: 'metric'
      };

      const result = calculateChannelHydraulics(inputs);
      expect(result.success).toBe(true);
    });

    it('should handle very steep slopes', () => {
      const inputs: ChannelInputs = {
        flowRate: 10,
        slope: 0.1, // Very steep
        manningN: 0.015,
        geometry: {
          shape: 'rectangular',
          bottomWidth: 2
        },
        units: 'metric'
      };

      const result = calculateChannelHydraulics(inputs);
      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.flowState).toBe('Supercritical');
      }
    });

    it('should provide warnings for unusual conditions', () => {
      const inputs: ChannelInputs = {
        flowRate: 100,
        slope: 0.05, // Very steep
        manningN: 0.01, // Very smooth
        geometry: {
          shape: 'rectangular',
          bottomWidth: 1 // Very narrow
        },
        units: 'metric'
      };

      const result = calculateChannelHydraulics(inputs);
      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });
  });
});