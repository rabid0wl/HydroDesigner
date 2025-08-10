"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Units } from "@/app/page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface OpenChannelDesignProps {
  units: Units;
}

type Shape = "rectangular" | "trapezoidal" | "triangular" | "circular";

interface Results {
  flowDepth: string;
  flowVelocity: string;
  froudeNumber: string;
  flowState: string;
}

export function OpenChannelDesign({ units }: OpenChannelDesignProps) {
  const [flowRate, setFlowRate] = useState("");
  const [channelSlope, setChannelSlope] = useState("");
  const [manningN, setManningN] = useState("");
  const [channelShape, setChannelShape] = useState<Shape | "">("");
  const [bottomWidth, setBottomWidth] = useState("");

  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMetric = units === 'metric';
  const flowUnit = isMetric ? 'm³/s' : 'ft³/s';
  const slopeUnit = isMetric ? 'm/m' : 'ft/ft';
  const lengthUnit = isMetric ? 'm' : 'ft';
  const velocityUnit = isMetric ? 'm/s' : 'ft/s';

  const calculateResults = () => {
    setError(null);
    setResults(null);

    const Q = parseFloat(flowRate);
    const S = parseFloat(channelSlope);
    const n = parseFloat(manningN);
    const b = parseFloat(bottomWidth);

    if (isNaN(Q) || Q <= 0 || isNaN(S) || S <= 0 || isNaN(n) || n <= 0 || (channelShape === 'rectangular' && (isNaN(b) || b <= 0))) {
      setError("Please fill in all required fields with valid, positive numbers.");
      return;
    }
    
    if (channelShape !== 'rectangular') {
      setError("Only rectangular channel calculations are implemented at this time.");
      return;
    }

    const unitConversion = isMetric ? 1.0 : 1.49;

    // Function f(y) = (K/n) * A * R^(2/3) * S^(1/2) - Q
    // We want to find y such that f(y) = 0
    const manningFunc = (y: number) => {
      const A = b * y;
      const P = b + 2 * y;
      if (P === 0) return -Q; // Avoid division by zero
      const R = A / P;
      return (unitConversion / n) * A * Math.pow(R, 2/3) * Math.pow(S, 1/2) - Q;
    };

    // Bisection method to find the root 'y' (normal depth)
    let y_low = 0.0001; // Lower bound for depth
    let y_high = 50.0;  // Upper bound for depth (a reasonable large number)
    let y_mid = 0;
    const tol = 1e-6; // Tolerance for convergence
    let iterations = 0;
    const maxIterations = 100;

    if (manningFunc(y_low) * manningFunc(y_high) >= 0) {
        setError("Cannot find a solution in the expected range. Please check your input values, they may be physically unrealistic.");
        return;
    }

    while ((y_high - y_low) / 2.0 > tol && iterations < maxIterations) {
        y_mid = (y_low + y_high) / 2.0;
        if (manningFunc(y_mid) === 0.0) {
            break; // Found exact solution
        } else if (manningFunc(y_low) * manningFunc(y_mid) < 0) {
            y_high = y_mid;
        } else {
            y_low = y_mid;
        }
        iterations++;
    }

    if (iterations >= maxIterations) {
      setError("Calculation did not converge. Please check your input values.");
      return;
    }

    const final_y = (y_low + y_high) / 2.0;
    const final_A = b * final_y;
    const v = Q / final_A;
    const D = final_A / b; // Hydraulic depth for rectangular channel
    const g = isMetric ? 9.81 : 32.2;
    const Fr = v / Math.sqrt(g * D);
    const flowState = Fr < 1 ? "Subcritical" : Fr > 1 ? "Supercritical" : "Critical";

    setResults({
      flowDepth: final_y.toFixed(2),
      flowVelocity: v.toFixed(2),
      froudeNumber: Fr.toFixed(2),
      flowState: flowState,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Channel Parameters</CardTitle>
          <CardDescription>Enter the hydraulic and geometric properties of the open channel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="flow-rate">Flow Rate ({flowUnit})</Label>
            <Input id="flow-rate" placeholder={isMetric ? "e.g., 10.5" : "e.g., 370"} type="number" value={flowRate} onChange={(e) => setFlowRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-slope">Channel Slope ({slopeUnit})</Label>
            <Input id="channel-slope" placeholder="e.g., 0.005" type="number" value={channelSlope} onChange={(e) => setChannelSlope(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manning-n">Manning's Roughness (n)</Label>
            <Input id="manning-n" placeholder="e.g., 0.013" type="number" value={manningN} onChange={(e) => setManningN(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-shape">Channel Shape</Label>
            <Select onValueChange={(value) => setChannelShape(value as Shape)} value={channelShape}>
              <SelectTrigger id="channel-shape">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangular">Rectangular</SelectItem>
                <SelectItem value="trapezoidal" disabled>Trapezoidal (coming soon)</SelectItem>
                <SelectItem value="triangular" disabled>Triangular (coming soon)</SelectItem>
                <SelectItem value="circular" disabled>Circular (coming soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {channelShape === 'rectangular' && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="bottom-width">Bottom Width ({lengthUnit})</Label>
              <Input id="bottom-width" placeholder={isMetric ? "e.g., 5" : "e.g., 16"} type="number" value={bottomWidth} onChange={(e) => setBottomWidth(e.target.value)} />
            </div>
          )}
          <Button className="w-full" onClick={calculateResults}>Calculate</Button>
        </CardContent>
      </Card>
      <div className="lg:col-span-2 space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Calculated channel characteristics.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Flow Depth ({lengthUnit})</Label>
              <p className="text-2xl font-bold">{results?.flowDepth ?? '-'}</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Flow Velocity ({velocityUnit})</Label>
              <p className="text-2xl font-bold">{results?.flowVelocity ?? '-'}</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Froude Number</Label>
              <p className="text-2xl font-bold">{results?.froudeNumber ?? '-'}</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Flow State</Label>
              <p className="text-2xl font-bold">{results?.flowState ?? '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Channel Visualization</CardTitle>
            <CardDescription>A cross-section of the designed channel.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center bg-muted h-64 rounded-lg">
            <p className="text-muted-foreground">Channel visualization placeholder</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
