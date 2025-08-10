"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export function PipeSizing() {
  const results = [
    { diameter: "150 mm (6 in)", velocity: "1.41 m/s", headloss: "9.8 m/km" },
    { diameter: "200 mm (8 in)", velocity: "0.80 m/s", headloss: "2.5 m/km" },
    { diameter: "250 mm (10 in)", velocity: "0.51 m/s", headloss: "0.9 m/km" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Pipe Sizing Parameters</CardTitle>
          <CardDescription>Input parameters to calculate required pipe diameter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="flow-rate">Flow Rate (L/s)</Label>
            <Input id="flow-rate" placeholder="e.g., 25" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pipe-length">Pipe Length (m)</Label>
            <Input id="pipe-length" placeholder="e.g., 500" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pipe-material">Pipe Material</Label>
            <Select>
              <SelectTrigger id="pipe-material">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pvc">PVC (C=140)</SelectItem>
                <SelectItem value="ductile-iron">Ductile Iron (C=130)</SelectItem>
                <SelectItem value="steel">Steel (C=120)</SelectItem>
                <SelectItem value="hdpe">HDPE (C=150)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="elevation-change">Elevation Change (m)</Label>
            <Input id="elevation-change" placeholder="e.g., 10" type="number" />
          </div>
          <Button className="w-full">Calculate Pipe Size</Button>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Calculation Results</CardTitle>
          <CardDescription>Comparison of different standard pipe sizes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nominal Diameter</TableHead>
                <TableHead>Velocity</TableHead>
                <TableHead>Head Loss</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index} className={index === 1 ? "bg-primary/10" : ""}>
                  <TableCell className="font-medium">{result.diameter}</TableCell>
                  <TableCell>{result.velocity}</TableCell>
                  <TableCell>{result.headloss}</TableCell>
                  <TableCell className="text-right">
                    <Button variant={index === 1 ? "default" : "outline"} size="sm">
                      {index === 1 ? "Optimal" : "Select"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
