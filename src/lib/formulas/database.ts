import { FormulaDatabase, FormulaDefinition } from './types';

/**
 * Comprehensive Formula Database for CE Calculator
 * Contains primary formulas used throughout the application
 */

export const formulaDatabase: FormulaDatabase = {
  // Open Channel Flow Formulas
  'mannings-equation': {
    id: 'mannings-equation',
    name: "Manning's Equation",
    category: 'open-channel',
    subcategory: 'uniform-flow',
    latex: 'Q = \\frac{k}{n} \\cdot A \\cdot R^{2/3} \\cdot S^{1/2}',
    description: 'Calculates flow rate in open channels under uniform flow conditions',
    variables: {
      Q: {
        label: 'Flow Rate',
        symbol: 'Q',
        description: 'Volumetric flow rate through the channel',
        unit: 'm³/s',
        typical: { min: 0.1, max: 1000, description: 'Typical range for engineered channels' }
      },
      k: {
        label: 'Unit Conversion Factor',
        symbol: 'k',
        description: 'Conversion factor (1.0 for SI, 1.486 for Imperial)',
        unit: '-',
        typical: { min: 1.0, max: 1.486, description: '1.0 for metric, 1.486 for imperial units' }
      },
      n: {
        label: "Manning's Roughness",
        symbol: 'n',
        description: 'Channel roughness coefficient depending on lining material',
        unit: '-',
        typical: { min: 0.010, max: 0.080, description: 'Concrete (0.013) to Dense Vegetation (0.080)' }
      },
      A: {
        label: 'Flow Area',
        symbol: 'A',
        description: 'Cross-sectional area of flow at normal depth',
        unit: 'm²',
        typical: { min: 0.1, max: 100, description: 'Varies with channel size and depth' }
      },
      R: {
        label: 'Hydraulic Radius',
        symbol: 'R',
        description: 'Ratio of flow area to wetted perimeter (A/P)',
        unit: 'm',
        typical: { min: 0.1, max: 10, description: 'Efficiency measure of channel shape' }
      },
      S: {
        label: 'Channel Slope',
        symbol: 'S',
        description: 'Longitudinal slope of channel bottom',
        unit: 'm/m',
        typical: { min: 0.0005, max: 0.05, description: 'Minimum 0.05% for drainage, up to 5% for steep channels' }
      }
    },
    source: {
      reference: 'Chow, V.T. - Open Channel Hydraulics',
      standard: 'Standard practice in hydraulic engineering',
      section: 'Chapter 5: Uniform Flow'
    },
    assumptions: [
      'Uniform flow conditions (constant depth and velocity)',
      'Rigid channel boundaries',
      'Steady flow conditions'
    ],
    limitations: [
      'Not applicable for rapidly varied flow',
      'Roughness coefficient varies with depth and season',
      'Assumes prismatic channel'
    ],
    relatedFormulas: ['critical-flow-equation', 'froude-number']
  },

  'critical-flow-equation': {
    id: 'critical-flow-equation',
    name: 'Critical Flow Equation',
    category: 'open-channel',
    subcategory: 'critical-flow',
    latex: 'Q^2 \\cdot T = g \\cdot A^3',
    description: 'Defines the relationship between flow rate, area, and top width at critical depth',
    variables: {
      Q: {
        label: 'Flow Rate',
        symbol: 'Q',
        description: 'Volumetric flow rate',
        unit: 'm³/s',
        typical: { min: 0.1, max: 1000, description: 'Design flow rate' }
      },
      T: {
        label: 'Top Width',
        symbol: 'T',
        description: 'Width of channel at water surface',
        unit: 'm',
        typical: { min: 0.5, max: 50, description: 'Surface width at critical depth' }
      },
      g: {
        label: 'Gravitational Acceleration',
        symbol: 'g',
        description: 'Acceleration due to gravity',
        unit: 'm/s²',
        typical: { min: 9.81, max: 9.81, description: '9.81 m/s² (32.2 ft/s²)' }
      },
      A: {
        label: 'Flow Area',
        symbol: 'A',
        description: 'Cross-sectional flow area at critical depth',
        unit: 'm²',
        typical: { min: 0.1, max: 100, description: 'Area at critical conditions' }
      }
    },
    source: {
      reference: 'Henderson, F.M. - Open Channel Flow',
      standard: 'Fundamental principle of critical flow',
      section: 'Chapter 3: Energy and Critical Flow'
    },
    assumptions: [
      'Hydrostatic pressure distribution',
      'Gradually varied flow',
      'Minimum specific energy condition'
    ],
    relatedFormulas: ['mannings-equation', 'froude-number', 'specific-energy']
  },

  'froude-number': {
    id: 'froude-number',
    name: 'Froude Number',
    category: 'open-channel',
    subcategory: 'flow-classification',
    latex: 'Fr = \\frac{V}{\\sqrt{g \\cdot D}}',
    description: 'Dimensionless number classifying flow regime (subcritical, critical, supercritical)',
    variables: {
      Fr: {
        label: 'Froude Number',
        symbol: 'Fr',
        description: 'Dimensionless flow classification parameter',
        unit: '-',
        typical: { min: 0.1, max: 3.0, description: 'Fr<1: Subcritical, Fr=1: Critical, Fr>1: Supercritical' }
      },
      V: {
        label: 'Average Velocity',
        symbol: 'V',
        description: 'Mean velocity of flow (Q/A)',
        unit: 'm/s',
        typical: { min: 0.5, max: 10, description: 'Typical range for open channel flow' }
      },
      g: {
        label: 'Gravitational Acceleration',
        symbol: 'g',
        description: 'Acceleration due to gravity',
        unit: 'm/s²',
        typical: { min: 9.81, max: 9.81, description: '9.81 m/s² (32.2 ft/s²)' }
      },
      D: {
        label: 'Hydraulic Depth',
        symbol: 'D',
        description: 'Hydraulic mean depth (A/T)',
        unit: 'm',
        typical: { min: 0.1, max: 5, description: 'Average depth for flow classification' }
      }
    },
    source: {
      reference: 'Standard hydraulic engineering practice',
      standard: 'Fundamental dimensionless parameter'
    },
    assumptions: [
      'Gradually varied flow',
      'Hydrostatic pressure distribution'
    ],
    relatedFormulas: ['critical-flow-equation', 'specific-energy']
  },

  // Culvert Design Formulas
  'fhwa-inlet-control': {
    id: 'fhwa-inlet-control',
    name: 'FHWA HDS-5 Inlet Control',
    category: 'culvert',
    subcategory: 'inlet-control',
    latex: '\\frac{HW}{D} = c \\cdot \\left(\\frac{Q}{D \\cdot \\sqrt{A}}\\right)^Y + c_2 \\cdot \\left(\\frac{Q}{D \\cdot \\sqrt{A}}\\right)^{Y_2} + S',
    description: 'Federal Highway Administration method for calculating headwater under inlet control conditions',
    variables: {
      HW: {
        label: 'Headwater Depth',
        symbol: 'HW',
        description: 'Water depth upstream of culvert inlet',
        unit: 'm',
        typical: { min: 0.5, max: 10, description: 'Limited by road elevation and flooding constraints' }
      },
      D: {
        label: 'Culvert Height/Diameter',
        symbol: 'D',
        description: 'Vertical dimension of culvert opening',
        unit: 'm',
        typical: { min: 0.3, max: 10, description: 'Standard culvert sizes' }
      },
      c: {
        label: 'Inlet Coefficient',
        symbol: 'c',
        description: 'Material and shape-specific inlet coefficient',
        unit: '-',
        typical: { min: 0.008, max: 0.055, description: 'Varies by culvert type and material' }
      },
      Q: {
        label: 'Design Flow',
        symbol: 'Q',
        description: 'Design discharge through culvert',
        unit: 'm³/s',
        typical: { min: 0.5, max: 100, description: 'Depends on watershed and return period' }
      },
      A: {
        label: 'Culvert Area',
        symbol: 'A',
        description: 'Cross-sectional area of culvert barrel',
        unit: 'm²',
        typical: { min: 0.1, max: 50, description: 'Full culvert opening area' }
      },
      Y: {
        label: 'Flow Exponent',
        symbol: 'Y',
        description: 'Shape and material-specific flow exponent',
        unit: '-',
        typical: { min: 0.5, max: 2.0, description: 'Determined from FHWA research' }
      },
      S: {
        label: 'Slope Correction',
        symbol: 'S',
        description: 'Slope correction factor',
        unit: '-',
        typical: { min: -0.5, max: 0.5, description: 'Usually 0 for most applications' }
      }
    },
    source: {
      reference: 'FHWA HDS-5: Hydraulic Design of Highway Culverts',
      standard: 'Federal Highway Administration',
      section: 'Chapter 4: Inlet Control Design'
    },
    assumptions: [
      'Inlet control governs (HW > outlet control)',
      'Free discharge at outlet',
      'Standard entrance conditions'
    ],
    limitations: [
      'Specific to tested culvert types',
      'Coefficients may not apply to non-standard configurations'
    ],
    relatedFormulas: ['outlet-control-energy']
  },

  'outlet-control-energy': {
    id: 'outlet-control-energy',
    name: 'Outlet Control Energy Equation',
    category: 'culvert',
    subcategory: 'outlet-control',
    latex: 'HW = TW + h_e + h_f + h_o - \\Delta Z',
    description: 'Energy balance for outlet control flow through culverts',
    variables: {
      HW: {
        label: 'Headwater Elevation',
        symbol: 'HW',
        description: 'Upstream water surface elevation',
        unit: 'm',
        typical: { min: 0.5, max: 10, description: 'Above culvert invert' }
      },
      TW: {
        label: 'Tailwater Elevation',
        symbol: 'TW',
        description: 'Downstream water surface elevation',
        unit: 'm',
        typical: { min: 0, max: 5, description: 'May be zero for free outfall' }
      },
      he: {
        label: 'Entrance Loss',
        symbol: 'h_e',
        description: 'Energy loss at culvert entrance',
        unit: 'm',
        typical: { min: 0.02, max: 0.5, description: 'Depends on entrance type' }
      },
      hf: {
        label: 'Friction Loss',
        symbol: 'h_f',
        description: 'Friction loss through culvert barrel',
        unit: 'm',
        typical: { min: 0.01, max: 2.0, description: 'Function of length, roughness, velocity' }
      },
      ho: {
        label: 'Outlet Loss',
        symbol: 'h_o',
        description: 'Exit velocity head',
        unit: 'm',
        typical: { min: 0.01, max: 1.0, description: 'V²/(2g) at outlet' }
      },
      ΔZ: {
        label: 'Elevation Difference',
        symbol: '\\Delta Z',
        description: 'Difference in culvert invert elevations',
        unit: 'm',
        typical: { min: 0, max: 5, description: 'Positive for downward slope' }
      }
    },
    source: {
      reference: 'FHWA HDS-5: Hydraulic Design of Highway Culverts',
      standard: 'Federal Highway Administration',
      section: 'Chapter 5: Outlet Control Design'
    },
    assumptions: [
      'Outlet control governs (TW or friction controls)',
      'Steady flow conditions',
      'Full or partial flow in barrel'
    ],
    relatedFormulas: ['fhwa-inlet-control', 'manning-friction-loss']
  },

  'manning-friction-loss': {
    id: 'manning-friction-loss',
    name: "Manning's Friction Loss",
    category: 'culvert',
    subcategory: 'friction-loss',
    latex: 'h_f = \\frac{n^2 \\cdot V^2 \\cdot L}{2.22 \\cdot R^{4/3}}',
    description: 'Friction loss calculation using Manning equation for culvert design',
    variables: {
      hf: {
        label: 'Friction Loss',
        symbol: 'h_f',
        description: 'Energy loss due to friction',
        unit: 'm',
        typical: { min: 0.01, max: 2.0, description: 'Varies with length and roughness' }
      },
      n: {
        label: "Manning's n",
        symbol: 'n',
        description: 'Roughness coefficient for culvert material',
        unit: '-',
        typical: { min: 0.009, max: 0.024, description: 'HDPE (0.009) to Corrugated Metal (0.024)' }
      },
      V: {
        label: 'Average Velocity',
        symbol: 'V',
        description: 'Mean velocity through culvert',
        unit: 'm/s',
        typical: { min: 1, max: 6, description: 'Typical range for culvert flow' }
      },
      L: {
        label: 'Culvert Length',
        symbol: 'L',
        description: 'Total length of culvert barrel',
        unit: 'm',
        typical: { min: 5, max: 200, description: 'Depends on roadway width and geometry' }
      },
      R: {
        label: 'Hydraulic Radius',
        symbol: 'R',
        description: 'Ratio of flow area to wetted perimeter',
        unit: 'm',
        typical: { min: 0.2, max: 3, description: 'Varies with culvert size and flow depth' }
      }
    },
    source: {
      reference: 'Standard hydraulic practice',
      standard: 'Manning equation adapted for culvert friction'
    },
    assumptions: [
      'Uniform flow conditions in barrel',
      'Constant roughness coefficient',
      'Full or partial flow'
    ],
    relatedFormulas: ['outlet-control-energy']
  },

  // Pipe Sizing Formulas
  'hazen-williams-equation': {
    id: 'hazen-williams-equation',
    name: 'Hazen-Williams Equation',
    category: 'pipe',
    subcategory: 'friction-loss',
    latex: 'V = 1.318 \\cdot C \\cdot R^{0.63} \\cdot S^{0.54}',
    description: 'Empirical formula for calculating velocity and head loss in pressurized water pipes',
    variables: {
      V: {
        label: 'Average Velocity',
        symbol: 'V',
        description: 'Mean velocity of water in the pipe',
        unit: 'm/s',
        typical: { min: 0.6, max: 3.0, description: 'Optimal range: 1-2 m/s to prevent sediment and erosion' }
      },
      C: {
        label: 'Hazen-Williams Coefficient',
        symbol: 'C',
        description: 'Roughness coefficient specific to pipe material',
        unit: '-',
        typical: { min: 100, max: 155, description: 'PVC: 150, Ductile Iron: 130, Steel: 120, HDPE: 155' }
      },
      R: {
        label: 'Hydraulic Radius',
        symbol: 'R',
        description: 'Ratio of cross-sectional area to wetted perimeter (A/P)',
        unit: 'm',
        typical: { min: 0.05, max: 1.0, description: 'For circular pipes: R = D/4' }
      },
      S: {
        label: 'Hydraulic Gradient',
        symbol: 'S',
        description: 'Head loss per unit length of pipe (slope of energy grade line)',
        unit: 'm/m',
        typical: { min: 0.001, max: 0.01, description: 'Typical range: 1-10 m per 1000m of pipe' }
      }
    },
    source: {
      reference: 'Hazen & Williams (1905) - AWWA Standards',
      standard: 'American Water Works Association',
      section: 'Water Distribution System Design'
    },
    assumptions: [
      'Turbulent flow in clean pipes',
      'Water temperature around 60°F (15°C)',
      'Full pipe flow conditions',
      'Steady flow'
    ],
    limitations: [
      'Only applicable to water flow',
      'Accuracy decreases for very small or large pipes',
      'Does not account for aging effects on roughness'
    ],
    relatedFormulas: ['darcy-weisbach-equation', 'pipe-head-loss']
  },

  'darcy-weisbach-equation': {
    id: 'darcy-weisbach-equation',
    name: 'Darcy-Weisbach Equation',
    category: 'pipe',
    subcategory: 'friction-loss',
    latex: 'h_f = f \\cdot \\frac{L}{D} \\cdot \\frac{V^2}{2g}',
    description: 'Universal equation for calculating friction losses in pipe flow for any fluid',
    variables: {
      hf: {
        label: 'Friction Head Loss',
        symbol: 'h_f',
        description: 'Energy loss due to friction over pipe length',
        unit: 'm',
        typical: { min: 0.1, max: 10, description: 'Total friction loss through pipe section' }
      },
      f: {
        label: 'Darcy Friction Factor',
        symbol: 'f',
        description: 'Dimensionless friction factor from Moody diagram or Colebrook equation',
        unit: '-',
        typical: { min: 0.008, max: 0.08, description: 'Depends on Reynolds number and relative roughness' }
      },
      L: {
        label: 'Pipe Length',
        symbol: 'L',
        description: 'Total length of pipe section',
        unit: 'm',
        typical: { min: 10, max: 5000, description: 'Distance over which head loss occurs' }
      },
      D: {
        label: 'Internal Diameter',
        symbol: 'D',
        description: 'Internal diameter of pipe',
        unit: 'm',
        typical: { min: 0.1, max: 2.0, description: 'Standard pipe sizes from 4" to 72"' }
      },
      V: {
        label: 'Average Velocity',
        symbol: 'V',
        description: 'Mean velocity of fluid in pipe (Q/A)',
        unit: 'm/s',
        typical: { min: 0.5, max: 5.0, description: 'Economic velocity range for most applications' }
      },
      g: {
        label: 'Gravitational Acceleration',
        symbol: 'g',
        description: 'Acceleration due to gravity',
        unit: 'm/s²',
        typical: { min: 9.81, max: 9.81, description: '9.81 m/s² (32.2 ft/s²)' }
      }
    },
    source: {
      reference: 'Darcy (1858), Weisbach (1845) - Fluid Mechanics Fundamentals',
      standard: 'Universal fluid mechanics principle',
      section: 'Pipe Flow Analysis'
    },
    assumptions: [
      'Fully developed turbulent flow',
      'Incompressible fluid',
      'Steady flow conditions',
      'Uniform pipe diameter'
    ],
    relatedFormulas: ['hazen-williams-equation', 'reynolds-number', 'colebrook-white']
  },

  'pipe-head-loss': {
    id: 'pipe-head-loss',
    name: 'Total Head Loss in Pipes',
    category: 'pipe',
    subcategory: 'system-analysis',
    latex: 'H_L = h_f + h_m = h_f + K \\cdot \\frac{V^2}{2g}',
    description: 'Total energy loss in pipe systems including friction and minor losses',
    variables: {
      HL: {
        label: 'Total Head Loss',
        symbol: 'H_L',
        description: 'Total energy loss in pipe system',
        unit: 'm',
        typical: { min: 1, max: 50, description: 'Sum of all energy losses in system' }
      },
      hf: {
        label: 'Friction Loss',
        symbol: 'h_f',
        description: 'Head loss due to pipe wall friction',
        unit: 'm',
        typical: { min: 0.5, max: 30, description: 'Major loss component' }
      },
      hm: {
        label: 'Minor Losses',
        symbol: 'h_m',
        description: 'Head loss due to fittings, valves, bends',
        unit: 'm',
        typical: { min: 0.1, max: 10, description: 'Sum of all minor losses' }
      },
      K: {
        label: 'Minor Loss Coefficient',
        symbol: 'K',
        description: 'Loss coefficient for specific fitting or component',
        unit: '-',
        typical: { min: 0.1, max: 10, description: 'Elbow: 0.9, Tee: 1.8, Gate valve: 0.2' }
      },
      V: {
        label: 'Velocity',
        symbol: 'V',
        description: 'Mean velocity at component location',
        unit: 'm/s',
        typical: { min: 1, max: 5, description: 'Local velocity for minor loss calculation' }
      },
      g: {
        label: 'Gravitational Acceleration',
        symbol: 'g',
        description: 'Acceleration due to gravity',
        unit: 'm/s²',
        typical: { min: 9.81, max: 9.81, description: '9.81 m/s² (32.2 ft/s²)' }
      }
    },
    source: {
      reference: 'AWWA Manual M11 - Steel Pipe Design and Installation',
      standard: 'Standard practice for water system design'
    },
    assumptions: [
      'Steady flow conditions',
      'Incompressible fluid',
      'Known fitting configurations'
    ],
    relatedFormulas: ['darcy-weisbach-equation', 'hazen-williams-equation']
  },

  'reynolds-number': {
    id: 'reynolds-number',
    name: 'Reynolds Number',
    category: 'pipe',
    subcategory: 'flow-classification',
    latex: 'Re = \\frac{\\rho \\cdot V \\cdot D}{\\mu} = \\frac{V \\cdot D}{\\nu}',
    description: 'Dimensionless parameter determining flow regime (laminar vs turbulent)',
    variables: {
      Re: {
        label: 'Reynolds Number',
        symbol: 'Re',
        description: 'Dimensionless flow classification parameter',
        unit: '-',
        typical: { min: 2000, max: 500000, description: 'Re<2000: Laminar, Re>4000: Turbulent' }
      },
      ρ: {
        label: 'Fluid Density',
        symbol: '\\rho',
        description: 'Mass density of fluid',
        unit: 'kg/m³',
        typical: { min: 1000, max: 1000, description: '1000 kg/m³ for water at 20°C' }
      },
      V: {
        label: 'Velocity',
        symbol: 'V',
        description: 'Mean velocity of fluid',
        unit: 'm/s',
        typical: { min: 0.5, max: 5, description: 'Typical range for water systems' }
      },
      D: {
        label: 'Diameter',
        symbol: 'D',
        description: 'Internal pipe diameter',
        unit: 'm',
        typical: { min: 0.1, max: 2, description: 'Characteristic length scale' }
      },
      μ: {
        label: 'Dynamic Viscosity',
        symbol: '\\mu',
        description: 'Absolute viscosity of fluid',
        unit: 'Pa·s',
        typical: { min: 0.001, max: 0.001, description: '0.001 Pa·s for water at 20°C' }
      },
      ν: {
        label: 'Kinematic Viscosity',
        symbol: '\\nu',
        description: 'Kinematic viscosity (μ/ρ)',
        unit: 'm²/s',
        typical: { min: 1e-6, max: 1e-6, description: '1.004×10⁻⁶ m²/s for water at 20°C' }
      }
    },
    source: {
      reference: 'Reynolds, O. (1883) - Fluid Mechanics Fundamentals',
      standard: 'Fundamental dimensionless parameter'
    },
    assumptions: [
      'Steady flow',
      'Constant fluid properties',
      'Fully developed flow'
    ],
    relatedFormulas: ['darcy-weisbach-equation']
  }
};

export const formulaGroups = {
  'open-channel-flow': {
    title: 'Open Channel Flow',
    description: 'Fundamental equations for uniform and critical flow in open channels',
    formulas: ['mannings-equation', 'critical-flow-equation', 'froude-number']
  },
  'culvert-hydraulics': {
    title: 'Culvert Hydraulics',
    description: 'FHWA methods for culvert design and analysis',
    formulas: ['fhwa-inlet-control', 'outlet-control-energy', 'manning-friction-loss']
  },
  'pipe-flow-analysis': {
    title: 'Pipe Flow Analysis',
    description: 'Fundamental equations for pressure flow analysis and pipe sizing',
    formulas: ['hazen-williams-equation', 'darcy-weisbach-equation', 'pipe-head-loss', 'reynolds-number']
  }
};

// Helper functions
export function getFormula(id: string): FormulaDefinition | undefined {
  return formulaDatabase[id];
}

export function getFormulasByCategory(category: string): FormulaDefinition[] {
  return Object.values(formulaDatabase).filter(formula => formula.category === category);
}

export function searchFormulas(searchTerm: string): FormulaDefinition[] {
  const term = searchTerm.toLowerCase();
  return Object.values(formulaDatabase).filter(formula => 
    formula.name.toLowerCase().includes(term) ||
    formula.description.toLowerCase().includes(term) ||
    Object.values(formula.variables).some(variable => 
      variable.label.toLowerCase().includes(term) ||
      variable.description.toLowerCase().includes(term)
    )
  );
}