"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { HydraulicResults } from "@/lib/hydraulics/open-channel";
import { Separator } from "@/components/ui/separator";
import { FormulaReference } from "@/components/ui/formula-reference";

interface ResultsDisplayProps {
  results: HydraulicResults;
  units: 'metric' | 'imperial';
}

export function ResultsDisplay({ results, units }: ResultsDisplayProps) {
  const isMetric = units === 'metric';
  const lengthUnit = isMetric ? 'm' : 'ft';
  const velocityUnit = isMetric ? 'm/s' : 'ft/s';
  const areaUnit = isMetric ? 'm²' : 'ft²';
  const slopeUnit = isMetric ? 'm/m' : 'ft/ft';

  const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toFixed(decimals);
  };

  const getFlowStateColor = (state: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (state) {
      case 'Subcritical': return 'default';
      case 'Critical': return 'secondary';
      case 'Supercritical': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Flow Characteristics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Flow Characteristics
            <Badge variant={getFlowStateColor(results.flowState)}>
              {results.flowState}
            </Badge>
          </CardTitle>
          <CardDescription>Calculated hydraulic properties of the flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-baseline bg-secondary p-3 rounded-lg">
            <Label className="text-sm text-muted-foreground">Normal Flow Depth</Label>
            <p className="text-xl font-bold">
              {formatNumber(results.normalDepth)} 
              <span className="text-sm font-normal text-muted-foreground ml-1">{lengthUnit}</span>
            </p>
          </div>
          
          <div className="flex justify-between items-baseline bg-secondary p-3 rounded-lg">
            <Label className="text-sm text-muted-foreground">Flow Velocity</Label>
            <p className="text-xl font-bold">
              {formatNumber(results.velocity)} 
              <span className="text-sm font-normal text-muted-foreground ml-1">{velocityUnit}</span>
            </p>
          </div>
          
          <div className="flex justify-between items-baseline bg-secondary p-3 rounded-lg">
            <Label className="text-sm text-muted-foreground">Froude Number</Label>
            <p className="text-xl font-bold">
              {formatNumber(results.froudeNumber, 3)}
            </p>
          </div>

          <div className="flex justify-between items-baseline bg-secondary p-3 rounded-lg">
            <Label className="text-sm text-muted-foreground">Critical Depth</Label>
            <p className="text-xl font-bold">
              {formatNumber(results.criticalDepth)} 
              <span className="text-sm font-normal text-muted-foreground ml-1">{lengthUnit}</span>
            </p>
          </div>
          
          {/* Formula Reference for Manning's Equation */}
          <FormulaReference
            formulaId="mannings-equation"
            units={units}
            currentValues={{
              Q: results.velocity * results.hydraulicProperties.area, // Calculated flow
              k: units === 'metric' ? 1.0 : 1.486,
              A: results.hydraulicProperties.area,
              R: results.hydraulicProperties.hydraulicRadius,
              S: results.criticalSlope // Using critical slope as approximation
            }}
            className="mt-4"
          />
        </CardContent>
      </Card>

      {/* Design Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Design</CardTitle>
          <CardDescription>Final design dimensions including freeboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-baseline bg-secondary p-3 rounded-lg">
            <Label className="text-sm text-muted-foreground">Design Freeboard</Label>
            <p className="text-xl font-bold">
              {formatNumber(results.freeboard.controlling)} 
              <span className="text-sm font-normal text-muted-foreground ml-1">{lengthUnit}</span>
            </p>
          </div>
          
          <div className="flex justify-between items-baseline bg-secondary p-3 rounded-lg">
            <Label className="text-sm text-muted-foreground">Total Channel Depth</Label>
            <p className="text-xl font-bold">
              {formatNumber(results.geometry.totalDepth)} 
              <span className="text-sm font-normal text-muted-foreground ml-1">{lengthUnit}</span>
            </p>
          </div>
          
          <div className="flex justify-between items-baseline bg-secondary p-3 rounded-lg">
            <Label className="text-sm text-muted-foreground">Top Width</Label>
            <p className="text-xl font-bold">
              {formatNumber(results.geometry.topWidth)} 
              <span className="text-sm font-normal text-muted-foreground ml-1">{lengthUnit}</span>
            </p>
          </div>

          <div className="flex justify-between items-baseline bg-secondary p-3 rounded-lg">
            <Label className="text-sm text-muted-foreground">Flow Area</Label>
            <p className="text-xl font-bold">
              {formatNumber(results.hydraulicProperties.area)} 
              <span className="text-sm font-normal text-muted-foreground ml-1">{areaUnit}</span>
            </p>
          </div>
          
          {/* Formula Reference for Froude Number */}
          <FormulaReference
            formulaId="froude-number"
            units={units}
            currentValues={{
              Fr: results.froudeNumber,
              V: results.velocity,
              g: units === 'metric' ? 9.81 : 32.2,
              D: results.hydraulicProperties.hydraulicDepth
            }}
            className="mt-4"
          />
        </CardContent>
      </Card>

      {/* Advanced Hydraulic Properties */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Advanced Hydraulic Properties</CardTitle>
          <CardDescription>Additional hydraulic parameters for detailed analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Hydraulic Radius</Label>
              <p className="text-lg font-semibold">
                {formatNumber(results.hydraulicProperties.hydraulicRadius)} {lengthUnit}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Wetted Perimeter</Label>
              <p className="text-lg font-semibold">
                {formatNumber(results.hydraulicProperties.wettedPerimeter)} {lengthUnit}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Hydraulic Depth</Label>
              <p className="text-lg font-semibold">
                {formatNumber(results.hydraulicProperties.hydraulicDepth)} {lengthUnit}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Critical Slope</Label>
              <p className="text-lg font-semibold">
                {formatNumber(results.criticalSlope, 4)} {slopeUnit}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Reynolds Number</Label>
              <p className="text-lg font-semibold">
                {formatNumber(results.reynoldsNumber, 0)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Specific Energy</Label>
              <p className="text-lg font-semibold">
                {formatNumber(results.specificEnergy)} {lengthUnit}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Lining Freeboard</Label>
              <p className="text-lg font-semibold">
                {formatNumber(results.freeboard.lining)} {lengthUnit}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Bank Freeboard</Label>
              <p className="text-lg font-semibold">
                {formatNumber(results.freeboard.bank)} {lengthUnit}
              </p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {/* Flow State Interpretation */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Flow Regime Analysis</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">Flow State:</span> {results.flowState} flow 
                (Fr = {formatNumber(results.froudeNumber, 3)})
              </p>
              {results.flowState === 'Subcritical' && (
                <p>• Flow is controlled by downstream conditions. Water surface is smooth and stable.</p>
              )}
              {results.flowState === 'Critical' && (
                <p>• Flow is at critical conditions. Minimum specific energy for the given discharge.</p>
              )}
              {results.flowState === 'Supercritical' && (
                <p>• Flow is controlled by upstream conditions. High velocity, potential for hydraulic jumps.</p>
              )}
              
              <p>
                <span className="font-medium">Reynolds Number:</span> {formatNumber(results.reynoldsNumber, 0)}
                ({results.reynoldsNumber > 4000 ? 'Turbulent' :
                  results.reynoldsNumber > 2000 ? 'Transitional' : 'Laminar'})
              </p>
              
              {results.velocity > (isMetric ? 3 : 10) && (
                <p className="text-amber-600">
                  • High velocity flow - consider erosion protection and energy dissipation.
                </p>
              )}
              
              {results.froudeNumber > 1.5 && (
                <p className="text-red-600">
                  • Very supercritical flow - check for potential hydraulic jump locations downstream.
                </p>
              )}
            </div>
          </div>
          
          {/* Formula Reference for Critical Flow */}
          <FormulaReference
            formulaId="critical-flow-equation"
            units={units}
            currentValues={{
              Q: results.velocity * results.hydraulicProperties.area,
              T: results.hydraulicProperties.topWidth,
              g: units === 'metric' ? 9.81 : 32.2,
              A: results.hydraulicProperties.area
            }}
            className="mt-6"
          />
        </CardContent>
      </Card>
    </div>
  );
}