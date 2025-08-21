"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";
import type { Units } from "@/app/page";
import { useProjectData } from "@/context/ProjectDataContext";
import { CulvertParams } from "@/lib/hydraulics/culvert-types";

// Zod schema for validation
const culvertInputsSchema = z.object({
  designFlow: z.number().positive("Design flow must be positive"),
  maxHeadwater: z.number().positive("Maximum headwater must be positive"),
  culvertLength: z.number().positive("Culvert length must be positive"),
 upstreamInvert: z.number(),
  downstreamInvert: z.number(),
  skewAngle: z.number().min(0).max(45, "Skew angle must be between 0 and 45 degrees"),
  blockageFactor: z.number().min(0).max(0.5, "Blockage factor must be between 0 and 0.5"),
  minCoverDepth: z.number().min(0),
  multipleCulverts: z.number().int().min(1).max(6, "Number of culverts must be between 1 and 6"),
  returnPeriod: z.number().int().min(10).max(500),
  fishVelocityLimit: z.number().min(0),
  fishDepthMin: z.number().min(0),
});

interface FormProps {
  units: Units;
  onCalculate: (params: CulvertParams) => void;
  loading?: boolean;
}

export function Form({ units, onCalculate, loading }: FormProps) {
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
    minCoverDepth,
    multipleCulverts,
    returnPeriod,
    aquaticPassage,
    fishVelocityLimit,
    fishDepthMin,
    debrisLoad
  } = culvertInputs;

  // Get minCoverDepth with unit-appropriate default
  const minCoverDepthValue = culvertInputs.minCoverDepth === '2.0' && isMetric ? '0.6' :
                       culvertInputs.minCoverDepth === '0.6' && !isMetric ? '2.0' :
                       culvertInputs.minCoverDepth;

  const [validationErrors, setValidationErrors] = useState<any[]>([]);
 const [warnings, setWarnings] = useState<string[]>([]);
  const [isTailwaterAuto, setIsTailwaterAuto] = useState(false);

  // Helper functions to update context
  const setDesignFlow = (value: string) => setCulvertInputs({ designFlow: value });
  const setMaxHeadwater = (value: string) => setCulvertInputs({ maxHeadwater: value });
  const setCulvertLength = (value: string) => setCulvertInputs({ culvertLength: value });
  const setCulvertMaterial = (value: any) => setCulvertInputs({ culvertMaterial: value });
  const setUpstreamInvert = (value: string) => setCulvertInputs({ upstreamInvert: value });
  const setDownstreamInvert = (value: string) => setCulvertInputs({ downstreamInvert: value });
  const setShowAdvanced = (value: boolean) => setCulvertInputs({ showAdvanced: value });
  const setEntranceType = (value: any) => setCulvertInputs({ entranceType: value });
  const setSkewAngle = (value: string) => setCulvertInputs({ skewAngle: value });
  const setBlockageFactor = (value: string) => setCulvertInputs({ blockageFactor: value });
  const setMinCoverDepth = (value: string) => setCulvertInputs({ minCoverDepth: value });
  const setMultipleCulverts = (value: string) => setCulvertInputs({ multipleCulverts: value });
  const setReturnPeriod = (value: string) => setCulvertInputs({ returnPeriod: value });
  const setAquaticPassage = (value: boolean) => setCulvertInputs({ aquaticPassage: value });
  const setFishVelocityLimit = (value: string) => setCulvertInputs({ fishVelocityLimit: value });
  const setFishDepthMin = (value: string) => setCulvertInputs({ fishDepthMin: value });
  const setDebrisLoad = (value: any) => setCulvertInputs({ debrisLoad: value });

  useEffect(() => {
    if (channelRatingCurve && channelRatingCurve.length > 0) {
      setIsTailwaterAuto(true);
    } else {
      setIsTailwaterAuto(false);
    }
  }, [channelRatingCurve]);

  const validateInputs = (): boolean => {
    const newErrors: any[] = [];
    const newWarnings: string[] = [];

    // Parse inputs
    const parsedInputs = {
      designFlow: parseFloat(designFlow),
      maxHeadwater: parseFloat(maxHeadwater),
      culvertLength: parseFloat(culvertLength),
      upstreamInvert: parseFloat(upstreamInvert),
      downstreamInvert: parseFloat(downstreamInvert),
      skewAngle: parseFloat(skewAngle),
      blockageFactor: parseFloat(blockageFactor),
      minCoverDepth: parseFloat(minCoverDepthValue),
      multipleCulverts: parseInt(multipleCulverts),
      returnPeriod: parseInt(returnPeriod),
      fishVelocityLimit: parseFloat(fishVelocityLimit),
      fishDepthMin: parseFloat(fishDepthMin),
    };

    // Zod validation
    try {
      culvertInputsSchema.parse(parsedInputs);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          newErrors.push({ field: err.path.join('.'), message: err.message, severity: 'error' });
        });
      }
    }

    // Additional validation
    if (parsedInputs.upstreamInvert <= parsedInputs.downstreamInvert) {
      newErrors.push({ field: 'elevation', message: 'Upstream invert must be higher than downstream invert', severity: 'error' });
    }

    // Additional warnings
    const slope = (parsedInputs.upstreamInvert - parsedInputs.downstreamInvert) / parsedInputs.culvertLength;
    if (slope > 0.1) {
      newWarnings.push('Very steep slope (>10%) - check for erosion concerns');
    }

    if (slope < 0.001) {
      newWarnings.push('Slope is very flat (<0.1%) - may not be self-cleaning');
    }

    setValidationErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  };

  const handleCalculate = async () => {
    if (!validateInputs()) return;

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
      minCoverDepth: parseFloat(minCoverDepthValue),
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

    onCalculate(params);
  };

  return (
    <Card>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="design-flow">Design Flow ({flowUnit})</Label>
                <span className="text-xs text-muted-foreground">{flowUnit}</span>
              </div>
              <Input
                id="design-flow"
                type="number"
                value={designFlow}
                onChange={(e) => setDesignFlow(e.target.value)}
                className={validationErrors.some(e => e.field.includes('designFlow')) ? 'border-red-500' : ''}
              />
              {validationErrors.some(e => e.field.includes('designFlow')) && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.find(e => e.field.includes('designFlow'))?.message}
                </p>
              )}
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
                      Currently for reference only. In future versions, this will influence design flow calculations and safety factors. Standard practice: 10-year for highways, 25-year for local roads.
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
              <div className="flex items-center justify-between">
                <Label htmlFor="culvert-length">Culvert Length ({lengthUnit})</Label>
                <span className="text-xs text-muted-foreground">{lengthUnit}</span>
              </div>
              <Input
                id="culvert-length"
                type="number"
                value={culvertLength}
                onChange={(e) => setCulvertLength(e.target.value)}
                className={validationErrors.some(e => e.field.includes('culvertLength')) ? 'border-red-500' : ''}
              />
              {validationErrors.some(e => e.field.includes('culvertLength')) && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.find(e => e.field.includes('culvertLength'))?.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between min-h-[20px]">
                <Label htmlFor="headwater-depth">Max Headwater ({lengthUnit})</Label>
                <span className="text-xs text-muted-foreground">{lengthUnit}</span>
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
                type="number"
                value={maxHeadwater}
                onChange={(e) => setMaxHeadwater(e.target.value)}
                className={validationErrors.some(e => e.field.includes('maxHeadwater')) ? 'border-red-500' : ''}
              />
              {validationErrors.some(e => e.field.includes('maxHeadwater')) && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.find(e => e.field.includes('maxHeadwater'))?.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="upstream-invert">Upstream Invert ({lengthUnit})</Label>
                <span className="text-xs text-muted-foreground">{lengthUnit}</span>
              </div>
              <Input
                id="upstream-invert"
                type="number"
                step="0.1"
                value={upstreamInvert}
                onChange={(e) => setUpstreamInvert(e.target.value)}
                className={validationErrors.some(e => e.field.includes('elevation')) ? 'border-red-500' : ''}
              />
              {validationErrors.some(e => e.field.includes('elevation')) && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.find(e => e.field.includes('elevation'))?.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="downstream-invert">Downstream Invert ({lengthUnit})</Label>
                <span className="text-xs text-muted-foreground">{lengthUnit}</span>
              </div>
              <Input
                id="downstream-invert"
                type="number"
                step="0.1"
                value={downstreamInvert}
                onChange={(e) => setDownstreamInvert(e.target.value)}
                className={validationErrors.some(e => e.field.includes('elevation')) ? 'border-red-500' : ''}
              />
              {validationErrors.some(e => e.field.includes('elevation')) && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.find(e => e.field.includes('elevation'))?.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="culvert-material">Culvert Material</Label>
            <Select value={culvertMaterial} onValueChange={(value: any) => setCulvertMaterial(value)}>
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
                    className={validationErrors.some(e => e.field.includes('skewAngle')) ? 'border-red-500' : ''}
                  />
                  {validationErrors.some(e => e.field.includes('skewAngle')) && (
                    <p className="text-xs text-red-500 mt-1">
                      {validationErrors.find(e => e.field.includes('skewAngle'))?.message}
                    </p>
                  )}
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
                    className={validationErrors.some(e => e.field.includes('blockageFactor')) ? 'border-red-500' : ''}
                  />
                  {validationErrors.some(e => e.field.includes('blockageFactor')) && (
                    <p className="text-xs text-red-500 mt-1">
                      {validationErrors.find(e => e.field.includes('blockageFactor'))?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cover-depth">Min Cover Depth ({lengthUnit})</Label>
                    <span className="text-xs text-muted-foreground">{lengthUnit}</span>
                  </div>
                  <Input
                    id="cover-depth"
                    type="number"
                    step="0.1"
                    value={minCoverDepthValue}
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="fish-velocity">Max Fish Swimming Velocity ({velocityUnit})</Label>
                  <span className="text-xs text-muted-foreground">{velocityUnit}</span>
                </div>
                <Input
                  id="fish-velocity"
                  type="number"
                  step="0.1"
                  value={fishVelocityLimit}
                  onChange={(e) => setFishVelocityLimit(e.target.value)}
                />
                {validationErrors.some(e => e.field.includes('fishVelocityLimit')) && (
                  <p className="text-xs text-red-300 mt-1">
                    {validationErrors.find(e => e.field.includes('fishVelocityLimit'))?.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fish-depth">Min Fish Passage Depth ({lengthUnit})</Label>
                  <span className="text-xs text-muted-foreground">{lengthUnit}</span>
                </div>
                <Input
                  id="fish-depth"
                  type="number"
                  step="0.1"
                  value={fishDepthMin}
                  onChange={(e) => setFishDepthMin(e.target.value)}
                />
                {validationErrors.some(e => e.field.includes('fishDepthMin')) && (
                  <p className="text-xs text-red-300 mt-1">
                    {validationErrors.find(e => e.field.includes('fishDepthMin'))?.message}
                  </p>
                )}
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

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Button
          className="w-full"
          onClick={handleCalculate}
          disabled={loading}
        >
          {loading ? (
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
  );
}