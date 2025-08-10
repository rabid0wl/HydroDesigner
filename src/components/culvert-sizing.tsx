"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function CulvertSizing() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Culvert Sizing Parameters</CardTitle>
          <CardDescription>Define flow parameters to determine the optimal culvert size.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="design-flow">Design Flow (m³/s)</Label>
            <Input id="design-flow" placeholder="e.g., 15" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headwater-depth">Max Headwater Depth (m)</Label>
            <Input id="headwater-depth" placeholder="e.g., 2.5" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="culvert-length">Culvert Length (m)</Label>
            <Input id="culvert-length" placeholder="e.g., 20" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="culvert-material">Culvert Material</Label>
            <Select>
              <SelectTrigger id="culvert-material">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concrete">Concrete</SelectItem>
                <SelectItem value="cmp">Corrugated Metal Pipe (CMP)</SelectItem>
                <SelectItem value="hdpe">HDPE</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label htmlFor="culvert-shape">Culvert Shape</Label>
            <Select>
              <SelectTrigger id="culvert-shape">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circular">Circular</SelectItem>
                <SelectItem value="box">Box (Rectangular)</SelectItem>
                <SelectItem value="arch">Arch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full">Size Culvert</Button>
        </CardContent>
      </Card>
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Optimal Culvert Dimensions</CardTitle>
            <CardDescription>Recommended culvert size based on your inputs.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-secondary p-6 rounded-lg text-center">
              <Label className="text-sm text-muted-foreground">Recommended Diameter (m)</Label>
              <p className="text-4xl font-bold mt-2">1.8</p>
              <p className="text-muted-foreground text-sm">(for circular culvert)</p>
            </div>
             <div className="bg-secondary p-6 rounded-lg text-center">
              <Label className="text-sm text-muted-foreground">Resulting Headwater (m)</Label>
              <p className="text-4xl font-bold mt-2">2.45</p>
              <p className="text-green-500 text-sm">Within acceptable limits</p>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Culvert Visualization</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                    <Image src="https://placehold.co/600x400.png" alt="Culvert diagram" layout="fill" objectFit="contain" className="p-4" data-ai-hint="culvert diagram" />
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
