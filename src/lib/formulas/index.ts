/**
 * Formula Reference System
 * Centralized exports for the formula database and components
 */

// Types
export type {
  FormulaVariable,
  FormulaDefinition,
  FormulaGroup,
  FormulaReferenceProps,
  FormulaDisplayProps,
  FormulaCategory,
  FormulaDatabase
} from './types';

// Database and utilities
export {
  formulaDatabase,
  formulaGroups,
  getFormula,
  getFormulasByCategory,
  searchFormulas
} from './database';

// Components are exported from UI components
export {
  FormulaReference,
  FormulaDisplay,
  MultipleFormulaReference
} from '../../components/ui/formula-reference';