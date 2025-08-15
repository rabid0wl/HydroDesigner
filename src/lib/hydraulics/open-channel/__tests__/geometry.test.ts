import {
  calculateRectangularProperties,
  calculateTrapezoidalProperties,
  calculateTriangularProperties,
  calculateCircularProperties,
  calculateHydraulicProperties,
  validateGeometry,
  getOptimalTrapezoidalDimensions
} from '../geometry';

describe('Open Channel Geometry Calculations', () => {
  describe('Rectangular Channel Properties', () => {
    it('should calculate correct properties for rectangular channel', () => {
      const props = calculateRectangularProperties(10, 2);
      
      expect(props.area).toBeCloseTo(20, 6);
      expect(props.wettedPerimeter).toBeCloseTo(14, 6);
      expect(props.hydraulicRadius).toBeCloseTo(20/14, 6);
      expect(props.topWidth).toBeCloseTo(10, 6);
      expect(props.hydraulicDepth).toBeCloseTo(2, 6);
    });

    it('should throw error for invalid dimensions', () => {
      expect(() => calculateRectangularProperties(0, 2)).toThrow();
      expect(() => calculateRectangularProperties(10, 0)).toThrow();
      expect(() => calculateRectangularProperties(-5, 2)).toThrow();
    });
  });

  describe('Trapezoidal Channel Properties', () => {
    it('should calculate correct properties for trapezoidal channel', () => {
      const bottomWidth = 5;
      const sideSlope = 2;
      const depth = 3;
      
      const props = calculateTrapezoidalProperties(bottomWidth, sideSlope, depth);
      
      const expectedArea = (bottomWidth + sideSlope * depth) * depth; // (5 + 2*3) * 3 = 33
      const expectedPerimeter = bottomWidth + 2 * depth * Math.sqrt(1 + sideSlope * sideSlope); // 5 + 2*3*sqrt(5)
      const expectedTopWidth = bottomWidth + 2 * sideSlope * depth; // 5 + 2*2*3 = 17
      
      expect(props.area).toBeCloseTo(expectedArea, 6);
      expect(props.wettedPerimeter).toBeCloseTo(expectedPerimeter, 6);
      expect(props.hydraulicRadius).toBeCloseTo(expectedArea / expectedPerimeter, 6);
      expect(props.topWidth).toBeCloseTo(expectedTopWidth, 6);
      expect(props.hydraulicDepth).toBeCloseTo(expectedArea / expectedTopWidth, 6);
    });

    it('should handle zero side slope (rectangular case)', () => {
      const props = calculateTrapezoidalProperties(10, 0, 2);
      const rectProps = calculateRectangularProperties(10, 2);
      
      expect(props.area).toBeCloseTo(rectProps.area, 6);
      expect(props.wettedPerimeter).toBeCloseTo(rectProps.wettedPerimeter, 6);
      expect(props.hydraulicRadius).toBeCloseTo(rectProps.hydraulicRadius, 6);
      expect(props.topWidth).toBeCloseTo(rectProps.topWidth, 6);
    });
  });

  describe('Triangular Channel Properties', () => {
    it('should calculate correct properties for triangular channel', () => {
      const sideSlope = 2;
      const depth = 3;
      
      const props = calculateTriangularProperties(sideSlope, depth);
      
      const expectedArea = sideSlope * depth * depth; // 2 * 3^2 = 18
      const expectedPerimeter = 2 * depth * Math.sqrt(1 + sideSlope * sideSlope); // 2*3*sqrt(5)
      const expectedTopWidth = 2 * sideSlope * depth; // 2*2*3 = 12
      
      expect(props.area).toBeCloseTo(expectedArea, 6);
      expect(props.wettedPerimeter).toBeCloseTo(expectedPerimeter, 6);
      expect(props.hydraulicRadius).toBeCloseTo(expectedArea / expectedPerimeter, 6);
      expect(props.topWidth).toBeCloseTo(expectedTopWidth, 6);
      expect(props.hydraulicDepth).toBeCloseTo(expectedArea / expectedTopWidth, 6);
    });

    it('should throw error for invalid side slope', () => {
      expect(() => calculateTriangularProperties(0, 2)).toThrow();
      expect(() => calculateTriangularProperties(-1, 2)).toThrow();
    });
  });

  describe('Circular Channel Properties', () => {
    it('should calculate correct properties for half-full circular pipe', () => {
      const diameter = 2;
      const depth = 1; // Half full
      
      const props = calculateCircularProperties(diameter, depth);
      
      // For half-full circular pipe, area = π*r²/2
      const expectedArea = Math.PI * (diameter/2) * (diameter/2) / 2;
      
      expect(props.area).toBeCloseTo(expectedArea, 4);
      expect(props.topWidth).toBeCloseTo(diameter, 6);
    });

    it('should throw error for depth exceeding diameter', () => {
      expect(() => calculateCircularProperties(2, 3)).toThrow();
    });

    it('should throw error for invalid dimensions', () => {
      expect(() => calculateCircularProperties(0, 1)).toThrow();
      expect(() => calculateCircularProperties(2, 0)).toThrow();
    });
  });

  describe('Generic Hydraulic Properties Function', () => {
    it('should route to correct calculation function based on shape', () => {
      const rectGeometry = { shape: 'rectangular' as const, bottomWidth: 10 };
      const trapGeometry = { shape: 'trapezoidal' as const, bottomWidth: 5, sideSlope: 2 };
      const triGeometry = { shape: 'triangular' as const, sideSlope: 2 };
      const circGeometry = { shape: 'circular' as const, diameter: 2 };

      const rectProps = calculateHydraulicProperties(rectGeometry, 2);
      const trapProps = calculateHydraulicProperties(trapGeometry, 3);
      const triProps = calculateHydraulicProperties(triGeometry, 3);
      const circProps = calculateHydraulicProperties(circGeometry, 1);

      expect(rectProps.area).toBeCloseTo(20, 6);
      expect(trapProps.area).toBeCloseTo(33, 6);
      expect(triProps.area).toBeCloseTo(18, 6);
      expect(circProps.topWidth).toBeCloseTo(2, 4);
    });

    it('should throw error for missing required parameters', () => {
      const invalidRect = { shape: 'rectangular' as const };
      const invalidTri = { shape: 'triangular' as const };
      const invalidCirc = { shape: 'circular' as const };

      expect(() => calculateHydraulicProperties(invalidRect, 2)).toThrow('Bottom width is required');
      expect(() => calculateHydraulicProperties(invalidTri, 2)).toThrow('Side slope is required');
      expect(() => calculateHydraulicProperties(invalidCirc, 2)).toThrow('Diameter is required');
    });
  });

  describe('Geometry Validation', () => {
    it('should validate rectangular channel geometry', () => {
      const validGeometry = { shape: 'rectangular' as const, bottomWidth: 10 };
      const invalidGeometry = { shape: 'rectangular' as const, bottomWidth: 0 };

      expect(validateGeometry(validGeometry).valid).toBe(true);
      expect(validateGeometry(invalidGeometry).valid).toBe(false);
      expect(validateGeometry(invalidGeometry).errors).toContain(
        'Bottom width must be positive for rectangular channels'
      );
    });

    it('should validate trapezoidal channel geometry', () => {
      const validGeometry = { shape: 'trapezoidal' as const, bottomWidth: 5, sideSlope: 2 };
      const invalidGeometry = { shape: 'trapezoidal' as const, bottomWidth: 0, sideSlope: -1 };

      expect(validateGeometry(validGeometry).valid).toBe(true);
      expect(validateGeometry(invalidGeometry).valid).toBe(false);
      expect(validateGeometry(invalidGeometry).errors.length).toBeGreaterThan(0);
    });

    it('should validate triangular channel geometry', () => {
      const validGeometry = { shape: 'triangular' as const, sideSlope: 2 };
      const invalidGeometry = { shape: 'triangular' as const, sideSlope: 0 };

      expect(validateGeometry(validGeometry).valid).toBe(true);
      expect(validateGeometry(invalidGeometry).valid).toBe(false);
      expect(validateGeometry(invalidGeometry).errors).toContain(
        'Side slope must be positive for triangular channels'
      );
    });

    it('should validate circular channel geometry', () => {
      const validGeometry = { shape: 'circular' as const, diameter: 2 };
      const invalidGeometry = { shape: 'circular' as const, diameter: 0 };

      expect(validateGeometry(validGeometry).valid).toBe(true);
      expect(validateGeometry(invalidGeometry).valid).toBe(false);
      expect(validateGeometry(invalidGeometry).errors).toContain(
        'Diameter must be positive for circular channels'
      );
    });
  });

  describe('Optimal Trapezoidal Dimensions', () => {
    it('should calculate hydraulically optimal dimensions', () => {
      const area = 20;
      const sideSlope = 1.5;
      
      const { bottomWidth, depth } = getOptimalTrapezoidalDimensions(area, sideSlope);
      
      // Verify the area constraint is satisfied
      const calculatedArea = (bottomWidth + sideSlope * depth) * depth;
      expect(calculatedArea).toBeCloseTo(area, 4);
      
      // For optimal section, certain relationships should hold
      expect(bottomWidth).toBeGreaterThan(0);
      expect(depth).toBeGreaterThan(0);
    });
  });
});