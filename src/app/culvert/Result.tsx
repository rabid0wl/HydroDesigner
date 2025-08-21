"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, CheckCircle, Star, TrendingUp } from "lucide-react";
import { MultipleFormulaReference } from "@/components/ui/formula-reference";
import { CulvertShape, ScenarioResult } from "@/lib/hydraulics/culvert-types";
import type { Units } from "@/app/page";

interface ResultProps {
  results: { [key in CulvertShape]?: ScenarioResult[] };
  params: any;
  units: Units;
}

export const Result = memo(function Result({ results, params, units }: ResultProps) {
  const isMetric = units === 'metric';
  const lengthUnit = isMetric ? 'm' : 'ft';
  const velocityUnit = isMetric ? 'm/s' : 'ft/s';

  // Calculate optimization score based on engineering criteria
  const calculateOptimizationScore = (result: ScenarioResult) => {
    let score = 100; // Start with perfect score
    
    // Hydraulic efficiency (lower headwater is better)
    const hwRatio = result.hydraulics.headwater / params.maxHeadwater;
    score -= hwRatio * 30; // Up to 30 point penalty for high headwater
    
    // Velocity optimization (target 3-8 ft/s for erosion control)
    const velocity = result.hydraulics.velocity;
    if (velocity < 3) score -= 15; // Too low, sedimentation risk
    else if (velocity > 8) score -= Math.min(25, (velocity - 8) * 3); // Too high, erosion risk
    
    // Size efficiency (smaller is generally better for cost)
    const area = result.size.area;
    const areaFactor = Math.log(area) / Math.log(10); // Logarithmic penalty for large sizes
    score -= areaFactor * 10;
    
    // Flow control preference (outlet control generally preferred)
    if (result.hydraulics.flowType === 'inlet') score -= 5;
    
    // Froude number optimization (avoid supercritical flow issues)
    if (result.hydraulics.froudeNumber > 1.5) {
      score -= (result.hydraulics.froudeNumber - 1.5) * 10;
    }
    
    // Warning penalties
    score -= result.warnings.length * 15;
    
    return Math.max(0, score);
  };

  // Add optimization scores to results
  const scoredResults = Object.entries(results).reduce((acc, [shape, shapeResults]) => {
    if (shapeResults) {
      acc[shape as CulvertShape] = shapeResults.map(result => ({
        ...result,
        optimizationScore: calculateOptimizationScore(result)
      }));
    }
    return acc;
  }, {} as { [key in CulvertShape]?: (ScenarioResult & { optimizationScore: number })[] });

  // Group and sort results by shape and optimization score
  const getOrganizedResults = () => {
    const grouped: { [key in CulvertShape]?: (ScenarioResult & { optimizationScore: number })[] } = scoredResults;
    
    // Sort each group by optimization score (highest first)
    Object.keys(grouped).forEach(shape => {
      if (grouped[shape as CulvertShape]) {
        grouped[shape as CulvertShape]!.sort((a, b) =>
          (b as any).optimizationScore - (a as any).optimizationScore
        );
      }
    });
    
    return grouped;
  };

  const renderSize = (result: ScenarioResult) => {
    if (result.shape === 'circular') {
        return `Ø ${result.size.diameter?.toFixed(2)} ${lengthUnit}`;
    }
    if (result.shape === 'box') {
        return `${result.size.width?.toFixed(2)} × ${result.size.height?.toFixed(2)} ${lengthUnit}`;
    }
    if (result.shape === 'arch') {
        return `${result.size.span?.toFixed(2)} × ${result.size.rise?.toFixed(2)} ${lengthUnit}`;
    }
    return '-';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
 };

  const getShapeIcon = (shape: CulvertShape) => {
    switch(shape) {
      case 'circular': return '⭕';
      case 'box': return '⬜';
      case 'arch': return '🌉';
      default: return '◯';
    }
  };

  const getShapeDescription = (shape: CulvertShape) => {
    switch(shape) {
      case 'circular': return 'Round pipes - best for smaller flows, lower cost, easier installation';
      case 'box': return 'Rectangular - better for shallow cover, pedestrian/vehicle clearance';
      case 'arch': return 'Arch shape - natural streambed, fish passage, high capacity';
      default: return '';
    }
  };

  const organizedResults = getOrganizedResults();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimized Culvert Recommendations</CardTitle>
        <CardDescription>
          Viable culvert options grouped by shape and ranked by engineering optimization criteria including hydraulic performance, constructability, and cost-effectiveness.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div aria-live="polite">
        {Object.keys(organizedResults).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(organizedResults).map(([shape, shapeResults]) => (
              <div key={shape} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getShapeIcon(shape as CulvertShape)}</span>
                  <div>
                    <h3 className="text-lg font-semibold capitalize">{shape} Culverts</h3>
                    <p className="text-sm text-muted-foreground">{getShapeDescription(shape as CulvertShape)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {shapeResults?.slice(0, 6).map((result, index) => (
                    <Card key={`${shape}-${index}`} className={`relative ${index === 0 ? 'ring-2 ring-blue-400 shadow-md' : 'hover:shadow-md transition-shadow'}`}>
                      {index === 0 && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge className="bg-blue-600 text-white text-xs px-2 py-1 shadow-md">
                            <Star className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="pb-2 pt-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-medium leading-tight">{renderSize(result)}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {getPerformanceBadge((result as any).optimizationScore)}
                              <span className={`text-xs font-medium ${getPerformanceColor((result as any).optimizationScore)}`}>
                                {(result as any).optimizationScore.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <div className="text-muted-foreground">Area</div>
                            <div className="font-medium">{result.size.area.toFixed(1)} {lengthUnit}²</div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 pb-3 space-y-2">
                        {/* Compact Hydraulic Performance */}
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Headwater:</span>
                              <span className="font-medium">{result.hydraulics.headwater.toFixed(2)} {lengthUnit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">HW/D Ratio:</span>
                              <span className={`font-medium ${
                                (result.hydraulics.headwater / (result.size.diameter || result.size.height || 1)) > 1.5
                                  ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {(result.hydraulics.headwater / (result.size.diameter || result.size.height || 1)).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Velocity:</span>
                              <span className={`font-medium ${
                                result.hydraulics.velocity > 10 ? 'text-red-600' :
                                result.hydraulics.velocity < 2 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {result.hydraulics.velocity.toFixed(1)} {velocityUnit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Froude:</span>
                              <span className={`font-medium ${
                                result.hydraulics.froudeNumber > 1.5 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {result.hydraulics.froudeNumber.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Visual Progress Bar for Headwater Utilization */}
                          <div className="space-y-1 mt-2">
                            <div className="flex justify-between text-xs">
                              <span>Headwater Utilization</span>
                              <span>{params.maxHeadwater ? ((result.hydraulics.headwater / parseFloat(params.maxHeadwater)) * 100).toFixed(0) + '%' : 'N/A'}</span>
                            </div>
                            {params.maxHeadwater && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    (result.hydraulics.headwater / parseFloat(params.maxHeadwater)) > 0.9 ? 'bg-red-500' :
                                    (result.hydraulics.headwater / parseFloat(params.maxHeadwater)) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min((result.hydraulics.headwater / parseFloat(params.maxHeadwater)) * 100, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Enhanced Engineering Indicators */}
                        <div className="flex justify-between items-center text-xs pt-2 border-t">
                          <div className="flex gap-1 flex-wrap">
                            <Badge
                              variant={result.hydraulics.flowType === 'outlet' ? 'default' : 'secondary'}
                              className="text-xs px-1.5 py-0.5"
                            >
                              {result.hydraulics.flowType} control
                            </Badge>
                            <Badge
                              variant={result.hydraulics.froudeNumber > 1 ? "destructive" : "default"}
                              className="text-xs px-1.5 py-0.5"
                            >
                              {result.hydraulics.froudeNumber > 1 ? 'Supercritical' : 'Subcritical'}
                            </Badge>
                            {params.aquaticPassage && (
                              <Badge
                                variant={result.hydraulics.velocity <= parseFloat(params.fishVelocityLimit) ? 'default' : 'destructive'}
                                className="text-xs px-1.5 py-0.5"
                              >
                                {result.hydraulics.velocity <= parseFloat(params.fishVelocityLimit) ? '🐟 Fish OK' : '🐟 Fish Barrier'}
                              </Badge>
                            )}
                          </div>
                          {result.warnings.length > 0 && (
                            <Popover>
                              <PopoverTrigger>
                                <div className="flex items-center gap-1 text-amber-600 hover:text-amber-700 cursor-pointer">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs">{result.warnings.length} warning{result.warnings.length > 1 ? 's' : ''}</span>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold">Engineering Warnings</h4>
                                  {result.warnings.map((warning, wIndex) => (
                                    <div key={wIndex} className="text-xs text-gray-700 border-l-2 border-amber-400 pl-2">
                                      {warning}
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {shapeResults && shapeResults.length > 4 && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      +{shapeResults.length - 4} additional {shape} options available
                    </Badge>
                  </div>
                )}
              </div>
            ))}
            
            {/* Summary insights */}
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Engineering Summary</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Object.values(results).reduce((acc, arr) => acc + (arr?.length || 0), 0)} viable options evaluated. Recommendations prioritize hydraulic efficiency,
                      construction feasibility, and long-term performance. Consider site-specific factors like
                      fish passage requirements, debris loading, and maintenance access.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Formula References for Culvert Design */}
            <MultipleFormulaReference
              formulaIds={['fhwa-inlet-control', 'outlet-control-energy', 'manning-friction-loss']}
              units={units === 'us' ? 'imperial' : units as 'metric' | 'imperial'}
              title="Culvert Design Formulas"
              currentValues={{
                'fhwa-inlet-control': {
                  HW: Object.values(results)[0]?.[0]?.hydraulics.headwater || 0,
                  D: (Object.values(results)[0]?.[0]?.size.diameter ? Object.values(results)[0][0].size.diameter :
                     (Object.values(results)[0]?.[0]?.size.height ? Object.values(results)[0][0].size.height : 1)) || 1,
                  Q: parseFloat(params.designFlow),
                  A: Object.values(results)[0]?.[0]?.size.area || 1,
                  c: 0.0398, // Default for concrete circular
                  Y: 0.67,
                  S: 0
                },
                'outlet-control-energy': {
                  HW: Object.values(results)[0]?.[0]?.hydraulics.headwater || 0,
                  TW: 0, // Simplified
                  he: 0.5, // Typical entrance loss
                  hf: 0.1, // Typical friction loss
                  ho: Object.values(results)[0]?.[0]?.hydraulics.velocity ? 
                      Math.pow(Object.values(results)[0][0].hydraulics.velocity, 2) / (2 * (isMetric ? 9.81 : 32.2)) : 0,
                  ΔZ: parseFloat(params.upstreamInvert) - parseFloat(params.downstreamInvert)
                },
                'manning-friction-loss': {
                  hf: 0.1, // Typical friction loss
                  n: params.culvertMaterial === 'concrete' ? 0.013 : params.culvertMaterial === 'hdpe' ? 0.009 : 0.024,
                  V: Object.values(results)[0]?.[0]?.hydraulics.velocity || 0,
                  L: parseFloat(params.culvertLength),
                  R: Object.values(results)[0]?.[0]?.size.area ? 
                      Object.values(results)[0][0].size.area / (4 * Math.sqrt(Math.PI * Object.values(results)[0][0].size.area)) : 0.5 // Approximation
                }
              }}
              className="mt-6"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Ready for Analysis</p>
              <p className="text-sm">Enter design parameters and click "Evaluate Scenarios" to see optimized culvert recommendations.</p>
            </div>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
});