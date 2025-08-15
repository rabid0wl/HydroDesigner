/**
 * Formula Reference System Types
 * Defines the structure for formula definitions, variables, and display components
 */

export interface FormulaVariable {
  label: string;
  symbol: string;
  description: string;
  value?: number;
  unit: string;
  typical?: {
    min: number;
    max: number;
    description: string;
  };
}

export interface FormulaDefinition {
  id: string;
  name: string;
  category: 'open-channel' | 'culvert' | 'pipe' | 'pump' | 'general';
  subcategory?: string;
  latex: string;
  description: string;
  variables: Record<string, FormulaVariable>;
  source: {
    reference: string;
    standard?: string;
    section?: string;
  };
  assumptions?: string[];
  limitations?: string[];
  relatedFormulas?: string[];
}

export interface FormulaGroup {
  title: string;
  description: string;
  formulas: string[]; // Formula IDs
}

export interface FormulaReferenceProps {
  formulaId: string;
  currentValues?: Record<string, number>;
  units: 'metric' | 'imperial';
  className?: string;
  showSource?: boolean;
  showAssumptions?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface FormulaDisplayProps {
  formula: FormulaDefinition;
  currentValues?: Record<string, number>;
  units: 'metric' | 'imperial';
  className?: string;
  showSource?: boolean;
  showAssumptions?: boolean;
}

export type FormulaCategory = 'open-channel' | 'culvert' | 'pipe' | 'pump' | 'general';

export interface FormulaDatabase {
  [key: string]: FormulaDefinition;
}