"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { Units } from "@/app/page";
import { useProjectData } from "@/context/ProjectDataContext";

interface PumpDesignProps {
  units: Units;
}

const metricChartData = [
  { name: 'Pump A', efficiency: 85, head: 55, 'power': 15.2 },
  { name: 'Pump B', efficiency: 82, head: 60, 'power': 16.5 },
  { name: 'Pump C', efficiency: 88, head: 52, 'power': 14.8 },
];

const usChartData = [
  { name: 'Pump A', efficiency: 85, head: 180, 'power': 20.4 },
  { name: 'Pump B', efficiency: 82, head: 197, 'power': 22.1 },
  { name: 'Pump C', efficiency: 88, head: 171, 'power': 19.8 },
];

export function PumpDesign({ units }: PumpDesignProps) {
  const { pumpDesignInputs, setPumpDesignInputs } = useProjectData();
  const isMetric = units === 'metric';

  const flowUnit = isMetric ? 'm³/h' : 'gpm';
  const headUnit = isMetric ? 'm' : 'ft';
  const tempUnit = isMetric ? '°C' : '°F';
  const powerUnit = isMetric ? 'kW' : 'hp';

  // Use context state instead of local state
  const {
    designFlow,
    totalHead,
    fluidType,
    fluidTemp
  } = pumpDesignInputs;

  // Helper functions to update context
  const setDesignFlow = (value: string) => setPumpDesignInputs({ designFlow: value });
  const setTotalHead = (value: string) => setPumpDesignInputs({ totalHead: value });
  const setFluidType = (value: string) => setPumpDesignInputs({ fluidType: value });
  const setFluidTemp = (value: string) => setPumpDesignInputs({ fluidTemp: value });
  
  const chartData = isMetric ? metricChartData : usChartData;
  const selectedPump = isMetric ? {
    name: 'Pump C',
    efficiency: '88%',
    head: '52m',
    power: '14.8 kW',
    npshr: '4.5 m'
  } : {
    name: 'Pump C',
    efficiency: '88%',
    head: '171 ft',
    power: '19.8 hp',
    npshr: '14.8 ft'
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>System Requirements</CardTitle>
          <CardDescription>Enter the system requirements to find a suitable pump.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="design-flow">Design Flow Rate ({flowUnit})</Label>
            <Input
              id="design-flow"
              placeholder={isMetric ? "e.g., 150" : "e.g., 660"}
              type="number"
              value={designFlow}
              onChange={(e) => setDesignFlow(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="total-head">Total Dynamic Head ({headUnit})</Label>
            <Input
              id="total-head"
              placeholder={isMetric ? "e.g., 50" : "e.g., 164"}
              type="number"
              value={totalHead}
              onChange={(e) => setTotalHead(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fluid-type">Fluid Type</Label>
            <Input
              id="fluid-type"
              placeholder="e.g., Water"
              value={fluidType}
              onChange={(e) => setFluidType(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fluid-temp">Fluid Temperature ({tempUnit})</Label>
            <Input
              id="fluid-temp"
              placeholder={isMetric ? "e.g., 20" : "e.g., 68"}
              type="number"
              value={fluidTemp}
              onChange={(e) => setFluidTemp(e.target.value)}
            />
          </div>
          <Button className="w-full">Find Pumps</Button>
        </CardContent>
      </Card>
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Recommended Pumps</CardTitle>
            <CardDescription>A comparison of suitable pumps for your system.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                  formatter={(value, name) => {
                    if (name === 'head') return [`${value} ${headUnit}`];
                    if (name === 'efficiency') return [`${value}%`];
                    return [value];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="head" fill="hsl(var(--primary))" name={`Head (${headUnit})`} />
                <Bar yAxisId="right" dataKey="efficiency" fill="hsl(var(--accent))" name="Efficiency (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Selected Pump: {selectedPump.name}</CardTitle>
            <CardDescription>Detailed specifications and performance curve.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Best Efficiency Point</Label>
              <p className="text-xl font-bold">{selectedPump.efficiency}</p>
            </div>
             <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Operating Head ({headUnit})</Label>
              <p className="text-xl font-bold">{selectedPump.head}</p>
            </div>
             <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Power Required ({powerUnit})</Label>
              <p className="text-xl font-bold">{selectedPump.power}</p>
            </div>
             <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">NPSHr ({headUnit})</Label>
              <p className="text-xl font-bold">{selectedPump.npshr}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}