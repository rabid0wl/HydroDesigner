"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

const chartData = [
  { name: 'Pump A', efficiency: 85, head: 55, 'power': 15.2 },
  { name: 'Pump B', efficiency: 82, head: 60, 'power': 16.5 },
  { name: 'Pump C', efficiency: 88, head: 52, 'power': 14.8 },
];

export function PumpDesign() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>System Requirements</CardTitle>
          <CardDescription>Enter the system requirements to find a suitable pump.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="design-flow">Design Flow Rate (m³/h)</Label>
            <Input id="design-flow" placeholder="e.g., 150" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="total-head">Total Dynamic Head (m)</Label>
            <Input id="total-head" placeholder="e.g., 50" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fluid-type">Fluid Type</Label>
            <Input id="fluid-type" placeholder="e.g., Water" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fluid-temp">Fluid Temperature (°C)</Label>
            <Input id="fluid-temp" placeholder="e.g., 20" type="number" />
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
                />
                <Legend />
                <Bar yAxisId="left" dataKey="head" fill="hsl(var(--primary))" name="Head (m)" />
                <Bar yAxisId="right" dataKey="efficiency" fill="hsl(var(--accent))" name="Efficiency (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Selected Pump: Pump C</CardTitle>
            <CardDescription>Detailed specifications and performance curve.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Best Efficiency Point</Label>
              <p className="text-xl font-bold">88%</p>
            </div>
             <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Operating Head (m)</Label>
              <p className="text-xl font-bold">52m</p>
            </div>
             <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Power Required</Label>
              <p className="text-xl font-bold">14.8 kW</p>
            </div>
             <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">NPSHr</Label>
              <p className="text-xl font-bold">4.5 m</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
