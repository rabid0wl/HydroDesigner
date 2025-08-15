"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Info, Calculator, DollarSign, Zap } from "lucide-react";
import type { Units } from "@/app/page";
import { useProjectData } from "@/context/ProjectDataContext";
import { FormulaReference, MultipleFormulaReference } from "@/components/ui/formula-reference";
import { 
  PipeSizingCalculator, 
  createDefaultPipeSizingInputs,
  validatePipeSizingInputs,
  recommendMaterials,
  type PipeSizingInputs as PipeSizingInputsType,
  type PipeSizingResults,
  type PipeSizingResult
} from "@/lib/hydraulics/pipe-sizing";

interface PipeSizingProps {
  units: Units;
}

export function PipeSizing({ units }: PipeSizingProps) {
  const { pipeSizingInputs, setPipeSizingInputs } = useProjectData();
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<PipeSizingResults | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const isMetric = units === 'metric';
  
  // Unit labels
  const flowUnit = isMetric ? 'L/s' : 'gpm';
  const lengthUnit = isMetric ? 'm' : 'ft';
  const headlossUnit = isMetric ? 'm/km' : 'ft/kft';
  const velocityUnit = isMetric ? 'm/s' : 'ft/s';
  const pressureUnit = isMetric ? 'kPa' : 'psi';
  const tempUnit = isMetric ? '°C' : '°F';

  // Helper function to get Hazen-Williams C value
  const getMaterialHazenWilliamsC = (material: string): number => {
    const cValues: Record<string, number> = {
      'pvc': 150,
      'ductileIron': 130,
      'steel': 120,
      'hdpe': 155,
      'concrete': 140,
      'cast-iron': 110
    };
    return cValues[material] || 130;
  };

  // Input validation
  const validation = useMemo(() => {
    const inputs = {
      designFlow: parseFloat(pipeSizingInputs.flowRate) || 0,
      pipeLength: parseFloat(pipeSizingInputs.pipeLength) || 0,
      preferredMaterials: pipeSizingInputs.preferredMaterials as any,
      units: isMetric ? 'metric' as const : 'imperial' as const
    };
    return validatePipeSizingInputs(inputs);
  }, [pipeSizingInputs.flowRate, pipeSizingInputs.pipeLength, pipeSizingInputs.preferredMaterials, isMetric]);

  // Available materials based on system type and environment
  const recommendedMaterials = useMemo(() => {
    return recommendMaterials(
      pipeSizingInputs.systemType as 'gravity' | 'pressure' | 'pumped',
      pipeSizingInputs.corrosiveEnvironment
    );
  }, [pipeSizingInputs.systemType, pipeSizingInputs.corrosiveEnvironment]);

  // Calculate pipe sizing
  const calculatePipeSizing = useCallback(async () => {
    if (!validation.isValid) {
      return;
    }

    setIsCalculating(true);
    try {
      // Convert context inputs to calculation inputs
      const calculationInputs: PipeSizingInputsType = {
        ...createDefaultPipeSizingInputs(isMetric ? 'metric' : 'imperial'),
        designFlow: parseFloat(pipeSizingInputs.flowRate),
        pipeLength: parseFloat(pipeSizingInputs.pipeLength),
        elevationChange: parseFloat(pipeSizingInputs.elevationChange) || 0,
        systemType: pipeSizingInputs.systemType as 'gravity' | 'pressure' | 'pumped',
        preferredMaterials: pipeSizingInputs.preferredMaterials as any[],
        safetyFactor: parseFloat(pipeSizingInputs.safetyFactor) || 1.2,
        maxHeadLoss: parseFloat(pipeSizingInputs.maxHeadLoss) || undefined,
        minVelocity: parseFloat(pipeSizingInputs.minVelocity) || undefined,
        maxVelocity: parseFloat(pipeSizingInputs.maxVelocity) || undefined,
        installationMethod: pipeSizingInputs.installationMethod as 'trench' | 'trenchless' | 'directional',
        projectLife: parseFloat(pipeSizingInputs.projectLife) || 50,
        discountRate: parseFloat(pipeSizingInputs.discountRate) || 5,
        temperature: parseFloat(pipeSizingInputs.temperature) || (isMetric ? 20 : 68),
        corrosiveEnvironment: pipeSizingInputs.corrosiveEnvironment,
        fittings: [], // Could be enhanced to include fittings from UI
        fluidType: 'water'
      };

      const calculator = new PipeSizingCalculator(calculationInputs);
      const result = calculator.calculateRecommendations();

      if (result.success && result.data) {
        setResults(result.data);
      } else {
        console.error('Calculation failed:', result.errors);
        setResults(null);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      setResults(null);
    } finally {
      setIsCalculating(false);
    }
  }, [pipeSizingInputs, isMetric, validation.isValid]);

  // Helper functions for UI updates
  const updateInput = (field: string, value: string | boolean | string[]) => {
    setPipeSizingInputs({ [field]: value });
  };

  const toggleMaterial = (material: string) => {
    const current = pipeSizingInputs.preferredMaterials;
    const updated = current.includes(material)
      ? current.filter(m => m !== material)
      : [...current, material];
    updateInput('preferredMaterials', updated);
  };

  // Format result values for display
  const formatValue = (value: number, precision: number = 2): string => {
    return value.toFixed(precision);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Input Panel */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Pipe Sizing Parameters
          </CardTitle>
          <CardDescription>
            Configure system parameters for pipe sizing analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Basic Parameters */}
              <div className="space-y-2">
                <Label htmlFor="flow-rate">Design Flow Rate ({flowUnit})</Label>
                <Input
                  id="flow-rate"
                  placeholder={isMetric ? "e.g., 25" : "e.g., 400"}
                  type="number"
                  value={pipeSizingInputs.flowRate}
                  onChange={(e) => updateInput('flowRate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pipe-length">Pipe Length ({lengthUnit})</Label>
                <Input
                  id="pipe-length"
                  placeholder={isMetric ? "e.g., 500" : "e.g., 1640"}
                  type="number"
                  value={pipeSizingInputs.pipeLength}
                  onChange={(e) => updateInput('pipeLength', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="elevation-change">Elevation Change ({lengthUnit})</Label>
                <Input
                  id="elevation-change"
                  placeholder={isMetric ? "e.g., 10" : "e.g., 33"}
                  type="number"
                  value={pipeSizingInputs.elevationChange}
                  onChange={(e) => updateInput('elevationChange', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="system-type">System Type</Label>
                <Select value={pipeSizingInputs.systemType} onValueChange={(value) => updateInput('systemType', value)}>
                  <SelectTrigger id="system-type">
                    <SelectValue placeholder="Select system type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gravity">Gravity Flow</SelectItem>
                    <SelectItem value="pressure">Pressure System</SelectItem>
                    <SelectItem value="pumped">Pumped System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Material Selection */}
              <div className="space-y-3">
                <Label>Preferred Materials</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['pvc', 'ductileIron', 'steel', 'hdpe', 'concrete'].map((material) => (
                    <div key={material} className="flex items-center space-x-2">
                      <Switch
                        id={material}
                        checked={pipeSizingInputs.preferredMaterials.includes(material)}
                        onCheckedChange={() => toggleMaterial(material)}
                      />
                      <Label htmlFor={material} className="text-sm capitalize">
                        {material === 'ductileIron' ? 'Ductile Iron' : 
                         material === 'hdpe' ? 'HDPE' : 
                         material === 'pvc' ? 'PVC' : material}
                      </Label>
                    </div>
                  ))}
                </div>
                {recommendedMaterials.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Recommended: {recommendedMaterials.map(m => m.toUpperCase()).join(', ')}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4 mt-4">
              {/* Advanced Parameters */}
              <div className="space-y-2">
                <Label htmlFor="safety-factor">Safety Factor</Label>
                <Input
                  id="safety-factor"
                  placeholder="e.g., 1.2"
                  type="number"
                  step="0.1"
                  value={pipeSizingInputs.safetyFactor}
                  onChange={(e) => updateInput('safetyFactor', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-head-loss">Max Head Loss ({headlossUnit})</Label>
                <Input
                  id="max-head-loss"
                  placeholder={isMetric ? "e.g., 10" : "e.g., 30"}
                  type="number"
                  value={pipeSizingInputs.maxHeadLoss}
                  onChange={(e) => updateInput('maxHeadLoss', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="min-velocity">Min Velocity ({velocityUnit})</Label>
                  <Input
                    id="min-velocity"
                    placeholder={isMetric ? "0.6" : "2.0"}
                    type="number"
                    step="0.1"
                    value={pipeSizingInputs.minVelocity}
                    onChange={(e) => updateInput('minVelocity', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-velocity">Max Velocity ({velocityUnit})</Label>
                  <Input
                    id="max-velocity"
                    placeholder={isMetric ? "3.0" : "10.0"}
                    type="number"
                    step="0.1"
                    value={pipeSizingInputs.maxVelocity}
                    onChange={(e) => updateInput('maxVelocity', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="installation-method">Installation Method</Label>
                <Select value={pipeSizingInputs.installationMethod} onValueChange={(value) => updateInput('installationMethod', value)}>
                  <SelectTrigger id="installation-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trench">Open Trench</SelectItem>
                    <SelectItem value="trenchless">Trenchless</SelectItem>
                    <SelectItem value="directional">Directional Boring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="temperature">Operating Temperature ({tempUnit})</Label>
                <Input
                  id="temperature"
                  placeholder={isMetric ? "20" : "68"}
                  type="number"
                  value={pipeSizingInputs.temperature}
                  onChange={(e) => updateInput('temperature', e.target.value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="corrosive-environment">Corrosive Environment</Label>
                <Switch
                  id="corrosive-environment"
                  checked={pipeSizingInputs.corrosiveEnvironment}
                  onCheckedChange={(checked) => updateInput('corrosiveEnvironment', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="project-life">Project Life (years)</Label>
                  <Input
                    id="project-life"
                    placeholder="50"
                    type="number"
                    value={pipeSizingInputs.projectLife}
                    onChange={(e) => updateInput('projectLife', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-rate">Discount Rate (%)</Label>
                  <Input
                    id="discount-rate"
                    placeholder="5"
                    type="number"
                    step="0.1"
                    value={pipeSizingInputs.discountRate}
                    onChange={(e) => updateInput('discountRate', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Validation Messages */}
          {validation.errors.length > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {validation.errors.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          
          {validation.warnings.length > 0 && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {validation.warnings.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            className="w-full mt-6" 
            onClick={calculatePipeSizing}
            disabled={!validation.isValid || isCalculating}
          >
            {isCalculating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Calculating...
              </div>
            ) : (
              'Calculate Pipe Sizes'
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Results Panel */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Calculation Results</CardTitle>
          <CardDescription>
            {results ? 
              `${results.summary.viableOptions} viable options out of ${results.summary.totalOptions} evaluated` :
              'Configure parameters and calculate to see pipe sizing recommendations'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCalculating && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Analyzing pipe sizes...</p>
              </div>
              <Progress value={66} className="w-full" />
            </div>
          )}
          
          {results && !isCalculating && (
            <>
              <Tabs defaultValue="recommendations" className="w-full">
                <TabsList>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>
                
                <TabsContent value="recommendations" className="space-y-4">
                  {results.bestOption && (
                    <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-green-800 dark:text-green-200">
                          Recommended Solution
                        </h3>
                        <Badge variant="secondary">
                          Score: {results.bestOption.suitabilityScore}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Pipe Specifications</h4>
                          <p className="text-sm">
                            <strong>{results.bestOption.pipeSize.nominalDiameter}"</strong> {results.bestOption.pipeSize.material.toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {formatValue(results.bestOption.pipeSize.internalDiameter, 2)}"
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {results.bestOption.pipeSize.pressureClass}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Hydraulic Performance</h4>
                          <p className="text-sm">
                            Velocity: <strong>{formatValue(results.bestOption.hydraulics.velocity)} {velocityUnit}</strong>
                          </p>
                          <p className="text-sm">
                            Head Loss: <strong>{formatValue(results.bestOption.hydraulics.headLoss)} {headlossUnit}</strong>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {results.bestOption.hydraulics.flowRegime} flow
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Economics
                          </h4>
                          <p className="text-sm">
                            Capital: <strong>{formatCurrency(results.bestOption.economics.totalCapitalCost)}</strong>
                          </p>
                          <p className="text-sm">
                            Life Cycle: <strong>{formatCurrency(results.bestOption.economics.lifeCycleCost)}</strong>
                          </p>
                          {results.bestOption.economics.annualEnergyCost && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {formatCurrency(results.bestOption.economics.annualEnergyCost)}/year
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {results.bestOption.warnings.length > 0 && (
                        <Alert className="mt-3">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Warnings:</strong> {results.bestOption.warnings.join('; ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="alternatives" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Size & Material</TableHead>
                        <TableHead>Velocity ({velocityUnit})</TableHead>
                        <TableHead>Head Loss ({headlossUnit})</TableHead>
                        <TableHead>Capital Cost</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.alternativeOptions.map((option, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{option.pipeSize.nominalDiameter}" {option.pipeSize.material.toUpperCase()}</div>
                              <div className="text-xs text-muted-foreground">
                                {option.pipeSize.pressureClass}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatValue(option.hydraulics.velocity)}</TableCell>
                          <TableCell>{formatValue(option.hydraulics.headLoss)}</TableCell>
                          <TableCell>{formatCurrency(option.economics.totalCapitalCost)}</TableCell>
                          <TableCell>
                            <Badge variant={option.suitabilityScore > 80 ? "default" : option.suitabilityScore > 60 ? "secondary" : "outline"}>
                              {option.suitabilityScore}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={option.meetsDesignCriteria ? "default" : "destructive"}>
                              {option.meetsDesignCriteria ? "Pass" : "Fail"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{results.summary.totalOptions}</div>
                        <p className="text-xs text-muted-foreground">Options Evaluated</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{results.summary.viableOptions}</div>
                        <p className="text-xs text-muted-foreground">Viable Options</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {formatValue(results.summary.velocityRange.min, 1)} - {formatValue(results.summary.velocityRange.max, 1)}
                        </div>
                        <p className="text-xs text-muted-foreground">Velocity Range ({velocityUnit})</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {Math.round((results.calculations.calculationTime) / 1000 * 100) / 100}s
                        </div>
                        <p className="text-xs text-muted-foreground">Calculation Time</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Cost Range</h4>
                    <p className="text-sm">
                      {formatCurrency(results.summary.costRange.min)} to {formatCurrency(results.summary.costRange.max)}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Calculation Details</h4>
                    <p className="text-sm text-muted-foreground">
                      Completed at {new Date(results.calculations.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cache efficiency: {results.calculations.cacheHits} hits
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-8 border-t pt-6">
                <MultipleFormulaReference
                  formulaIds={['hazen-williams-equation', 'darcy-weisbach-equation', 'pipe-head-loss', 'reynolds-number']}
                  units={isMetric ? 'metric' : 'imperial'}
                  title="Pipe Flow Analysis Formulas"
                  currentValues={{
                    'hazen-williams-equation': {
                      V: results?.bestOption?.hydraulics.velocity || 0,
                      C: getMaterialHazenWilliamsC(pipeSizingInputs.preferredMaterials[0] || 'pvc'),
                      R: results?.bestOption?.pipeSize.internalDiameter ? results.bestOption.pipeSize.internalDiameter / 4 : 0.25,
                      S: results?.bestOption?.hydraulics.headLoss ? results.bestOption.hydraulics.headLoss / (isMetric ? 1000 : 1000) : 0.01
                    },
                    'darcy-weisbach-equation': {
                      hf: results?.bestOption?.hydraulics.totalHeadLoss || 0,
                      f: 0.02,
                      L: parseFloat(pipeSizingInputs.pipeLength) || 0,
                      D: results?.bestOption?.pipeSize.internalDiameter || 0.3,
                      V: results?.bestOption?.hydraulics.velocity || 0,
                      g: isMetric ? 9.81 : 32.2
                    },
                    'pipe-head-loss': {
                      HL: results?.bestOption?.hydraulics.totalHeadLoss || 0,
                      hf: results?.bestOption?.hydraulics.majorLosses || 0,
                      hm: results?.bestOption?.hydraulics.minorLosses || 0,
                      K: 0.9,
                      V: results?.bestOption?.hydraulics.velocity || 0,
                      g: isMetric ? 9.81 : 32.2
                    },
                    'reynolds-number': {
                      Re: results?.bestOption?.hydraulics.reynoldsNumber || 50000,
                      ρ: isMetric ? 1000 : 1.94,
                      V: results?.bestOption?.hydraulics.velocity || 0,
                      D: results?.bestOption?.pipeSize.internalDiameter || 0.3,
                      μ: isMetric ? 0.001 : 2.09e-5,
                      ν: isMetric ? 1.004e-6 : 1.08e-5
                    }
                  }}
                  className="mt-6"
                />
              </div>
            </>
          )}
          
          {!results && !isCalculating && (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Enter pipe system parameters and click "Calculate Pipe Sizes" to see recommendations
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}