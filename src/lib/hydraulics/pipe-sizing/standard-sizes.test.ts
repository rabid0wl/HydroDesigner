import { 
  getAvailableSizes,
  getAllAvailableSizes,
  findPipeSize,
  getMaterialProperties,
  isCommonSize,
  getSizeAvailability,
  MATERIAL_PROPERTIES,
  STANDARD_PIPE_SIZES
} from './standard-sizes';
import { PipeMaterial } from './types';

describe('standard-sizes', () => {
  describe('MATERIAL_PROPERTIES', () => {
    it('should contain properties for all supported materials', () => {
      const materials: PipeMaterial[] = ['pvc', 'ductileIron', 'steel', 'hdpe', 'concrete', 'cast-iron'];
      
      materials.forEach(material => {
        expect(MATERIAL_PROPERTIES).toHaveProperty(material);
        const props = MATERIAL_PROPERTIES[material];
        expect(props.material).toBe(material);
        expect(props.hazenWilliamsC).toBeGreaterThan(0);
        expect(props.manningN).toBeGreaterThan(0);
        expect(props.roughnessHeight).toBeGreaterThanOrEqual(0);
        expect(props.maxVelocity).toBeGreaterThan(0);
        expect(props.minVelocity).toBeGreaterThanOrEqual(0);
        expect(props.maxPressure).toBeGreaterThan(0);
        expect(props.designLife).toBeGreaterThan(0);
        expect(props.costFactor).toBeGreaterThan(0);
      });
    });
  });

  describe('STANDARD_PIPE_SIZES', () => {
    it('should contain sizes for all supported materials', () => {
      const materials: PipeMaterial[] = ['pvc', 'ductileIron', 'steel', 'hdpe', 'concrete', 'cast-iron'];
      
      materials.forEach(material => {
        expect(STANDARD_PIPE_SIZES).toHaveProperty(material);
        const sizes = STANDARD_PIPE_SIZES[material];
        expect(Array.isArray(sizes)).toBe(true);
        expect(sizes.length).toBeGreaterThan(0);
        
        // Check that each size has required properties
        sizes.forEach(size => {
          expect(size).toHaveProperty('nominalDiameter');
          expect(size).toHaveProperty('internalDiameter');
          expect(size).toHaveProperty('wallThickness');
          expect(size).toHaveProperty('area');
          expect(size).toHaveProperty('material');
          expect(size).toHaveProperty('availableJoints');
          expect(size.nominalDiameter).toBeGreaterThan(0);
          expect(size.internalDiameter).toBeGreaterThan(0);
          expect(size.wallThickness).toBeGreaterThan(0);
          expect(size.area).toBeGreaterThan(0);
          expect(size.material).toBe(material);
          expect(Array.isArray(size.availableJoints)).toBe(true);
        });
      });
    });
  });

  describe('getAvailableSizes', () => {
    it('should return available sizes for a given material', () => {
      const sizes = getAvailableSizes('pvc');
      expect(Array.isArray(sizes)).toBe(true);
      expect(sizes.length).toBeGreaterThan(0);
      
      // Check that all returned sizes are for the requested material
      sizes.forEach(size => {
        expect(size.material).toBe('pvc');
      });
    });

    it('should return an empty array for an unsupported material', () => {
      const sizes = getAvailableSizes('unknown' as PipeMaterial);
      expect(Array.isArray(sizes)).toBe(true);
      expect(sizes.length).toBe(0);
    });
  });

  describe('getAllAvailableSizes', () => {
    it('should return all available sizes when no materials specified', () => {
      const sizes = getAllAvailableSizes();
      expect(Array.isArray(sizes)).toBe(true);
      expect(sizes.length).toBeGreaterThan(0);
    });

    it('should return sizes only for specified materials', () => {
      const materials: PipeMaterial[] = ['pvc', 'ductileIron'];
      const sizes = getAllAvailableSizes(materials);
      expect(Array.isArray(sizes)).toBe(true);
      expect(sizes.length).toBeGreaterThan(0);
      
      // Check that all returned sizes are for the specified materials
      sizes.forEach(size => {
        expect(materials).toContain(size.material);
      });
    });
  });

  describe('findPipeSize', () => {
    it('should find a pipe size by nominal diameter and material', () => {
      const size = findPipeSize(6, 'pvc');
      expect(size).toBeDefined();
      expect(size?.nominalDiameter).toBe(6);
      expect(size?.material).toBe('pvc');
    });

    it('should return undefined for a non-existent pipe size', () => {
      const size = findPipeSize(999, 'pvc');
      expect(size).toBeUndefined();
    });
  });

  describe('getMaterialProperties', () => {
    it('should return properties for a given material', () => {
      const props = getMaterialProperties('pvc');
      expect(props).toBeDefined();
      expect(props.material).toBe('pvc');
      expect(props.hazenWilliamsC).toBeGreaterThan(0);
    });

    it('should return undefined for an unsupported material', () => {
      const props = getMaterialProperties('unknown' as PipeMaterial);
      expect(props).toBeUndefined();
    });
  });

  describe('isCommonSize', () => {
    it('should correctly identify common sizes', () => {
      // PVC 6" is a common size
      expect(isCommonSize(6, 'pvc')).toBe(true);
      
      // PVC 14" is not a common size
      expect(isCommonSize(14, 'pvc')).toBe(false);
    });

    it('should return false for unsupported materials', () => {
      expect(isCommonSize(6, 'unknown' as PipeMaterial)).toBe(false);
    });
  });

  describe('getSizeAvailability', () => {
    it('should correctly categorize size availability', () => {
      // PVC 6" is a common size
      expect(getSizeAvailability(6, 'pvc')).toBe('common');
      
      // PVC 14" is a special order size
      expect(getSizeAvailability(14, 'pvc')).toBe('special-order');
      
      // PVC 99" is not available
      expect(getSizeAvailability(999, 'pvc')).toBe('unavailable');
    });

    it('should return unavailable for unsupported materials', () => {
      expect(getSizeAvailability(6, 'unknown' as PipeMaterial)).toBe('unavailable');
    });
  });
});