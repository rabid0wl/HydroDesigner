"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SimpleFallbackProps {
  units: 'metric' | 'imperial';
}

export function SimpleFallback({ units }: SimpleFallbackProps) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Open Channel Design - Loading...</CardTitle>
          <CardDescription>The module is being prepared. Please refresh the page in a moment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Units: {units === 'metric' ? 'Metric (m³/s, m)' : 'Imperial (ft³/s, ft)'}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            Refresh Page
          </Button>
        </CardContent>
      </Card>
      
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg mb-2">Open Channel Flow Design</p>
        <p className="text-sm">
          This module includes advanced hydraulic calculations for channel design.
        </p>
        <div className="mt-4 text-xs space-y-1">
          <p>• Rectangular, trapezoidal, triangular, and circular channels</p>
          <p>• Normal depth, critical depth, and flow characteristics</p>
          <p>• Freeboard calculations and design recommendations</p>
          <p>• Rating curves for flow analysis</p>
        </div>
      </div>
    </div>
  );
}