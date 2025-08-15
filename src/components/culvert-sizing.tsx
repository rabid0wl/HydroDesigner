"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import type { Units } from "@/app/page";
import { CulvertCalculator } from "@/lib/hydraulics/culvert-calculator";
import type { CulvertParams, ScenarioResult, CulvertMaterial, CulvertShape } from "@/lib/hydraulics/culvert-types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, AlertTriangle, CheckCircle, Star, TrendingUp } from "lucide-react";
import { useProjectData } from "@/context/ProjectDataContext";
import { FormulaReference, MultipleFormulaReference } from "@/components/ui/formula-reference";

interface CulvertSizingProps {
  units: Units;
}

export function CulvertSizing({ units }: CulvertSizingProps) {
  const { channelRatingCurve, culvertInputs, setCulvertInputs } = useProjectData();
  const isMetric = units === 'metric';

  const flowUnit = isMetric ? 'm³/s' : 'ft³/s';
  const lengthUnit = isMetric ? 'm' : 'ft';
  const velocityUnit = isMetric ? 'm/s' : 'ft/s';

  // Use context state instead of local state
  const {
    designFlow,
    maxHeadwater,
    culvertLength,
    culvertMaterial,
    upstreamInvert,
    downstreamInvert,
    showAdvanced,
    entranceType,
    skewAngle,
    blockageFactor,
    multipleCulverts,
    returnPeriod,
    aquaticPassage,
    fishVelocityLimit,
    fishDepthMin,
    debrisLoad
  } = culvertInputs;

  // Get minCoverDepth with unit-appropriate default
  const minCoverDepth = culvertInputs.minCoverDepth === '2.0' && isMetric ? '0.6' :
                       culvertInputs.minCoverDepth === '0.6' && !isMetric ? '2.0' :
                       culvertInputs.minCoverDepth;

  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [isTailwaterAuto, setIsTailwaterAuto] = useState(true);
  
  // UI state
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPerformanceChart, setShowPerformanceChart] = useState(false);

  // Helper functions to update context
  const setDesignFlow = (value: string) => setCulvertInputs({ designFlow: value });
  const setMaxHeadwater = (value: string) => setCulvertInputs({ maxHeadwater: value });
  const setCulvertLength = (value: string) => setCulvertInputs({ culvertLength: value });
  const setCulvertMaterial = (value: CulvertMaterial) => setCulvertInputs({ culvertMaterial: value });
  const setUpstreamInvert = (value: string) => setCulvertInputs({ upstreamInvert: value });
  const setDownstreamInvert = (value: string) => setCulvertInputs({ downstreamInvert: value });
  const setShowAdvanced = (value: boolean) => setCulvertInputs({ showAdvanced: value });
  const setEntranceType = (value: 'projecting' | 'headwall' | 'wingwall') => setCulvertInputs({ entranceType: value });
  const setSkewAngle = (value: string) => setCulvertInputs({ skewAngle: value });
  const setBlockageFactor = (value: string) => setCulvertInputs({ blockageFactor: value });
  const setMinCoverDepth = (value: string) => setCulvertInputs({ minCoverDepth: value });
  const setMultipleCulverts = (value: string) => setCulvertInputs({ multipleCulverts: value });
  const setReturnPeriod = (value: string) => setCulvertInputs({ returnPeriod: value });
  const setAquaticPassage = (value: boolean) => setCulvertInputs({ aquaticPassage: value });
  const setFishVelocityLimit = (value: string) => setCulvertInputs({ fishVelocityLimit: value });
  const setFishDepthMin = (value: string) => setCulvertInputs({ fishDepthMin: value });
  const setDebrisLoad = (value: 'low' | 'medium' | 'high') => setCulvertInputs({ debrisLoad: value });

  useEffect(() => {
    if (channelRatingCurve && channelRatingCurve.length > 0) {
      setIsTailwaterAuto(true);
    } else {
      setIsTailwaterAuto(false);
    }
  }, [channelRatingCurve]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    try {
      const params: CulvertParams = {
        projectName: 'Culvert Design Analysis',
        location: 'Project Site',
        designDate: new Date().toISOString(),
        designFlow: parseFloat(designFlow),
        returnPeriod: parseInt(returnPeriod),
        upstreamInvert: parseFloat(upstreamInvert),
        downstreamInvert: parseFloat(downstreamInvert),
        culvertLength: parseFloat(culvertLength),
        maxHeadwater: parseFloat(maxHeadwater),
        tailwaterRatingCurve: isTailwaterAuto && channelRatingCurve ? channelRatingCurve : [],
        streamSlope: (parseFloat(upstreamInvert) - parseFloat(downstreamInvert)) / parseFloat(culvertLength),
        roadClass: 'primary',
        skewAngle: parseFloat(skewAngle),
        material: culvertMaterial,
        shape: 'box', // Shape is evaluated for all types, this is a placeholder
        entranceType: entranceType,
        multipleCulverts: parseInt(multipleCulverts),
        blockageFactor: parseFloat(blockageFactor),
        minCoverDepth: parseFloat(minCoverDepth),
        maxWidth: isMetric ? 30 : 100,
        environmentalFactors: {
          debrisLoad: debrisLoad,
          sedimentTransport: true,
          aquaticPassage: aquaticPassage,
          fishPassageParams: aquaticPassage ? {
            lowFlowVelocity: parseFloat(fishVelocityLimit),
            lowFlowDepth: parseFloat(fishDepthMin),
            baffles: false
          } : undefined,
        },
        buoyancyUpliftParams: {
          highGroundwater: false,
          floodCondition: false
        },
        units: units === 'us' ? 'english' : 'metric',
      };

      const calculator = new CulvertCalculator(params);
      const scenarioResults = calculator.evaluateCulvertScenarios();
      
      // Convert scenarioResults object to flat array of results
      const resultsArray = Object.values(scenarioResults).flatMap(arr => arr || []);
      
      // Add optimization scores and sort results
      const scoredResults = resultsArray.map(result => ({
        ...result,
        optimizationScore: calculateOptimizationScore(result, params)
      }));
      
      setResults(scoredResults);
    } catch (error) {
      console.error('Calculation error:', error);
      // Could add error toast here
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate optimization score based on engineering criteria
  const calculateOptimizationScore = (result: ScenarioResult, params: CulvertParams) => {
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

  // Group and sort results by shape and optimization score
  const getOrganizedResults = () => {
    const grouped: { [key in CulvertShape]?: ScenarioResult[] } = {};
    
    results.forEach(result => {
      if (!grouped[result.shape]) {
        grouped[result.shape] = [];
      }
      grouped[result.shape]!.push(result);
    });
    
    // Sort each group by optimization score (highest first)
    Object.keys(grouped).forEach(shape => {
      grouped[shape as CulvertShape]!.sort((a, b) =>
        (b as any).optimizationScore - (a as any).optimizationScore
      );
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Culvert Design Inputs</CardTitle>
          <CardDescription>Enter the required information to evaluate culvert scenarios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Basic Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <Label htmlFor="design-flow">Design Flow ({flowUnit})</Label>
                <Input
                  id="design-flow"
                  placeholder={isMetric ? "e.g., 15" : "e.g., 530"}
                  type="number"
                  value={designFlow}
                  onChange={(e) => setDesignFlow(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[20px]">
                  <Label htmlFor="return-period">Return Period (years)</Label>
                  <Popover>
                    <PopoverTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </PopoverTrigger>
                    <PopoverContent>
                      <p className="text-sm">
                        Currently for reference only. In future versions, this will influence design flow calculations and safety factors. Standard practice: 100-year for highways, 25-year for local roads.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                <Select value={returnPeriod} onValueChange={setReturnPeriod}>
                  <SelectTrigger id="return-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 years</SelectItem>
                    <SelectItem value="25">25 years</SelectItem>
                    <SelectItem value="50">50 years</SelectItem>
                    <SelectItem value="100">100 years</SelectItem>
                    <SelectItem value="500">500 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <Label htmlFor="culvert-length">Culvert Length ({lengthUnit})</Label>
                <Input
                  id="culvert-length"
                  placeholder={isMetric ? "e.g., 20" : "e.g., 65"}
                  type="number"
                  value={culvertLength}
                  onChange={(e) => setCulvertLength(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[20px]">
                  <Label htmlFor="headwater-depth">Max Headwater ({lengthUnit})</Label>
                  <Popover>
                    <PopoverTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </PopoverTrigger>
                    <PopoverContent>
                      <p className="text-sm">
                        Maximum water surface elevation allowed at the upstream end, typically limited by road elevation.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  id="headwater-depth"
                  placeholder={isMetric ? "e.g., 2.5" : "e.g., 8.2"}
                  type="number"
                  value={maxHeadwater}
                  onChange={(e) => setMaxHeadwater(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upstream-invert">Upstream Invert ({lengthUnit})</Label>
                <Input
                  id="upstream-invert"
                  placeholder={isMetric ? "e.g., 100.0" : "e.g., 328.0"}
                  type="number"
                  step="0.1"
                  value={upstreamInvert}
                  onChange={(e) => setUpstreamInvert(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="downstream-invert">Downstream Invert ({lengthUnit})</Label>
                <Input
                  id="downstream-invert"
                  placeholder={isMetric ? "e.g., 99.5" : "e.g., 326.5"}
                  type="number"
                  step="0.1"
                  value={downstreamInvert}
                  onChange={(e) => setDownstreamInvert(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="culvert-material">Culvert Material</Label>
              <Select value={culvertMaterial} onValueChange={(value: CulvertMaterial) => setCulvertMaterial(value)}>
                <SelectTrigger id="culvert-material">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concrete">Concrete - Durable, 75+ year life</SelectItem>
                  <SelectItem value="corrugatedMetal">Corrugated Metal - Cost effective, 50 year life</SelectItem>
                  <SelectItem value="hdpe">HDPE - Corrosion resistant, 100+ year life</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Parameters Section */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Advanced Parameters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>
            
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-800 rounded-lg text-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entrance-type">Entrance Type</Label>
                    <Select value={entranceType} onValueChange={(value: any) => setEntranceType(value)}>
                      <SelectTrigger id="entrance-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="projecting">Projecting (Ke=0.9)</SelectItem>
                        <SelectItem value="headwall">Headwall (Ke=0.5)</SelectItem>
                        <SelectItem value="wingwall">Wingwall (Ke=0.2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="skew-angle">Skew Angle (degrees)</Label>
                    <Input
                      id="skew-angle"
                      type="number"
                      min="0"
                      max="45"
                      value={skewAngle}
                      onChange={(e) => setSkewAngle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="blockage-factor">Debris Blockage Factor</Label>
                      <Popover>
                        <PopoverTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </PopoverTrigger>
                        <PopoverContent>
                          <p className="text-sm">
                            Decimal factor (0.0-0.5) representing percentage of culvert area blocked by debris.
                            Directly reduces effective flow area in hydraulic calculations. Example: 0.1 = 10% blockage.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Input
                      id="blockage-factor"
                      type="number"
                      min="0"
                      max="0.5"
                      step="0.05"
                      value={blockageFactor}
                      onChange={(e) => setBlockageFactor(e.target.value)}
                      placeholder="0.0 - 0.5 (e.g., 0.1 = 10%)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cover-depth">Min Cover Depth ({lengthUnit})</Label>
                    <Input
                      id="cover-depth"
                      type="number"
                      step="0.1"
                      value={minCoverDepth}
                      onChange={(e) => setMinCoverDepth(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="multiple-culverts">Number of Barrels</Label>
                    <Select value={multipleCulverts} onValueChange={setMultipleCulverts}>
                      <SelectTrigger id="multiple-culverts">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Single Barrel</SelectItem>
                        <SelectItem value="2">2 - Double Barrel</SelectItem>
                        <SelectItem value="3">3 - Triple Barrel</SelectItem>
                        <SelectItem value="4">4 - Quad Barrel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="debris-load">Debris Loading</Label>
                      <Popover>
                        <PopoverTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </PopoverTrigger>
                        <PopoverContent>
                          <p className="text-sm">
                            Site condition assessment for debris potential based on upstream vegetation and development.
                            Influences maintenance requirements and design considerations, unlike blockage factor which directly affects hydraulic calculations.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Select value={debrisLoad} onValueChange={(value: any) => setDebrisLoad(value)}>
                      <SelectTrigger id="debris-load">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Rural/Open</SelectItem>
                        <SelectItem value="medium">Medium - Mixed</SelectItem>
                        <SelectItem value="high">High - Forested/Urban</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Environmental Parameters */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="aquatic-passage"
                checked={aquaticPassage}
                onChange={(e) => setAquaticPassage(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="aquatic-passage">Enable Fish Passage Analysis</Label>
              <Popover>
                <PopoverTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent>
                  <p className="text-sm">
                    Analyzes culvert design against NOAA/NMFS fish passage criteria including velocity barriers and jumping requirements.
                  </p>
                </PopoverContent>
              </Popover>
            </div>

            {aquaticPassage && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-800 rounded-lg text-white">
                <div className="space-y-2">
                  <Label htmlFor="fish-velocity">Max Fish Swimming Velocity ({velocityUnit})</Label>
                  <Input
                    id="fish-velocity"
                    type="number"
                    step="0.1"
                    value={fishVelocityLimit}
                    onChange={(e) => setFishVelocityLimit(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fish-depth">Min Fish Passage Depth ({lengthUnit})</Label>
                  <Input
                    id="fish-depth"
                    type="number"
                    step="0.1"
                    value={fishDepthMin}
                    onChange={(e) => setFishDepthMin(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {isTailwaterAuto && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800">
                  Tailwater conditions automatically imported from Open Channel module
                </span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleCalculate}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Analyzing Scenarios...
              </>
            ) : (
              'Evaluate Scenarios'
            )}
          </Button>
        </CardContent>
      </Card>
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Optimized Culvert Recommendations</CardTitle>
            <CardDescription>
              Viable culvert options grouped by shape and ranked by engineering optimization criteria including hydraulic performance, constructability, and cost-effectiveness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              (() => {
                const organizedResults = getOrganizedResults();
                return (
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
                                        {((result as any).optimizationScore).toFixed(0)}%
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
                                      <span>{maxHeadwater ? ((result.hydraulics.headwater / parseFloat(maxHeadwater)) * 100).toFixed(0) + '%' : 'N/A'}</span>
                                    </div>
                                    {maxHeadwater && (
                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className={`h-1.5 rounded-full ${
                                            (result.hydraulics.headwater / parseFloat(maxHeadwater)) > 0.9 ? 'bg-red-500' :
                                            (result.hydraulics.headwater / parseFloat(maxHeadwater)) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                                          }`}
                                          style={{ width: `${Math.min((result.hydraulics.headwater / parseFloat(maxHeadwater)) * 100, 100)}%` }}
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
                                    {aquaticPassage && (
                                      <Badge
                                        variant={result.hydraulics.velocity <= parseFloat(fishVelocityLimit) ? 'default' : 'destructive'}
                                        className="text-xs px-1.5 py-0.5"
                                      >
                                        {result.hydraulics.velocity <= parseFloat(fishVelocityLimit) ? '🐟 Fish OK' : '🐟 Fish Barrier'}
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
                              {results.length} viable options evaluated. Recommendations prioritize hydraulic efficiency,
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
                          HW: results.length > 0 ? results[0].hydraulics.headwater : 0,
                          D: results.length > 0 && results[0].size.diameter ? results[0].size.diameter :
                             results.length > 0 && results[0].size.height ? results[0].size.height : 1,
                          Q: parseFloat(designFlow),
                          A: results.length > 0 ? results[0].size.area : 1,
                          c: 0.0398, // Default for concrete circular
                          Y: 0.67,
                          S: 0
                        },
                        'outlet-control-energy': {
                          HW: results.length > 0 ? results[0].hydraulics.headwater : 0,
                          TW: 0, // Simplified
                          he: 0.5, // Typical entrance loss
                          hf: 0.1, // Typical friction loss
                          ho: results.length > 0 ? Math.pow(results[0].hydraulics.velocity, 2) / (2 * (isMetric ? 9.81 : 32.2)) : 0,
                          ΔZ: parseFloat(upstreamInvert) - parseFloat(downstreamInvert)
                        },
                        'manning-friction-loss': {
                          hf: 0.1, // Typical friction loss
                          n: culvertMaterial === 'concrete' ? 0.013 : culvertMaterial === 'hdpe' ? 0.009 : 0.024,
                          V: results.length > 0 ? results[0].hydraulics.velocity : 0,
                          L: parseFloat(culvertLength),
                          R: results.length > 0 ? results[0].size.area / (4 * Math.sqrt(Math.PI * results[0].size.area)) : 0.5 // Approximation
                        }
                      }}
                      className="mt-6"
                    />
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Ready for Analysis</p>
                  <p className="text-sm">Enter design parameters and click "Evaluate Scenarios" to see optimized culvert recommendations.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}