# Formula Reference System

## Overview

The Formula Reference System provides users with easy access to the mathematical formulas used throughout the CE Calculator application. This builds confidence in the calculations and provides educational value by showing the underlying engineering principles.

## Features

- **Collapsible Formula Sections**: Non-intrusive "Show Formula" toggles near calculation results
- **Mathematical Notation**: Properly rendered formulas with LaTeX-like formatting
- **Variable Definitions**: Interactive tooltips showing variable meanings and typical ranges
- **Current Values**: Real-time display of variables with calculated values highlighted
- **Unit Awareness**: Automatic unit conversion between metric and imperial systems
- **Source References**: Citations to engineering standards and textbooks
- **Assumptions & Limitations**: Clear documentation of formula applicability

## Implementation

### Core Components

1. **FormulaDatabase** (`src/lib/formulas/database.ts`)
   - Comprehensive database of engineering formulas
   - Structured with LaTeX notation, variable definitions, and metadata
   - Includes primary formulas for Manning's equation, FHWA HDS-5, critical flow, etc.

2. **FormulaReference Component** (`src/components/ui/formula-reference.tsx`)
   - Main collapsible formula display component
   - Automatic unit conversion and value highlighting
   - Responsive design for mobile/desktop

3. **MultipleFormulaReference Component**
   - Container for displaying related formulas together
   - Used in complex calculation modules

### Integration Points

#### Open Channel Design Module
- **Manning's Equation**: Shows flow rate calculation with current channel parameters
- **Froude Number**: Displays flow classification formula with calculated values
- **Critical Flow Equation**: Demonstrates critical depth relationships

#### Culvert Sizing Module
- **FHWA HDS-5 Inlet Control**: Federal highway administration methodology
- **Outlet Control Energy**: Energy balance for outlet control flow
- **Manning's Friction Loss**: Friction loss through culvert barrel

## Usage Examples

### Basic Formula Reference
```typescript
<FormulaReference
  formulaId="mannings-equation"
  units={units}
  currentValues={{
    Q: calculatedFlowRate,
    n: manningN,
    A: flowArea,
    R: hydraulicRadius,
    S: channelSlope
  }}
/>
```

### Multiple Formula Display
```typescript
<MultipleFormulaReference
  formulaIds={['fhwa-inlet-control', 'outlet-control-energy']}
  units={units}
  title="Culvert Design Formulas"
  currentValues={{
    'fhwa-inlet-control': { HW: 2.5, D: 1.2, Q: 15.5, ... },
    'outlet-control-energy': { HW: 2.5, TW: 0.8, hf: 0.15, ... }
  }}
/>
```

## Formula Categories

### Open Channel Flow
- Manning's Equation for uniform flow
- Critical flow relationships
- Froude number classification
- Specific energy calculations

### Culvert Hydraulics
- FHWA HDS-5 inlet control methods
- Outlet control energy equations
- Manning's friction loss calculations
- Entrance/exit loss coefficients

## Design Philosophy

### User-Centered Approach
- **Non-intrusive**: Formulas are hidden by default to avoid UI clutter
- **Contextual**: Formulas appear near relevant calculation results
- **Educational**: Variable definitions and typical ranges provide learning opportunities
- **Professional**: Source citations build credibility and allow verification

### Technical Implementation
- **Extensible**: Easy to add new formulas through the database structure
- **Type-safe**: Full TypeScript integration with proper interfaces
- **Responsive**: Mobile-friendly collapsible design
- **Performance**: Efficient rendering with proper caching

## Future Enhancements

### Phase 2 Features (based on user feedback)
- **LaTeX/MathJax Integration**: Enhanced mathematical notation rendering
- **Formula Search**: Searchable formula database
- **Export Functionality**: PDF generation of formula references
- **Interactive Calculations**: Allow users to modify variables and see results
- **Formula History**: Track which formulas users access most frequently

### Potential Expansions
- **Pipe Flow Formulas**: Hazen-Williams, Darcy-Weisbach equations
- **Pump Design Formulas**: Affinity laws, NPSH calculations  
- **Structural Formulas**: Load calculations, material properties
- **Environmental Formulas**: Water quality, treatment processes

## Testing & Validation

### Current Status
- ✅ Formula database populated with primary equations
- ✅ UI components implemented and integrated
- ✅ Unit conversion system functional
- ✅ Responsive design verified
- ⏳ Cross-browser testing pending
- ⏳ User acceptance testing pending

### Quality Assurance
- All formulas verified against engineering references
- Variable definitions checked for accuracy
- Source citations validated
- Mathematical notation reviewed for correctness

## Contributing

### Adding New Formulas
1. Add formula definition to `src/lib/formulas/database.ts`
2. Include complete variable definitions with units and ranges
3. Provide proper source citations
4. Test integration with existing components

### Formula Definition Structure
```typescript
{
  id: 'formula-identifier',
  name: 'Display Name',
  category: 'open-channel' | 'culvert' | 'pipe' | 'pump',
  latex: '\\frac{Q}{A} = V', // LaTeX notation
  description: 'Brief explanation',
  variables: {
    Q: {
      label: 'Flow Rate',
      symbol: 'Q',
      description: 'Detailed explanation',
      unit: 'm³/s',
      typical: { min: 0.1, max: 100, description: 'Range info' }
    }
  },
  source: {
    reference: 'Author - Book Title',
    standard: 'Applicable Standard',
    section: 'Chapter/Section'
  },
  assumptions: ['Key assumption 1', 'Key assumption 2'],
  limitations: ['Limitation 1', 'Limitation 2']
}
```

## Conclusion

The Formula Reference System successfully addresses the user's need for formula transparency while maintaining a clean, professional interface. The collapsible design provides immediate access to formulas without cluttering the UI, and the comprehensive variable definitions build user confidence in the calculations.

The modular architecture allows for easy expansion and maintenance, supporting the application's growth as additional calculation modules are added.