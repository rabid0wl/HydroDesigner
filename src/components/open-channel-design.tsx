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
  liningFreeboard: string;
  bankFreeboard: string;
  controllingFreeboard: string;
  totalDepth: string;
  topWidth: string;
}

const manningData = [
    { label: "Concrete, Finished", value: "0.012", type: "hard-surface" },
    { label: "Earth, Clean, Straight", value: "0.019", type: "earth-lining" },
    { label: "Earth, Winding, Some Weeds", value: "0.025", type: "earth-lining" },
    { label: "Gravel, Firm, Clean", value: "0.027", type: "earth-lining" },
    { label: "Rock Cut, Smooth", value: "0.033", type: "hard-surface" },
    { label: "Rock Cut, Jagged", value: "0.040", type: "hard-surface" },
    { label: "Grass, Short", value: "0.028", type: "earth-lining" },
    { label: "Grass, High", value: "0.040", type: "earth-lining" },
    { label: "Brush & Weeds, Dense", value: "0.100", type: "earth-lining" },
    { label: "Custom", value: "custom", type: "custom" },
];


export function OpenChannelDesign({ units }: OpenChannelDesignProps) {
  const [flowRate, setFlowRate] = useState("");
  const [channelSlope, setChannelSlope] = useState("");
  const [manningN, setManningN] = useState("0.012");
  const [customManningN, setCustomManningN] = useState("");
  const [channelShape, setChannelShape] = useState<Shape | "">("rectangular");
  const [bottomWidth, setBottomWidth] = useState("");
  const [sideSlope, setSideSlope] = useState("");
  
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMetric = units === 'metric';
  const flowUnit = isMetric ? 'm³/s' : 'ft³/s';
  const slopeUnit = isMetric ? 'm/m' : 'ft/ft';
  const lengthUnit = isMetric ? 'm' : 'ft';
  const velocityUnit = isMetric ? 'm/s' : 'ft/s';

  const handleManningSelect = (value: string) => {
    if (value === 'custom') {
        setManningN('custom');
    } else {
        const selectedManning = manningData.find(m => m.value === value);
        if (selectedManning) {
            setManningN(selectedManning.value);
        }
    }
  }

  const getLiningTypeFromManning = () => {
    if (manningN === 'custom') {
        // Default to hard-surface for custom, or could ask user
        return 'hard-surface';
    }
    const selected = manningData.find(m => m.value === manningN);
    return selected?.type || 'hard-surface';
  }


  const calculateFreeboardsFromChart = (capacity: number) => {
    const liningType = getLiningTypeFromManning();
    
    // Top curve: Height of Canal Bank Above W.S.
    const bankFreeboard = 0.49 * Math.pow(capacity, 0.28);

    // Middle curve: Height of hard surface or buried membrane lining above W.S.
    const hardSurfaceFreeboard = 0.31 * Math.pow(capacity, 0.24);
    
    // Bottom curve: Height of earth lining above W.S. (Piecewise function)
    let earthLiningFreeboard;
    if (capacity < 200) {
      earthLiningFreeboard = 0.5;
    } else {
      earthLiningFreeboard = 0.10 * Math.pow(capacity, 0.30);
    }

    const liningFreeboard = liningType === 'earth-lining' ? earthLiningFreeboard : hardSurfaceFreeboard;
    const controllingFreeboard = Math.max(liningFreeboard, bankFreeboard);

    return {
      liningFreeboard: Math.max(liningFreeboard, 0.5), // Min 0.5ft safeguard
      bankFreeboard: Math.max(bankFreeboard, 0.5), // Min 0.5ft safeguard
      controllingFreeboard: Math.max(controllingFreeboard, 0.5) // Min 0.5ft safeguard
    };
  };


  const calculateResults = () => {
    setError(null);
    setResults(null);

    const Q = parseFloat(flowRate);
    const S = parseFloat(channelSlope);
    const n = manningN === 'custom' ? parseFloat(customManningN) : parseFloat(manningN);
    const b = parseFloat(bottomWidth);
    const z = parseFloat(sideSlope);

    const requiredInputs = [Q, S, n, b];
    if (channelShape === 'trapezoidal') {
      requiredInputs.push(z);
    }

    if (requiredInputs.some(val => isNaN(val) || val <= 0)) {
      setError("Please fill in all required fields with valid, positive numbers.");
      return;
    }
    
    if (channelShape !== 'rectangular' && channelShape !== 'trapezoidal') {
      setError("Only rectangular and trapezoidal channel calculations are implemented at this time.");
      return;
    }

    const unitConversion = isMetric ? 1.0 : 1.49;

    const manningFunc = (y: number) => {
      let A, P;
      if (channelShape === 'rectangular') {
        A = b * y;
        P = b + 2 * y;
      } else { // Trapezoidal
        A = (b + z * y) * y;
        P = b + 2 * y * Math.sqrt(1 + z * z);
      }
      if (P === 0) return -Q;
      const R = A / P;
      return (unitConversion / n) * A * Math.pow(R, 2/3) * Math.pow(S, 1/2) - Q;
    };

    let y_low = 0.0001;
    let y_high = 50.0;
    let y_mid = 0;
    const tol = 1e-6;
    let iterations = 0;
    const maxIterations = 100;

    if (manningFunc(y_low) * manningFunc(y_high) >= 0) {
        setError("Cannot find a solution in the expected range. Please check your input values, they may be physically unrealistic.");
        return;
    }

    while ((y_high - y_low) / 2.0 > tol && iterations < maxIterations) {
        y_mid = (y_low + y_high) / 2.0;
        if (manningFunc(y_mid) === 0.0) break;
        if (manningFunc(y_low) * manningFunc(y_mid) < 0) {
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
    let final_A, T;
    if (channelShape === 'rectangular') {
      final_A = b * final_y;
      T = b;
    } else { // Trapezoidal
      final_A = (b + z * final_y) * final_y;
      T = b + 2 * z * final_y;
    }

    const v = Q / final_A;
    const D = final_A / T; // Hydraulic depth
    const g = isMetric ? 9.81 : 32.2;
    const Fr = v / Math.sqrt(g * D);
    const flowState = Fr < 1 ? "Subcritical" : Fr > 1 ? "Supercritical" : "Critical";

    let freeboardResult = {
        liningFreeboard: 0,
        bankFreeboard: 0,
        controllingFreeboard: 0,
    };
    if (isMetric) {
      // Convert 0.5ft to meters for metric default
      const defaultFreeboard = 0.1524;
      freeboardResult = {
          liningFreeboard: Math.max(final_y / 3, defaultFreeboard),
          bankFreeboard: Math.max(final_y / 3, defaultFreeboard),
          controllingFreeboard: Math.max(final_y / 3, defaultFreeboard),
      }
    } else {
      // Use the chart-based calculation for US units
      freeboardResult = calculateFreeboardsFromChart(Q);
    }
    
    const totalCalculatedDepth = final_y + freeboardResult.controllingFreeboard;
    const finalTotalDepth = isMetric ? (Math.ceil(totalCalculatedDepth * 10) / 10) : Math.ceil(totalCalculatedDepth);
    
    let finalTopWidth;
    if (channelShape === 'rectangular') {
      finalTopWidth = b;
    } else { // Trapezoidal
      finalTopWidth = b + 2 * z * finalTotalDepth;
    }

    setResults({
      flowDepth: final_y.toFixed(2),
      flowVelocity: v.toFixed(2),
      froudeNumber: Fr.toFixed(2),
      flowState: flowState,
      liningFreeboard: freeboardResult.liningFreeboard.toFixed(2),
      bankFreeboard: freeboardResult.bankFreeboard.toFixed(2),
      controllingFreeboard: freeboardResult.controllingFreeboard.toFixed(2),
      totalDepth: finalTotalDepth.toFixed(2),
      topWidth: finalTopWidth.toFixed(2),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Channel Design</CardTitle>
          <CardDescription>Enter the properties of the channel and flow to calculate the design parameters.</CardDescription>
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
            <Label htmlFor="manning-material">Channel Material (Manning's n)</Label>
            <Select onValueChange={handleManningSelect} value={manningN}>
              <SelectTrigger id="manning-material">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {manningData.map(m => (
                    <SelectItem key={m.label} value={m.value}>
                        {m.label} ({m.value !== 'custom' && `n=${m.value}`})
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {manningN === 'custom' && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="manning-n">Custom Manning's Roughness (n)</Label>
              <Input id="manning-n" placeholder="Enter custom 'n' value" type="number" value={customManningN} onChange={(e) => setCustomManningN(e.target.value)} />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="channel-shape">Channel Shape</Label>
            <Select onValueChange={(value) => setChannelShape(value as Shape)} value={channelShape}>
              <SelectTrigger id="channel-shape">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangular">Rectangular</SelectItem>
                <SelectItem value="trapezoidal">Trapezoidal</SelectItem>
                <SelectItem value="triangular" disabled>Triangular (coming soon)</SelectItem>
                <SelectItem value="circular" disabled>Circular (coming soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
              <Label htmlFor="bottom-width">Bottom Width ({lengthUnit})</Label>
              <Input id="bottom-width" placeholder={isMetric ? "e.g., 5" : "e.g., 16"} type="number" value={bottomWidth} onChange={(e) => setBottomWidth(e.target.value)} />
          </div>

          {channelShape === 'trapezoidal' && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="side-slope">Side Slope (H:1V)</Label>
              <Input id="side-slope" placeholder="e.g., 2" type="number" value={sideSlope} onChange={(e) => setSideSlope(e.target.value)} />
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
            <CardTitle>Hydraulic Results</CardTitle>
            <CardDescription>Calculated flow characteristics.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-2 gap-6">
            <div className="bg-secondary p-6 rounded-lg">
              <Label className="text-sm text-muted-foreground">Normal Flow Depth ({lengthUnit})</Label>
              <p className="text-3xl font-bold">{results?.flowDepth ?? '-'}</p>
            </div>
            <div className="bg-secondary p-6 rounded-lg">
              <Label className="text-sm text-muted-foreground">Flow Velocity ({velocityUnit})</Label>
              <p className="text-3xl font-bold">{results?.flowVelocity ?? '-'}</p>
            </div>
            <div className="bg-secondary p-6 rounded-lg">
              <Label className="text-sm text-muted-foreground">Froude Number</Label>
              <p className="text-3xl font-bold">{results ? `${results.froudeNumber} (${results.flowState})` : '-'}</p>
            </div>
            <div className="bg-secondary p-6 rounded-lg">
                <Label className="text-sm text-muted-foreground">Freeboard Requirements ({lengthUnit})</Label>
                <div className="text-lg font-bold mt-1">
                    <p>Lining: {results?.liningFreeboard ?? '-'}</p>
                    <p>Bank: {results?.bankFreeboard ?? '-'}</p>
                </div>
            </div>
          </CardContent>
        </Card>
        {results && (
          <Card className="animate-in fade-in">
            <CardHeader>
              <CardTitle>Final Channel Design</CardTitle>
              <CardDescription>Recommended final dimensions for construction.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                <Label className="text-sm text-muted-foreground">Design Freeboard ({lengthUnit})</Label>
                <p className="text-3xl font-bold">{results.controllingFreeboard}</p>
                <p className="text-xs text-muted-foreground">Controlling freeboard value</p>
              </div>
              <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                <Label className="text-sm text-muted-foreground">Total Channel Depth ({lengthUnit})</Label>
                <p className="text-3xl font-bold">{results.totalDepth}</p>
                <p className="text-xs text-muted-foreground">Flow Depth + Freeboard, rounded up</p>
              </div>
              <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                <Label className="text-sm text-muted-foreground">Top Width of Channel ({lengthUnit})</Label>
                <p className="text-3xl font-bold">{results.topWidth}</p>
                <p className="text-xs text-muted-foreground">At total channel depth</p>
              </div>
            </CardContent>
          </Card>
        )}
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
