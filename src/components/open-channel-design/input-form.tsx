"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { ChannelShape, ChannelInputs, ValidationError } from "@/lib/hydraulics/open-channel";
import { manningCoefficients, validateManningN } from "@/lib/hydraulics/open-channel";
import { useProjectData } from "@/context/ProjectDataContext";

interface InputFormProps {
  units: 'metric' | 'imperial';
  onCalculate: (inputs: ChannelInputs) => void;
  loading?: boolean;
  errors?: ValidationError[];
}

export function InputForm({ units, onCalculate, loading, errors }: InputFormProps) {
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

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
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
    const newErrors: ValidationError[] = [];
    const newWarnings: string[] = [];

    // Flow rate validation
    const flowRateNum = parseFloat(flowRate);
    if (!flowRate || isNaN(flowRateNum) || flowRateNum <= 0) {
      newErrors.push({ field: 'flowRate', message: 'Flow rate must be a positive number', severity: 'error' });
    }

    // Slope validation
    const slopeNum = parseFloat(channelSlope);
    if (!channelSlope || isNaN(slopeNum) || slopeNum <= 0) {
      newErrors.push({ field: 'slope', message: 'Channel slope must be a positive number', severity: 'error' });
    } else if (slopeNum > 0.1) {
      newWarnings.push('Very steep slope - results may be unrealistic for open channel flow');
    }

    // Manning's n validation
    const nValue = manningN === 'custom' ? parseFloat(customManningN) : parseFloat(manningN);
    const nValidation = validateManningN(nValue);
    if (!nValidation.valid) {
      newErrors.push({ field: 'manningN', message: nValidation.message || 'Invalid Manning\'s n', severity: 'error' });
    } else if (nValidation.message) {
      newWarnings.push(nValidation.message);
    }

    // Geometry validation
    switch (channelShape) {
      case 'rectangular':
      case 'trapezoidal':
        const widthNum = parseFloat(bottomWidth);
        if (!bottomWidth || isNaN(widthNum) || widthNum <= 0) {
          newErrors.push({ field: 'bottomWidth', message: 'Bottom width must be a positive number', severity: 'error' });
        }
        
        if (channelShape === 'trapezoidal') {
          const slopeSideNum = parseFloat(sideSlope);
          if (!sideSlope || isNaN(slopeSideNum) || slopeSideNum < 0) {
            newErrors.push({ field: 'sideSlope', message: 'Side slope must be a non-negative number', severity: 'error' });
          } else if (slopeSideNum > 10) {
            newWarnings.push('Very steep side slopes may be unstable');
          }
        }
        break;

      case 'triangular':
        const triangularSlopeNum = parseFloat(sideSlope);
        if (!sideSlope || isNaN(triangularSlopeNum) || triangularSlopeNum <= 0) {
          newErrors.push({ field: 'sideSlope', message: 'Side slope must be a positive number for triangular channels', severity: 'error' });
        }
        break;

      case 'circular':
        const diameterNum = parseFloat(diameter);
        if (!diameter || isNaN(diameterNum) || diameterNum <= 0) {
          newErrors.push({ field: 'diameter', message: 'Diameter must be a positive number', severity: 'error' });
        }
        break;
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
            <Label htmlFor="flow-rate">Design Flow Rate ({flowUnit})</Label>
            <Input 
              id="flow-rate" 
              placeholder={isMetric ? "e.g., 10.5" : "e.g., 370"} 
              type="number" 
              step="any"
              value={flowRate} 
              onChange={(e) => setFlowRate(e.target.value)}
              className={allErrors.some(e => e.field === 'flowRate') ? 'border-red-500' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="channel-slope">Channel Slope ({slopeUnit})</Label>
            <Input 
              id="channel-slope" 
              placeholder="e.g., 0.005" 
              type="number" 
              step="any"
              value={channelSlope} 
              onChange={(e) => setChannelSlope(e.target.value)}
              className={allErrors.some(e => e.field === 'slope') ? 'border-red-500' : ''}
            />
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
                className={allErrors.some(e => e.field === 'manningN') ? 'border-red-500' : ''}
              />
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
              <Label htmlFor="bottom-width">Bottom Width ({lengthUnit})</Label>
              <Input 
                id="bottom-width" 
                placeholder={isMetric ? "e.g., 5" : "e.g., 16"} 
                type="number" 
                step="any"
                value={bottomWidth} 
                onChange={(e) => setBottomWidth(e.target.value)}
                className={allErrors.some(e => e.field === 'bottomWidth') ? 'border-red-500' : ''}
              />
            </div>
          )}

          {(channelShape === 'trapezoidal' || channelShape === 'triangular') && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="side-slope">Side Slope (H:1V)</Label>
              <Input 
                id="side-slope" 
                placeholder="e.g., 2 (means 2:1 horizontal to vertical)" 
                type="number" 
                step="any"
                value={sideSlope} 
                onChange={(e) => setSideSlope(e.target.value)}
                className={allErrors.some(e => e.field === 'sideSlope') ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Side slope ratio (horizontal distance per unit vertical rise)
              </p>
            </div>
          )}

          {channelShape === 'circular' && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="diameter">Pipe Diameter ({lengthUnit})</Label>
              <Input 
                id="diameter" 
                placeholder={isMetric ? "e.g., 1.2" : "e.g., 4"} 
                type="number" 
                step="any"
                value={diameter} 
                onChange={(e) => setDiameter(e.target.value)}
                className={allErrors.some(e => e.field === 'diameter') ? 'border-red-500' : ''}
              />
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