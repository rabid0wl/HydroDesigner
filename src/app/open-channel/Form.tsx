"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { ChannelShape, ChannelInputs } from "@/lib/hydraulics/open-channel/types";
import { manningCoefficients } from "@/lib/hydraulics/open-channel/manning";
import { useProjectData } from "@/context/ProjectDataContext";

// Zod schema for validation
const channelInputsSchema = z.object({
  flowRate: z.number().positive("Flow rate must be positive"),
  slope: z.number().positive("Channel slope must be positive").max(0.1, "Slope should be less than 0.1"),
  manningN: z.number().positive("Manning's n must be positive").min(0.008, "Manning's n is unusually low").max(0.2, "Manning's n is unusually high"),
  geometry: z.discriminatedUnion("shape", [
    z.object({
      shape: z.literal("rectangular"),
      bottomWidth: z.number().positive("Bottom width must be positive"),
    }),
    z.object({
      shape: z.literal("trapezoidal"),
      bottomWidth: z.number().positive("Bottom width must be positive"),
      sideSlope: z.number().nonnegative("Side slope must be non-negative").max(10, "Very steep side slopes may be unstable"),
    }),
    z.object({
      shape: z.literal("triangular"),
      sideSlope: z.number().positive("Side slope must be positive for triangular channels"),
    }),
    z.object({
      shape: z.literal("circular"),
      diameter: z.number().positive("Diameter must be positive"),
    }),
  ]),
});

interface FormProps {
  units: 'metric' | 'imperial';
  onCalculate: (inputs: ChannelInputs) => void;
  loading?: boolean;
  errors?: any[];
}

export function Form({ units, onCalculate, loading, errors }: FormProps) {
  const { openChannelInputs, setOpenChannelInputs } = useProjectData();
  
  // Use context state instead of local state
  const {
    flowRate,
    channelSlope,
    manningN,
    customManningN,
    channelShape,
    bottomWidth,
    sideSlope,
    diameter
  } = openChannelInputs;

  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Helper functions to update context
  const setFlowRate = (value: string) => setOpenChannelInputs({ flowRate: value });
  const setChannelSlope = (value: string) => setOpenChannelInputs({ channelSlope: value });
  const setManningN = (value: string) => setOpenChannelInputs({ manningN: value });
  const setCustomManningN = (value: string) => setOpenChannelInputs({ customManningN: value });
  const setChannelShape = (value: ChannelShape) => setOpenChannelInputs({ channelShape: value });
  const setBottomWidth = (value: string) => setOpenChannelInputs({ bottomWidth: value });
  const setSideSlope = (value: string) => setOpenChannelInputs({ sideSlope: value });
  const setDiameter = (value: string) => setOpenChannelInputs({ diameter: value });

  const isMetric = units === 'metric';
  const flowUnit = isMetric ? 'm³/s' : 'ft³/s';
  const slopeUnit = isMetric ? 'm/m' : 'ft/ft';
  const lengthUnit = isMetric ? 'm' : 'ft';

  const handleManningSelect = (value: string) => {
    if (value === 'custom') {
      setOpenChannelInputs({ manningN: 'custom' });
    } else {
      const selectedManning = manningCoefficients.find(m => m.value.toString() === value);
      if (selectedManning) {
        setOpenChannelInputs({
          manningN: selectedManning.value.toString(),
          customManningN: selectedManning.value.toString()
        });
      }
    }
  };

  const validateInputs = (): boolean => {
    const newErrors: any[] = [];
    const newWarnings: string[] = [];

    // Parse inputs
    const parsedInputs = {
      flowRate: parseFloat(flowRate),
      slope: parseFloat(channelSlope),
      manningN: manningN === 'custom' ? parseFloat(customManningN) : parseFloat(manningN),
      geometry: {} as any
    };

    // Geometry validation
    switch (channelShape) {
      case 'rectangular':
        parsedInputs.geometry = {
          shape: 'rectangular',
          bottomWidth: parseFloat(bottomWidth)
        };
        break;
      case 'trapezoidal':
        parsedInputs.geometry = {
          shape: 'trapezoidal',
          bottomWidth: parseFloat(bottomWidth),
          sideSlope: parseFloat(sideSlope)
        };
        break;
      case 'triangular':
        parsedInputs.geometry = {
          shape: 'triangular',
          sideSlope: parseFloat(sideSlope)
        };
        break;
      case 'circular':
        parsedInputs.geometry = {
          shape: 'circular',
          diameter: parseFloat(diameter)
        };
        break;
    }

    // Zod validation
    try {
      channelInputsSchema.parse(parsedInputs);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          newErrors.push({ field: err.path.join('.'), message: err.message, severity: 'error' });
        });
      }
    }

    // Additional warnings
    if (parsedInputs.slope > 0.05) {
      newWarnings.push('Very steep slope - results may be unrealistic for open channel flow');
    }

    setValidationErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  };

  const handleCalculate = () => {
    if (!validateInputs()) return;

    const geometry: any = { shape: channelShape };
    
    switch (channelShape) {
      case 'rectangular':
      case 'trapezoidal':
        geometry.bottomWidth = parseFloat(bottomWidth);
        if (channelShape === 'trapezoidal') {
          geometry.sideSlope = parseFloat(sideSlope);
        }
        break;
      case 'triangular':
        geometry.sideSlope = parseFloat(sideSlope);
        break;
      case 'circular':
        geometry.diameter = parseFloat(diameter);
        break;
    }

    const inputs: ChannelInputs = {
      flowRate: parseFloat(flowRate),
      slope: parseFloat(channelSlope),
      manningN: manningN === 'custom' ? parseFloat(customManningN) : parseFloat(manningN),
      geometry,
      units
    };

    onCalculate(inputs);
  };

  // Combine validation errors with external errors
  const allErrors = [...validationErrors, ...(errors || [])];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Design Parameters</CardTitle>
        <CardDescription>Enter the properties of the channel and flow to calculate the design parameters.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Flow Parameters */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Flow Parameters</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="flow-rate">Design Flow Rate ({flowUnit})</Label>
              <span className="text-xs text-muted-foreground">{flowUnit}</span>
            </div>
            <Input
              id="flow-rate"
              type="number"
              step="any"
              value={flowRate}
              onChange={(e) => setFlowRate(e.target.value)}
              className={allErrors.some(e => e.field.includes('flowRate')) ? 'border-red-500' : ''}
            />
            {allErrors.some(e => e.field.includes('flowRate')) && (
              <p className="text-xs text-red-500 mt-1">
                {allErrors.find(e => e.field.includes('flowRate'))?.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="channel-slope">Channel Slope ({slopeUnit})</Label>
              <span className="text-xs text-muted-foreground">{slopeUnit}</span>
            </div>
            <Input
              id="channel-slope"
              type="number"
              step="any"
              value={channelSlope}
              onChange={(e) => setChannelSlope(e.target.value)}
              className={allErrors.some(e => e.field.includes('slope')) ? 'border-red-500' : ''}
            />
            {allErrors.some(e => e.field.includes('slope')) && (
              <p className="text-xs text-red-500 mt-1">
                {allErrors.find(e => e.field.includes('slope'))?.message}
              </p>
            )}
          </div>
        </div>

        {/* Channel Material */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Channel Material</h4>
          
          <div className="space-y-2">
            <Label htmlFor="manning-material">Material Type (Manning's n)</Label>
            <Select onValueChange={handleManningSelect} value={manningN}>
              <SelectTrigger id="manning-material">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {manningCoefficients.map(m => (
                  <SelectItem key={m.label} value={m.value.toString()}>
                    {m.label} (n={m.value})
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Manning's n</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {manningN === 'custom' && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="manning-n">Custom Manning's Roughness (n)</Label>
              <Input
                id="manning-n"
                placeholder="Enter custom 'n' value"
                type="number"
                step="any"
                value={customManningN}
                onChange={(e) => setCustomManningN(e.target.value)}
                className={allErrors.some(e => e.field.includes('manningN')) ? 'border-red-500' : ''}
              />
              {allErrors.some(e => e.field.includes('manningN')) && (
                <p className="text-xs text-red-500 mt-1">
                  {allErrors.find(e => e.field.includes('manningN'))?.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Channel Geometry */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Channel Geometry</h4>
          
          <div className="space-y-2">
            <Label htmlFor="channel-shape">Channel Shape</Label>
            <Select onValueChange={(value) => setChannelShape(value as ChannelShape)} value={channelShape}>
              <SelectTrigger id="channel-shape">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangular">Rectangular</SelectItem>
                <SelectItem value="trapezoidal">Trapezoidal</SelectItem>
                <SelectItem value="triangular">Triangular (V-shaped)</SelectItem>
                <SelectItem value="circular">Circular (partially filled)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(channelShape === 'rectangular' || channelShape === 'trapezoidal') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bottom-width">Bottom Width ({lengthUnit})</Label>
                <span className="text-xs text-muted-foreground">{lengthUnit}</span>
              </div>
              <Input
                id="bottom-width"
                type="number"
                step="any"
                value={bottomWidth}
                onChange={(e) => setBottomWidth(e.target.value)}
                className={allErrors.some(e => e.field.includes('bottomWidth')) ? 'border-red-500' : ''}
              />
              {allErrors.some(e => e.field.includes('bottomWidth')) && (
                <p className="text-xs text-red-500 mt-1">
                  {allErrors.find(e => e.field.includes('bottomWidth'))?.message}
                </p>
              )}
            </div>
          )}
          
          {(channelShape === 'trapezoidal' || channelShape === 'triangular') && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <Label htmlFor="side-slope">Side Slope (H:1V)</Label>
                <span className="text-xs text-muted-foreground">H:1V</span>
              </div>
              <Input
                id="side-slope"
                type="number"
                step="any"
                value={sideSlope}
                onChange={(e) => setSideSlope(e.target.value)}
                className={allErrors.some(e => e.field.includes('sideSlope')) ? 'border-red-500' : ''}
              />
              {allErrors.some(e => e.field.includes('sideSlope')) && (
                <p className="text-xs text-red-500 mt-1">
                  {allErrors.find(e => e.field.includes('sideSlope'))?.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Side slope ratio (horizontal distance per unit vertical rise)
              </p>
            </div>
          )}
          
          {channelShape === 'circular' && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <Label htmlFor="diameter">Pipe Diameter ({lengthUnit})</Label>
                <span className="text-xs text-muted-foreground">{lengthUnit}</span>
              </div>
              <Input
                id="diameter"
                type="number"
                step="any"
                value={diameter}
                onChange={(e) => setDiameter(e.target.value)}
                className={allErrors.some(e => e.field.includes('diameter')) ? 'border-red-500' : ''}
              />
              {allErrors.some(e => e.field.includes('diameter')) && (
                <p className="text-xs text-red-500 mt-1">
                  {allErrors.find(e => e.field.includes('diameter'))?.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {allErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Input Validation</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {allErrors.map((error, index) => (
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
            <AlertTitle>Warnings</AlertTitle>
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
          {loading ? 'Calculating...' : 'Calculate Channel Design'}
        </Button>
      </CardContent>
    </Card>
  );
}