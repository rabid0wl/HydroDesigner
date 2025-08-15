"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, BookOpen, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FormulaReferenceProps, FormulaDisplayProps } from "@/lib/formulas/types";
import { getFormula } from "@/lib/formulas/database";

/**
 * Formula Display Component
 * Renders mathematical formulas with variable definitions and current values
 */
export function FormulaDisplay({ 
  formula, 
  currentValues = {}, 
  units, 
  showSource = true, 
  showAssumptions = false,
  className 
}: FormulaDisplayProps) {
  const isMetric = units === 'metric';

  // Convert units for display
  const getDisplayUnit = (baseUnit: string): string => {
    if (baseUnit === 'm³/s') return isMetric ? 'm³/s' : 'ft³/s';
    if (baseUnit === 'm') return isMetric ? 'm' : 'ft';
    if (baseUnit === 'm/s') return isMetric ? 'm/s' : 'ft/s';
    if (baseUnit === 'm²') return isMetric ? 'm²' : 'ft²';
    if (baseUnit === 'm/m') return isMetric ? 'm/m' : 'ft/ft';
    if (baseUnit === 'm/s²') return isMetric ? 'm/s²' : 'ft/s²';
    return baseUnit;
  };

  // Simplified formula rendering with inline styles
  const renderFormula = (latex: string): JSX.Element => {
    // Convert LaTeX to clean readable format
    let displayText = latex
      // Handle fractions
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
      // Handle superscripts
      .replace(/\^\\?\{([^}]+)\}/g, '^($1)')
      .replace(/\^([0-9\.\/]+)/g, '^$1')
      // Handle subscripts
      .replace(/_\\?\{([^}]+)\}/g, '_($1)')
      .replace(/_([0-9])/g, '_$1')
      // Handle square roots
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      // Greek letters
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\pi/g, 'π')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      // Mathematical operators
      .replace(/\\cdot/g, '·')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      // Clean up remaining LaTeX commands
      .replace(/\\/g, '');

    // Create a more readable format for complex expressions
    if (formula.id === 'mannings-equation') {
      displayText = 'Q = (k/n) · A · R^(2/3) · S^(1/2)';
    } else if (formula.id === 'critical-flow-equation') {
      displayText = 'Q² · T = g · A³';
    } else if (formula.id === 'froude-number') {
      displayText = 'Fr = V / √(g · D)';
    } else if (formula.id === 'fhwa-inlet-control') {
      displayText = 'HW/D = c · (Q/(D·√A))^Y + c₂ · (Q/(D·√A))^Y₂ + S';
    } else if (formula.id === 'outlet-control-energy') {
      displayText = 'HW = TW + hₑ + hf + h₀ - ΔZ';
    } else if (formula.id === 'manning-friction-loss') {
      displayText = 'hf = (n² · V² · L) / (2.22 · R^(4/3))';
    }

    return (
      <div
        className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 rounded-lg border border-slate-600/50 backdrop-blur-sm shadow-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          className="text-2xl leading-relaxed text-slate-100 text-center tracking-wide"
          style={{
            fontFamily: "'Times New Roman', 'Computer Modern', serif",
            fontWeight: '400',
            letterSpacing: '0.05em',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}
        >
          {displayText}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Formula Display */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-base">{formula.name}</h4>
          <Badge variant="outline" className="text-xs">
            {formula.category.replace('-', ' ')}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">{formula.description}</p>
        
        {renderFormula(formula.latex)}
      </div>

      {/* Variable Definitions */}
      <div className="space-y-3">
        <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Variable Definitions
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(formula.variables).map(([key, variable]) => {
            const currentValue = currentValues[key];
            const displayUnit = getDisplayUnit(variable.unit);
            
            return (
              <div key={key} className="flex items-center justify-between p-2 bg-slate-800/60 hover:bg-slate-700/70 transition-colors rounded text-sm border border-slate-600/30">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-400">{variable.symbol}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-slate-300 hover:text-slate-100 cursor-help transition-colors">
                          {variable.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{variable.description}</p>
                        {variable.typical && (
                          <p className="mt-1 text-xs">
                            <strong>Typical range:</strong> {variable.typical.min} - {variable.typical.max} {displayUnit}
                            <br />
                            {variable.typical.description}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="text-right">
                  {currentValue !== undefined ? (
                    <span className="font-semibold text-emerald-400">
                      {currentValue.toFixed(3)} <span className="text-xs text-slate-400">{displayUnit}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">{displayUnit}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source and Assumptions */}
      {(showSource || showAssumptions) && (
        <>
          <Separator />
          <div className="space-y-3">
            {showSource && (
              <div className="text-xs space-y-1">
                <h6 className="font-medium text-muted-foreground uppercase tracking-wide">Reference</h6>
                <p className="text-muted-foreground">
                  <strong>{formula.source.reference}</strong>
                  {formula.source.standard && (
                    <>
                      <br />
                      Standard: {formula.source.standard}
                    </>
                  )}
                  {formula.source.section && (
                    <>
                      <br />
                      Section: {formula.source.section}
                    </>
                  )}
                </p>
              </div>
            )}
            
            {showAssumptions && formula.assumptions && (
              <div className="text-xs space-y-1">
                <h6 className="font-medium text-muted-foreground uppercase tracking-wide">Key Assumptions</h6>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {formula.assumptions.map((assumption, index) => (
                    <li key={index}>{assumption}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {formula.limitations && (
              <div className="text-xs space-y-1">
                <h6 className="font-medium text-amber-600 uppercase tracking-wide">Limitations</h6>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                  {formula.limitations.map((limitation, index) => (
                    <li key={index}>{limitation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Main Formula Reference Component
 * Provides collapsible formula display functionality
 */
export function FormulaReference({
  formulaId,
  currentValues,
  units,
  className,
  showSource = true,
  showAssumptions = false,
  collapsible = true,
  defaultExpanded = false
}: FormulaReferenceProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const formula = getFormula(formulaId);

  if (!formula) {
    console.warn(`Formula with ID "${formulaId}" not found in database`);
    return null;
  }

  if (!collapsible) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Formula Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormulaDisplay
            formula={formula}
            currentValues={currentValues}
            units={units}
            showSource={showSource}
            showAssumptions={showAssumptions}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="hover:bg-slate-800/30 cursor-pointer transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span>Show Formula</span>
                <Badge variant="outline" className="text-xs">
                  {formula.name}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <FormulaDisplay
              formula={formula}
              currentValues={currentValues}
              units={units}
              showSource={showSource}
              showAssumptions={showAssumptions}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/**
 * Multiple Formula References Component
 * For displaying multiple related formulas
 */
interface MultipleFormulaReferenceProps {
  formulaIds: string[];
  currentValues?: Record<string, Record<string, number>>;
  units: 'metric' | 'imperial';
  title?: string;
  className?: string;
}

export function MultipleFormulaReference({
  formulaIds,
  currentValues = {},
  units,
  title = "Related Formulas",
  className
}: MultipleFormulaReferenceProps) {
  const [openFormula, setOpenFormula] = useState<string | null>(null);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {formulaIds.map((formulaId) => {
          const formula = getFormula(formulaId);
          if (!formula) return null;

          const isOpen = openFormula === formulaId;
          
          return (
            <Collapsible 
              key={formulaId} 
              open={isOpen} 
              onOpenChange={(open) => setOpenFormula(open ? formulaId : null)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-left h-auto p-3 bg-slate-900/30 hover:bg-slate-800/50 border-slate-600 text-slate-200 hover:text-slate-100 transition-all"
                >
                  <div>
                    <div className="font-medium">{formula.name}</div>
                    <div className="text-xs text-muted-foreground">{formula.description}</div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2">
                <div className="border border-slate-600 rounded p-4 bg-slate-900/20 backdrop-blur-sm">
                  <FormulaDisplay
                    formula={formula}
                    currentValues={currentValues[formulaId]}
                    units={units}
                    showSource={true}
                    showAssumptions={false}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}