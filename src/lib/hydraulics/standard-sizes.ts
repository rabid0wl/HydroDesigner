import { CulvertSize, CulvertMaterial } from './culvert-types';

// Enhanced standard sizes with material-specific availability and properties
const STANDARD_DIAMETERS_INCHES = {
  concrete: [12, 15, 18, 21, 24, 27, 30, 33, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 120, 144],
  corrugatedMetal: [12, 15, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 84, 96, 108, 120, 144],
  hdpe: [4, 6, 8, 10, 12, 15, 18, 24, 30, 36, 42, 48, 54, 60, 72],
} as const;

const STANDARD_BOX_SIZES = [
  // Standard precast concrete box culvert sizes (width x height in feet)
  { width: 2, height: 2 }, { width: 2, height: 3 }, { width: 2, height: 4 },
  { width: 3, height: 2 }, { width: 3, height: 3 }, { width: 3, height: 4 }, { width: 3, height: 5 },
  { width: 4, height: 2 }, { width: 4, height: 3 }, { width: 4, height: 4 }, { width: 4, height: 5 }, { width: 4, height: 6 },
  { width: 5, height: 3 }, { width: 5, height: 4 }, { width: 5, height: 5 }, { width: 5, height: 6 },
  { width: 6, height: 3 }, { width: 6, height: 4 }, { width: 6, height: 5 }, { width: 6, height: 6 }, { width: 6, height: 7 },
  { width: 7, height: 4 }, { width: 7, height: 5 }, { width: 7, height: 6 }, { width: 7, height: 7 },
  { width: 8, height: 4 }, { width: 8, height: 5 }, { width: 8, height: 6 }, { width: 8, height: 7 }, { width: 8, height: 8 },
  { width: 10, height: 4 }, { width: 10, height: 5 }, { width: 10, height: 6 }, { width: 10, height: 8 }, { width: 10, height: 10 },
  { width: 12, height: 6 }, { width: 12, height: 8 }, { width: 12, height: 10 }, { width: 12, height: 12 },
  { width: 14, height: 8 }, { width: 14, height: 10 }, { width: 14, height: 12 }, { width: 14, height: 14 },
  { width: 16, height: 10 }, { width: 16, height: 12 }, { width: 16, height: 14 }, { width: 16, height: 16 },
] as const;

const STANDARD_ARCH_SIZES = [
  // Standard precast concrete arch sizes (span x rise in feet, with area)
  { span: 2.17, rise: 1.58, area: 2.8 }, { span: 2.83, rise: 2.08, area: 4.8 },
  { span: 3.5, rise: 2.5, area: 7.2 }, { span: 4.17, rise: 3.0, area: 10.2 },
  { span: 5.0, rise: 3.5, area: 14.2 }, { span: 5.83, rise: 4.0, area: 18.8 },
  { span: 6.5, rise: 4.5, area: 23.7 }, { span: 7.17, rise: 5.0, area: 29.0 },
  { span: 8.0, rise: 5.5, area: 35.2 }, { span: 9.0, rise: 6.0, area: 42.8 },
  { span: 10.0, rise: 6.5, area: 51.2 }, { span: 11.0, rise: 7.0, area: 60.5 },
] as const;

// Helper function to calculate area for circular culverts
const calculateCircularArea = (diameter: number): number => {
  return Math.PI * Math.pow(diameter / 2, 2);
};

// Generate circular culvert sizes for all materials
const generateCircularSizes = (): CulvertSize[] => {
  const sizes: CulvertSize[] = [];
  
  Object.entries(STANDARD_DIAMETERS_INCHES).forEach(([material, diameters]) => {
    diameters.forEach(diameterInches => {
      const diameterFeet = diameterInches / 12;
      sizes.push({
        shape: 'circular',
        diameter: diameterFeet,
        area: calculateCircularArea(diameterFeet)
      });
    });
  });
  
  return sizes;
};

// Generate box culvert sizes
const generateBoxSizes = (): CulvertSize[] => {
  return STANDARD_BOX_SIZES.map(({ width, height }) => ({
    shape: 'box',
    width,
    height,
    area: width * height
  }));
};

// Generate arch culvert sizes
const generateArchSizes = (): CulvertSize[] => {
  return STANDARD_ARCH_SIZES.map(({ span, rise, area }) => ({
    shape: 'arch',
    span,
    rise,
    area
  }));
};

// Export the standard sizes
export const standardBoxSizes: CulvertSize[] = generateBoxSizes();
export const standardCircularSizes: CulvertSize[] = generateCircularSizes();
export const standardArchSizes: CulvertSize[] = generateArchSizes();

// Export material-specific availability functions
export const getAvailableSizes = (material: CulvertMaterial, shape: 'circular' | 'box' | 'arch'): CulvertSize[] => {
  switch (shape) {
    case 'circular':
      if (material in STANDARD_DIAMETERS_INCHES) {
        return STANDARD_DIAMETERS_INCHES[material as keyof typeof STANDARD_DIAMETERS_INCHES].map(diameterInches => {
          const diameterFeet = diameterInches / 12;
          return {
            shape: 'circular',
            diameter: diameterFeet,
            area: calculateCircularArea(diameterFeet)
          };
        });
      }
      return [];
    case 'box':
      // Box culverts are typically available in concrete and some corrugated metal
      if (material === 'concrete' || material === 'corrugatedMetal') {
        return standardBoxSizes;
      }
      return [];
    case 'arch':
      // Arch culverts are typically concrete or corrugated metal
      if (material === 'concrete' || material === 'corrugatedMetal') {
        return standardArchSizes;
      }
      return [];
    default:
      return [];
  }
};

// Export size validation function
export const isSizeAvailable = (size: CulvertSize, material: CulvertMaterial): boolean => {
  const availableSizes = getAvailableSizes(material, size.shape);
  
  if (size.shape === 'circular' && size.diameter) {
    return availableSizes.some(s => Math.abs((s.diameter || 0) - size.diameter!) < 0.01);
  } else if (size.shape === 'box' && size.width && size.height) {
    return availableSizes.some(s =>
      Math.abs((s.width || 0) - size.width!) < 0.01 &&
      Math.abs((s.height || 0) - size.height!) < 0.01
    );
  } else if (size.shape === 'arch' && size.span && size.rise) {
    return availableSizes.some(s =>
      Math.abs((s.span || 0) - size.span!) < 0.01 &&
      Math.abs((s.rise || 0) - size.rise!) < 0.01
    );
  }
  
  return false;
};

// Export material properties for cost estimation and structural analysis
export const MATERIAL_PROPERTIES = {
  concrete: {
    unitWeight: 150, // lb/ft³ (2400 kg/m³)
    compressiveStrength: 4000, // psi (28 MPa)
    designLife: 75, // years
    maintenanceFactor: 0.01, // 1% annually
    corrosionResistance: 'excellent',
  },
  corrugatedMetal: {
    unitWeight: 490, // lb/ft³ for steel (7850 kg/m³)
    yieldStrength: 33000, // psi (230 MPa)
    designLife: 50, // years
    maintenanceFactor: 0.02, // 2% annually
    corrosionResistance: 'good', // with coating
  },
  hdpe: {
    unitWeight: 58, // lb/ft³ (930 kg/m³)
    tensileStrength: 3200, // psi (22 MPa)
    designLife: 100, // years
    maintenanceFactor: 0.005, // 0.5% annually
    corrosionResistance: 'excellent',
  },
} as const;
