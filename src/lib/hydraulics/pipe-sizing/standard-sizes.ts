import { PipeSize, PipeMaterial, PipeMaterialProperties, StandardSizeRange } from './types';

// Standard nominal pipe sizes in inches (used globally)
const STANDARD_NOMINAL_SIZES = [
  4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96
];

// Material properties database with comprehensive engineering data
export const MATERIAL_PROPERTIES: Record<PipeMaterial, PipeMaterialProperties> = {
  pvc: {
    material: 'pvc',
    hazenWilliamsC: 150,
    manningN: 0.009,
    roughnessHeight: 0.0005, // ft
    maxVelocity: 8, // ft/s
    minVelocity: 2, // ft/s
    maxPressure: 235, // psi (for DR18)
    thermalExpansion: 3.4e-5, // in/in/°F
    designLife: 100,
    costFactor: 1.0
  },
  ductileIron: {
    material: 'ductileIron',
    hazenWilliamsC: 130,
    manningN: 0.013,
    roughnessHeight: 0.0008, // ft
    maxVelocity: 12, // ft/s
    minVelocity: 2, // ft/s
    maxPressure: 350, // psi
    thermalExpansion: 6.7e-6, // in/in/°F
    designLife: 100,
    costFactor: 1.8
  },
  steel: {
    material: 'steel',
    hazenWilliamsC: 120,
    manningN: 0.015,
    roughnessHeight: 0.0015, // ft
    maxVelocity: 15, // ft/s
    minVelocity: 2, // ft/s
    maxPressure: 400, // psi
    thermalExpansion: 6.5e-6, // in/in/°F
    designLife: 75,
    costFactor: 2.2
  },
  hdpe: {
    material: 'hdpe',
    hazenWilliamsC: 155,
    manningN: 0.008,
    roughnessHeight: 0.0003, // ft
    maxVelocity: 10, // ft/s
    minVelocity: 2, // ft/s
    maxPressure: 200, // psi (for DR17)
    thermalExpansion: 9.0e-5, // in/in/°F
    designLife: 100,
    costFactor: 1.4
  },
  concrete: {
    material: 'concrete',
    hazenWilliamsC: 140,
    manningN: 0.013,
    roughnessHeight: 0.002, // ft
    maxVelocity: 10, // ft/s
    minVelocity: 2, // ft/s
    maxPressure: 100, // psi
    thermalExpansion: 5.5e-6, // in/in/°F
    designLife: 75,
    costFactor: 1.6
  },
  'cast-iron': {
    material: 'cast-iron',
    hazenWilliamsC: 110,
    manningN: 0.015,
    roughnessHeight: 0.0025, // ft
    maxVelocity: 8, // ft/s
    minVelocity: 2, // ft/s
    maxPressure: 250, // psi
    thermalExpansion: 6.0e-6, // in/in/°F
    designLife: 50,
    costFactor: 2.0
  }
};

// PVC pipe sizes (AWWA C900/C905)
const PVC_SIZES: PipeSize[] = [
  { nominalDiameter: 4, internalDiameter: 4.154, wallThickness: 0.192, area: 0.0942, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 6, internalDiameter: 6.235, wallThickness: 0.288, area: 0.212, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 8, internalDiameter: 8.315, wallThickness: 0.385, area: 0.377, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 10, internalDiameter: 10.396, wallThickness: 0.481, area: 0.590, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 12, internalDiameter: 12.476, wallThickness: 0.577, area: 0.849, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 14, internalDiameter: 14.557, wallThickness: 0.673, area: 1.155, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 16, internalDiameter: 16.638, wallThickness: 0.769, area: 1.509, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 18, internalDiameter: 18.718, wallThickness: 0.865, area: 1.910, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 20, internalDiameter: 20.799, wallThickness: 0.962, area: 2.358, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 24, internalDiameter: 24.960, wallThickness: 1.154, area: 3.398, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 30, internalDiameter: 31.201, wallThickness: 1.442, area: 5.301, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] },
  { nominalDiameter: 36, internalDiameter: 37.441, wallThickness: 1.731, area: 7.646, material: 'pvc', pressureClass: 'DR18', availableJoints: ['Bell & Spigot', 'Mechanical Joint'] }
];

// Ductile Iron pipe sizes (AWWA C151)
const DUCTILE_IRON_SIZES: PipeSize[] = [
  { nominalDiameter: 4, internalDiameter: 4.80, wallThickness: 0.25, area: 0.126, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 6, internalDiameter: 6.90, wallThickness: 0.25, area: 0.260, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 8, internalDiameter: 9.05, wallThickness: 0.27, area: 0.446, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 10, internalDiameter: 11.10, wallThickness: 0.29, area: 0.672, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 12, internalDiameter: 13.20, wallThickness: 0.31, area: 0.950, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 14, internalDiameter: 15.30, wallThickness: 0.33, area: 1.277, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 16, internalDiameter: 17.40, wallThickness: 0.35, area: 1.650, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 18, internalDiameter: 19.50, wallThickness: 0.37, area: 2.073, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Journal', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 20, internalDiameter: 21.60, wallThickness: 0.39, area: 2.545, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 24, internalDiameter: 25.80, wallThickness: 0.43, area: 3.631, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 30, internalDiameter: 32.00, wallThickness: 0.49, area: 5.585, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 36, internalDiameter: 38.30, wallThickness: 0.55, area: 8.006, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 42, internalDiameter: 44.50, wallThickness: 0.61, area: 10.799, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] },
  { nominalDiameter: 48, internalDiameter: 50.80, wallThickness: 0.67, area: 14.071, material: 'ductileIron', pressureClass: 'Class 350', availableJoints: ['Mechanical Joint', 'Push-on Joint', 'Flanged'] }
];

// Steel pipe sizes (AWWA C200)
const STEEL_SIZES: PipeSize[] = [
  { nominalDiameter: 6, internalDiameter: 6.625, wallThickness: 0.280, area: 0.240, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged', 'Grooved'] },
  { nominalDiameter: 8, internalDiameter: 8.625, wallThickness: 0.322, area: 0.406, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged', 'Grooved'] },
  { nominalDiameter: 10, internalDiameter: 10.750, wallThickness: 0.365, area: 0.631, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged', 'Grooved'] },
  { nominalDiameter: 12, internalDiameter: 12.750, wallThickness: 0.375, area: 0.888, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged', 'Grooved'] },
  { nominalDiameter: 14, internalDiameter: 13.250, wallThickness: 0.375, area: 0.958, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged', 'Grooved'] },
  { nominalDiameter: 16, internalDiameter: 15.250, wallThickness: 0.375, area: 1.268, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged', 'Grooved'] },
  { nominalDiameter: 18, internalDiameter: 17.250, wallThickness: 0.375, area: 1.623, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged', 'Grooved'] },
  { nominalDiameter: 20, internalDiameter: 19.250, wallThickness: 0.375, area: 2.024, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged', 'Grooved'] },
  { nominalDiameter: 24, internalDiameter: 23.250, wallThickness: 0.375, area: 2.948, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged', 'Grooved'] },
  { nominalDiameter: 30, internalDiameter: 30.000, wallThickness: 0.312, area: 4.909, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged'] },
  { nominalDiameter: 36, internalDiameter: 36.000, wallThickness: 0.312, area: 7.069, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged'] },
  { nominalDiameter: 42, internalDiameter: 42.000, wallThickness: 0.312, area: 9.621, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged'] },
  { nominalDiameter: 48, internalDiameter: 48.000, wallThickness: 0.312, area: 12.566, material: 'steel', pressureClass: 'Std Weight', availableJoints: ['Welded', 'Flanged'] }
];

// HDPE pipe sizes (AWWA C906)
const HDPE_SIZES: PipeSize[] = [
  { nominalDiameter: 4, internalDiameter: 3.682, wallThickness: 0.217, area: 0.0740, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 6, internalDiameter: 5.524, wallThickness: 0.325, area: 0.166, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 8, internalDiameter: 7.365, wallThickness: 0.434, area: 0.295, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 10, internalDiameter: 9.206, wallThickness: 0.542, area: 0.462, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 12, internalDiameter: 11.047, wallThickness: 0.651, area: 0.666, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 14, internalDiameter: 12.888, wallThickness: 0.759, area: 0.907, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 16, internalDiameter: 14.729, wallThickness: 0.868, area: 1.183, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 18, internalDiameter: 16.571, wallThickness: 0.976, area: 1.497, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 20, internalDiameter: 18.412, wallThickness: 1.084, area: 1.848, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 24, internalDiameter: 22.094, wallThickness: 1.301, area: 2.663, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 30, internalDiameter: 27.618, wallThickness: 1.626, area: 4.166, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] },
  { nominalDiameter: 36, internalDiameter: 33.141, wallThickness: 1.952, area: 5.995, material: 'hdpe', pressureClass: 'DR17', availableJoints: ['Butt Fusion', 'Electrofusion', 'Mechanical'] }
];

// Concrete pipe sizes (ASTM C76)
const CONCRETE_SIZES: PipeSize[] = [
  { nominalDiameter: 12, internalDiameter: 12.0, wallThickness: 1.5, area: 0.785, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 15, internalDiameter: 15.0, wallThickness: 1.75, area: 1.227, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 18, internalDiameter: 18.0, wallThickness: 2.0, area: 1.767, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 21, internalDiameter: 21.0, wallThickness: 2.25, area: 2.405, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 24, internalDiameter: 24.0, wallThickness: 2.5, area: 3.142, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 27, internalDiameter: 27.0, wallThickness: 2.75, area: 3.976, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 30, internalDiameter: 30.0, wallThickness: 3.0, area: 4.909, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 36, internalDiameter: 36.0, wallThickness: 3.5, area: 7.069, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 42, internalDiameter: 42.0, wallThickness: 4.0, area: 9.621, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 48, internalDiameter: 48.0, wallThickness: 4.5, area: 12.566, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 60, internalDiameter: 60.0, wallThickness: 5.5, area: 19.635, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] },
  { nominalDiameter: 72, internalDiameter: 72.0, wallThickness: 6.5, area: 28.274, material: 'concrete', pressureClass: 'Class III', availableJoints: ['Bell & Spigot', 'Tongue & Groove'] }
];

// Cast iron pipe sizes (legacy systems)
const CAST_IRON_SIZES: PipeSize[] = [
  { nominalDiameter: 4, internalDiameter: 4.26, wallThickness: 0.35, area: 0.099, material: 'cast-iron', pressureClass: 'Class 150', availableJoints: ['Mechanical Joint', 'Flanged'] },
  { nominalDiameter: 6, internalDiameter: 6.30, wallThickness: 0.35, area: 0.217, material: 'cast-iron', pressureClass: 'Class 150', availableJoints: ['Mechanical Joint', 'Flanged'] },
  { nominalDiameter: 8, internalDiameter: 8.38, wallThickness: 0.41, area: 0.383, material: 'cast-iron', pressureClass: 'Class 150', availableJoints: ['Mechanical Joint', 'Flanged'] },
  { nominalDiameter: 10, internalDiameter: 10.42, wallThickness: 0.43, area: 0.592, material: 'cast-iron', pressureClass: 'Class 150', availableJoints: ['Mechanical Joint', 'Flanged'] },
  { nominalDiameter: 12, internalDiameter: 12.48, wallThickness: 0.45, area: 0.850, material: 'cast-iron', pressureClass: 'Class 150', availableJoints: ['Mechanical Joint', 'Flanged'] },
  { nominalDiameter: 16, internalDiameter: 16.54, wallThickness: 0.52, area: 1.491, material: 'cast-iron', pressureClass: 'Class 150', availableJoints: ['Mechanical Joint', 'Flanged'] },
  { nominalDiameter: 20, internalDiameter: 20.60, wallThickness: 0.59, area: 2.313, material: 'cast-iron', pressureClass: 'Class 150', availableJoints: ['Mechanical Joint', 'Flanged'] },
  { nominalDiameter: 24, internalDiameter: 24.70, wallThickness: 0.66, area: 3.327, material: 'cast-iron', pressureClass: 'Class 150', availableJoints: ['Mechanical Joint', 'Flanged'] }
];

// Combined standard sizes database
export const STANDARD_PIPE_SIZES: Record<PipeMaterial, PipeSize[]> = {
  pvc: PVC_SIZES,
  ductileIron: DUCTILE_IRON_SIZES,
  steel: STEEL_SIZES,
  hdpe: HDPE_SIZES,
  concrete: CONCRETE_SIZES,
  'cast-iron': CAST_IRON_SIZES
};

// Size availability by region and material
export const STANDARD_SIZE_RANGES: StandardSizeRange[] = [
  {
    material: 'pvc',
    sizes: PVC_SIZES,
    availability: {
      region: 'North America',
      commonSizes: [4, 6, 8, 10, 12, 16, 20, 24],
      specialOrderSizes: [14, 18, 30, 36]
    }
  },
  {
    material: 'ductileIron',
    sizes: DUCTILE_IRON_SIZES,
    availability: {
      region: 'North America',
      commonSizes: [4, 6, 8, 10, 12, 16, 20, 24],
      specialOrderSizes: [14, 18, 30, 36, 42, 48]
    }
  },
  {
    material: 'steel',
    sizes: STEEL_SIZES,
    availability: {
      region: 'North America',
      commonSizes: [6, 8, 10, 12, 16, 20, 24],
      specialOrderSizes: [14, 18, 30, 36, 42, 48]
    }
  },
  {
    material: 'hdpe',
    sizes: HDPE_SIZES,
    availability: {
      region: 'North America',
      commonSizes: [4, 6, 8, 10, 12, 16, 20],
      specialOrderSizes: [14, 18, 24, 30, 36]
    }
  },
  {
    material: 'concrete',
    sizes: CONCRETE_SIZES,
    availability: {
      region: 'North America',
      commonSizes: [12, 15, 18, 24, 30, 36],
      specialOrderSizes: [21, 27, 42, 48, 60, 72]
    }
  },
  {
    material: 'cast-iron',
    sizes: CAST_IRON_SIZES,
    availability: {
      region: 'North America',
      commonSizes: [4, 6, 8, 12],
      specialOrderSizes: [10, 16, 20, 24]
    }
  }
];

/**
 * Get available pipe sizes for a specific material
 * @param material Pipe material
 * @returns Array of available pipe sizes
 */
export function getAvailableSizes(material: PipeMaterial): PipeSize[] {
  return STANDARD_PIPE_SIZES[material] || [];
}

/**
 * Get all available sizes across all materials
 * @param materials Array of materials to include
 * @returns Combined array of all available sizes
 */
export function getAllAvailableSizes(materials?: PipeMaterial[]): PipeSize[] {
  const materialsToInclude = materials || Object.keys(STANDARD_PIPE_SIZES) as PipeMaterial[];
  
  return materialsToInclude.reduce((allSizes, material) => {
    return allSizes.concat(getAvailableSizes(material));
  }, [] as PipeSize[]);
}

/**
 * Find pipe size by nominal diameter and material
 * @param nominalDiameter Nominal pipe diameter in inches
 * @param material Pipe material
 * @returns Pipe size object or undefined if not found
 */
export function findPipeSize(nominalDiameter: number, material: PipeMaterial): PipeSize | undefined {
  const sizes = getAvailableSizes(material);
  return sizes.find(size => size.nominalDiameter === nominalDiameter);
}

/**
 * Get material properties for a specific material
 * @param material Pipe material
 * @returns Material properties object
 */
export function getMaterialProperties(material: PipeMaterial): PipeMaterialProperties {
  return MATERIAL_PROPERTIES[material];
}

/**
 * Check if a pipe size is readily available (not special order)
 * @param nominalDiameter Nominal pipe diameter
 * @param material Pipe material
 * @returns True if size is commonly available
 */
export function isCommonSize(nominalDiameter: number, material: PipeMaterial): boolean {
  const range = STANDARD_SIZE_RANGES.find(r => r.material === material);
  return range ? range.availability.commonSizes.includes(nominalDiameter) : false;
}

/**
 * Get size availability category
 * @param nominalDiameter Nominal pipe diameter
 * @param material Pipe material
 * @returns Availability category
 */
export function getSizeAvailability(nominalDiameter: number, material: PipeMaterial): 'common' | 'special-order' | 'unavailable' {
  const range = STANDARD_SIZE_RANGES.find(r => r.material === material);
  if (!range) return 'unavailable';
  
  if (range.availability.commonSizes.includes(nominalDiameter)) {
    return 'common';
  } else if (range.availability.specialOrderSizes.includes(nominalDiameter)) {
    return 'special-order';
  } else {
    return 'unavailable';
  }
}