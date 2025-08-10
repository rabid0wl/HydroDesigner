"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function OpenChannelDesign() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Channel Parameters</CardTitle>
          <CardDescription>Enter the parameters for your open channel design.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="flow-rate">Flow Rate (m³/s)</Label>
            <Input id="flow-rate" placeholder="e.g., 10.5" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-slope">Channel Slope (m/m)</Label>
            <Input id="channel-slope" placeholder="e.g., 0.005" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manning-n">Manning's Roughness (n)</Label>
            <Input id="manning-n" placeholder="e.g., 0.013" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-shape">Channel Shape</Label>
            <Select>
              <SelectTrigger id="channel-shape">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangular">Rectangular</SelectItem>
                <SelectItem value="trapezoidal">Trapezoidal</SelectItem>
                <SelectItem value="triangular">Triangular</SelectItem>
                <SelectItem value="circular">Circular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full">Calculate</Button>
        </CardContent>
      </Card>
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Calculated channel characteristics.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Flow Depth (m)</Label>
              <p className="text-2xl font-bold">1.25</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Flow Velocity (m/s)</Label>
              <p className="text-2xl font-bold">2.80</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Froude Number</Label>
              <p className="text-2xl font-bold">0.80</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Flow State</Label>
              <p className="text-2xl font-bold">Subcritical</p>
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
