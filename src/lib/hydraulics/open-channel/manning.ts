import { ManningCoefficient, LiningType } from './types';

export const manningCoefficients: ManningCoefficient[] = [
  {
    label: "Concrete",
    value: 0.013,
    type: "hard-surface",
    description: "Smooth concrete channels",
    range: { min: 0.010, max: 0.016 }
  },
  {
    label: "Earth, Clean, Straight",
    value: 0.022,
    type: "earth-lining",
    description: "Well-maintained earth channels",
    range: { min: 0.020, max: 0.025 }
  },
  {
    label: "Earth, Winding, Some Weeds",
    value: 0.025,
    type: "earth-lining",
    description: "Natural earth channels with vegetation",
    range: { min: 0.023, max: 0.030 }
  },
  {
    label: "Gravel, Firm, Clean",
    value: 0.025,
    type: "earth-lining",
    description: "Compacted gravel channels",
    range: { min: 0.023, max: 0.027 }
  },
  {
    label: "Rock Cut, Smooth",
    value: 0.035,
    type: "hard-surface",
    description: "Excavated rock channels, smooth finish",
    range: { min: 0.030, max: 0.040 }
  },
  {
    label: "Rock Cut, Jagged",
    value: 0.040,
    type: "hard-surface",
    description: "Excavated rock channels, rough finish",
    range: { min: 0.035, max: 0.045 }
  },
  {
    label: "Grass, Short",
    value: 0.030,
    type: "earth-lining",
    description: "Grass-lined channels, mowed",
    range: { min: 0.025, max: 0.035 }
  },
  {
    label: "Grass, High",
    value: 0.035,
    type: "earth-lining",
    description: "Grass-lined channels, unmowed",
    range: { min: 0.030, max: 0.050 }
  },
  {
    label: "Brush & Weeds, Dense",
    value: 0.050,
    type: "earth-lining",
    description: "Heavy vegetation and brush",
    range: { min: 0.035, max: 0.080 }
  },
  {
    label: "Asphalt",
    value: 0.016,
    type: "hard-surface",
    description: "Asphalt-lined channels",
    range: { min: 0.013, max: 0.020 }
  },
  {
    label: "Brick",
    value: 0.015,
    type: "hard-surface",
    description: "Brick-lined channels",
    range: { min: 0.012, max: 0.018 }
  },
  {
    label: "Rubble Masonry",
    value: 0.030,
    type: "hard-surface",
    description: "Stone masonry channels",
    range: { min: 0.025, max: 0.035 }
  }
];

export function getManningByLabel(label: string): ManningCoefficient | undefined {
  return manningCoefficients.find(coeff => coeff.label === label);
}

export function getManningByValue(value: number): ManningCoefficient | undefined {
  return manningCoefficients.find(coeff => Math.abs(coeff.value - value) < 0.001);
}

export function validateManningN(n: number): { valid: boolean; message?: string } {
  if (n <= 0) {
    return { valid: false, message: "Manning's n must be positive" };
  }
  
  if (n < 0.008) {
    return { valid: false, message: "Manning's n is unusually low (< 0.008). Check your value." };
  }
  
  if (n > 0.200) {
    return { valid: false, message: "Manning's n is unusually high (> 0.200). Check your value." };
  }
  
  if (n > 0.100) {
    return { valid: true, message: "High Manning's n value. Ensure this represents actual channel conditions." };
  }
  
  return { valid: true };
}

export function getLiningTypeFromManningN(n: number): LiningType {
  const coefficient = getManningByValue(n);
  return coefficient?.type || 'custom';
}

export function getTypicalRangeForLining(type: LiningType): { min: number; max: number } {
  switch (type) {
    case 'hard-surface':
      return { min: 0.010, max: 0.045 };
    case 'earth-lining':
      return { min: 0.020, max: 0.080 };
    case 'custom':
      return { min: 0.008, max: 0.200 };
    default:
      return { min: 0.008, max: 0.200 };
  }
}