"use client";

import { HydraulicResults, ChannelShape } from "@/lib/hydraulics/open-channel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ChannelVisualizationProps {
  results: HydraulicResults;
  geometry: {
    shape: ChannelShape;
    bottomWidth?: number;
    sideSlope?: number;
    diameter?: number;
  };
  units: 'metric' | 'imperial';
}

export function ChannelVisualization({ results, geometry, units }: ChannelVisualizationProps) {
  const lengthUnit = units === 'metric' ? 'm' : 'ft';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Cross-Section</CardTitle>
        <CardDescription>Visual representation of the designed channel with flow depth and freeboard.</CardDescription>
      </CardHeader>
      <CardContent className="bg-muted min-h-[500px] rounded-lg p-4 flex items-center justify-center">
        <ChannelCrossSection
          shape={geometry.shape}
          bottomWidth={geometry.bottomWidth || 0}
          sideSlope={geometry.sideSlope || 0}
          diameter={geometry.diameter || 0}
          flowDepth={results.normalDepth}
          totalDepth={results.geometry.totalDepth}
          topWidth={results.geometry.topWidth}
          lengthUnit={lengthUnit}
        />
      </CardContent>
    </Card>
  );
}

interface ChannelCrossSectionProps {
  shape: ChannelShape;
  bottomWidth: number;
  sideSlope: number;
  diameter: number;
  flowDepth: number;
  totalDepth: number;
  topWidth: number;
  lengthUnit: string;
}

function ChannelCrossSection({
  shape,
  bottomWidth,
  sideSlope,
  diameter,
  flowDepth,
  totalDepth,
  topWidth,
  lengthUnit
}: ChannelCrossSectionProps) {
  if (!flowDepth || !totalDepth) {
    return (
      <div className="flex items-center justify-center h-full w-full text-muted-foreground">
        Calculate channel parameters to see visualization
      </div>
    );
  }

  const containerWidth = 600;
  const containerHeight = 500;
  const viewPadding = 60;

  // Calculate scaling and positioning based on channel type
  let scale: number;
  let xOffset: number;
  let yOffset: number;

  if (shape === 'circular') {
    // For circular channels, scale based on diameter
    scale = Math.min(
      (containerWidth - viewPadding * 2) / diameter,
      (containerHeight - viewPadding * 2) / diameter
    );
    xOffset = (containerWidth - diameter * scale) / 2;
    yOffset = (containerHeight - diameter * scale) / 2;
  } else {
    // For other shapes, scale based on top width and total depth
    const maxTopWidth = Math.max(topWidth, bottomWidth + 2 * sideSlope * totalDepth);
    scale = Math.min(
      (containerWidth - viewPadding * 2) / maxTopWidth,
      (containerHeight - viewPadding * 2) / totalDepth
    );
    xOffset = (containerWidth - maxTopWidth * scale) / 2;
    yOffset = viewPadding;
  }

  return (
    <svg
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
    >
      {shape === 'rectangular' && (
        <RectangularChannel
          bottomWidth={bottomWidth}
          flowDepth={flowDepth}
          totalDepth={totalDepth}
          scale={scale}
          xOffset={xOffset}
          yOffset={yOffset}
          lengthUnit={lengthUnit}
        />
      )}
      
      {shape === 'trapezoidal' && (
        <TrapezoidalChannel
          bottomWidth={bottomWidth}
          sideSlope={sideSlope}
          flowDepth={flowDepth}
          totalDepth={totalDepth}
          scale={scale}
          xOffset={xOffset}
          yOffset={yOffset}
          lengthUnit={lengthUnit}
        />
      )}
      
      {shape === 'triangular' && (
        <TriangularChannel
          sideSlope={sideSlope}
          flowDepth={flowDepth}
          totalDepth={totalDepth}
          scale={scale}
          xOffset={xOffset}
          yOffset={yOffset}
          lengthUnit={lengthUnit}
        />
      )}
      
      {shape === 'circular' && (
        <CircularChannel
          diameter={diameter}
          flowDepth={flowDepth}
          scale={scale}
          xOffset={xOffset}
          yOffset={yOffset}
          lengthUnit={lengthUnit}
        />
      )}
    </svg>
  );
}

// Rectangular Channel Component
function RectangularChannel({ bottomWidth, flowDepth, totalDepth, scale, xOffset, yOffset, lengthUnit }: any) {
  const scaledWidth = bottomWidth * scale;
  const scaledFlowDepth = flowDepth * scale;
  const scaledTotalDepth = totalDepth * scale;
  const freeboard = totalDepth - flowDepth;

  const channelPath = `M ${xOffset} ${yOffset} L ${xOffset + scaledWidth} ${yOffset} L ${xOffset + scaledWidth} ${yOffset + scaledTotalDepth} L ${xOffset} ${yOffset + scaledTotalDepth} Z`;
  const waterPath = `M ${xOffset} ${yOffset + scaledTotalDepth - scaledFlowDepth} L ${xOffset + scaledWidth} ${yOffset + scaledTotalDepth - scaledFlowDepth} L ${xOffset + scaledWidth} ${yOffset + scaledTotalDepth} L ${xOffset} ${yOffset + scaledTotalDepth} Z`;

  return (
    <g>
      {/* Channel outline */}
      <path d={channelPath} stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="hsl(var(--card))" />
      
      {/* Water */}
      <path d={waterPath} fill="hsl(var(--primary)/0.5)" stroke="hsl(var(--primary))" strokeWidth="1" />
      
      {/* Dimensions */}
      <DimensionLabels
        bottomWidth={bottomWidth}
        flowDepth={flowDepth}
        freeboard={freeboard}
        totalDepth={totalDepth}
        topWidth={bottomWidth}
        xOffset={xOffset}
        yOffset={yOffset}
        scaledWidth={scaledWidth}
        scaledTotalDepth={scaledTotalDepth}
        scaledFlowDepth={scaledFlowDepth}
        lengthUnit={lengthUnit}
      />
    </g>
  );
}

// Trapezoidal Channel Component
function TrapezoidalChannel({ bottomWidth, sideSlope, flowDepth, totalDepth, scale, xOffset, yOffset, lengthUnit }: any) {
  const scaledBottomWidth = bottomWidth * scale;
  const scaledFlowDepth = flowDepth * scale;
  const scaledTotalDepth = totalDepth * scale;
  const freeboard = totalDepth - flowDepth;

  const totalTopWidth = bottomWidth + 2 * sideSlope * totalDepth;
  const flowTopWidth = bottomWidth + 2 * sideSlope * flowDepth;
  
  const scaledTotalTopWidth = totalTopWidth * scale;
  const scaledFlowTopWidth = flowTopWidth * scale;

  const totalSideOffset = sideSlope * totalDepth * scale;
  const flowSideOffset = sideSlope * flowDepth * scale;

  const channelPoints = [
    { x: xOffset, y: yOffset },
    { x: xOffset + scaledTotalTopWidth, y: yOffset },
    { x: xOffset + scaledTotalTopWidth - totalSideOffset, y: yOffset + scaledTotalDepth },
    { x: xOffset + totalSideOffset, y: yOffset + scaledTotalDepth }
  ];

  const waterPoints = [
    { x: xOffset + totalSideOffset - flowSideOffset, y: yOffset + scaledTotalDepth - scaledFlowDepth },
    { x: xOffset + scaledTotalTopWidth - (totalSideOffset - flowSideOffset), y: yOffset + scaledTotalDepth - scaledFlowDepth },
    { x: xOffset + scaledTotalTopWidth - totalSideOffset, y: yOffset + scaledTotalDepth },
    { x: xOffset + totalSideOffset, y: yOffset + scaledTotalDepth }
  ];

  const channelPath = `M ${channelPoints[0].x},${channelPoints[0].y} L ${channelPoints[1].x},${channelPoints[1].y} L ${channelPoints[2].x},${channelPoints[2].y} L ${channelPoints[3].x},${channelPoints[3].y} Z`;
  const waterPath = `M ${waterPoints[0].x},${waterPoints[0].y} L ${waterPoints[1].x},${waterPoints[1].y} L ${waterPoints[2].x},${waterPoints[2].y} L ${waterPoints[3].x},${waterPoints[3].y} Z`;

  return (
    <g>
      {/* Channel outline */}
      <path d={channelPath} stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="hsl(var(--card))" />
      
      {/* Water */}
      <path d={waterPath} fill="hsl(var(--primary)/0.5)" stroke="hsl(var(--primary))" strokeWidth="1" />
      
      {/* Dimensions */}
      <DimensionLabels
        bottomWidth={bottomWidth}
        flowDepth={flowDepth}
        freeboard={freeboard}
        totalDepth={totalDepth}
        topWidth={totalTopWidth}
        xOffset={xOffset}
        yOffset={yOffset}
        scaledWidth={scaledTotalTopWidth}
        scaledTotalDepth={scaledTotalDepth}
        scaledFlowDepth={scaledFlowDepth}
        lengthUnit={lengthUnit}
        sideSlope={sideSlope}
      />
    </g>
  );
}

// Triangular Channel Component
function TriangularChannel({ sideSlope, flowDepth, totalDepth, scale, xOffset, yOffset, lengthUnit }: any) {
  const scaledFlowDepth = flowDepth * scale;
  const scaledTotalDepth = totalDepth * scale;
  const freeboard = totalDepth - flowDepth;

  const totalTopWidth = 2 * sideSlope * totalDepth;
  const flowTopWidth = 2 * sideSlope * flowDepth;
  
  const scaledTotalTopWidth = totalTopWidth * scale;
  const scaledFlowTopWidth = flowTopWidth * scale;

  const centerX = xOffset + scaledTotalTopWidth / 2;

  const channelPoints = [
    { x: xOffset, y: yOffset },
    { x: xOffset + scaledTotalTopWidth, y: yOffset },
    { x: centerX, y: yOffset + scaledTotalDepth }
  ];

  const waterPoints = [
    { x: centerX - scaledFlowTopWidth / 2, y: yOffset + scaledTotalDepth - scaledFlowDepth },
    { x: centerX + scaledFlowTopWidth / 2, y: yOffset + scaledTotalDepth - scaledFlowDepth },
    { x: centerX, y: yOffset + scaledTotalDepth }
  ];

  const channelPath = `M ${channelPoints[0].x},${channelPoints[0].y} L ${channelPoints[1].x},${channelPoints[1].y} L ${channelPoints[2].x},${channelPoints[2].y} Z`;
  const waterPath = `M ${waterPoints[0].x},${waterPoints[0].y} L ${waterPoints[1].x},${waterPoints[1].y} L ${waterPoints[2].x},${waterPoints[2].y} Z`;

  return (
    <g>
      {/* Channel outline */}
      <path d={channelPath} stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="hsl(var(--card))" />
      
      {/* Water */}
      <path d={waterPath} fill="hsl(var(--primary)/0.5)" stroke="hsl(var(--primary))" strokeWidth="1" />
      
      {/* Dimensions */}
      <DimensionLabels
        bottomWidth={0}
        flowDepth={flowDepth}
        freeboard={freeboard}
        totalDepth={totalDepth}
        topWidth={totalTopWidth}
        xOffset={xOffset}
        yOffset={yOffset}
        scaledWidth={scaledTotalTopWidth}
        scaledTotalDepth={scaledTotalDepth}
        scaledFlowDepth={scaledFlowDepth}
        lengthUnit={lengthUnit}
        isTriangular={true}
      />
    </g>
  );
}

// Circular Channel Component
function CircularChannel({ diameter, flowDepth, scale, xOffset, yOffset, lengthUnit }: any) {
  const radius = diameter / 2;
  const scaledRadius = radius * scale;
  const scaledFlowDepth = flowDepth * scale;
  
  const centerX = xOffset + scaledRadius;
  const centerY = yOffset + scaledRadius;
  
  // Calculate water surface geometry
  const h = flowDepth;
  const R = radius;
  
  if (h >= diameter) {
    // Pipe is full
    return (
      <g>
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={scaledRadius} 
          stroke="hsl(var(--muted-foreground))" 
          strokeWidth="2" 
          fill="hsl(var(--primary)/0.5)" 
        />
        <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" className="text-sm fill-current">
          Full Pipe Flow
        </text>
      </g>
    );
  }

  // Partially filled pipe
  const theta = 2 * Math.acos((R - h) / R);
  const waterSurfaceY = centerY + scaledRadius - scaledFlowDepth;
  const waterWidth = 2 * Math.sqrt(scaledFlowDepth * (2 * scaledRadius - scaledFlowDepth));

  // Create water area path
  const startAngle = Math.PI - theta / 2;
  const endAngle = Math.PI + theta / 2;
  
  let waterPath = `M ${centerX + scaledRadius * Math.cos(startAngle)} ${centerY + scaledRadius * Math.sin(startAngle)}`;
  
  // Arc along the pipe bottom
  for (let angle = startAngle; angle <= endAngle; angle += 0.1) {
    waterPath += ` L ${centerX + scaledRadius * Math.cos(angle)} ${centerY + scaledRadius * Math.sin(angle)}`;
  }
  
  waterPath += ` L ${centerX + scaledRadius * Math.cos(endAngle)} ${centerY + scaledRadius * Math.sin(endAngle)}`;
  waterPath += ` L ${centerX - waterWidth/2} ${waterSurfaceY}`;
  waterPath += ` Z`;

  return (
    <g>
      {/* Pipe outline */}
      <circle 
        cx={centerX} 
        cy={centerY} 
        r={scaledRadius} 
        stroke="hsl(var(--muted-foreground))" 
        strokeWidth="2" 
        fill="hsl(var(--card))" 
      />
      
      {/* Water */}
      <path d={waterPath} fill="hsl(var(--primary)/0.5)" stroke="hsl(var(--primary))" strokeWidth="1" />
      
      {/* Water surface line */}
      <line 
        x1={centerX - waterWidth/2} 
        y1={waterSurfaceY} 
        x2={centerX + waterWidth/2} 
        y2={waterSurfaceY} 
        stroke="hsl(var(--primary))" 
        strokeWidth="2" 
      />
      
      {/* Dimension labels */}
      <text x={centerX} y={yOffset - 10} textAnchor="middle" className="text-xs fill-muted-foreground">
        Diameter: {diameter.toFixed(2)} {lengthUnit}
      </text>
      <text x={centerX + scaledRadius + 20} y={waterSurfaceY} className="text-xs fill-muted-foreground">
        Flow Depth: {flowDepth.toFixed(2)} {lengthUnit}
      </text>
    </g>
  );
}

// Dimension Labels Component
function DimensionLabels({ 
  bottomWidth, 
  flowDepth, 
  freeboard, 
  totalDepth, 
  topWidth, 
  xOffset, 
  yOffset, 
  scaledWidth, 
  scaledTotalDepth, 
  scaledFlowDepth, 
  lengthUnit,
  sideSlope,
  isTriangular = false 
}: any) {
  const textStyle = { fontSize: '12px' };
  
  return (
    <g className="text-muted-foreground">
      {/* Total Depth */}
      <line x1={xOffset - 15} y1={yOffset} x2={xOffset - 15} y2={yOffset + scaledTotalDepth} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1={xOffset - 17} y1={yOffset} x2={xOffset - 13} y2={yOffset} stroke="currentColor" strokeWidth="0.5" />
      <line x1={xOffset - 17} y1={yOffset + scaledTotalDepth} x2={xOffset - 13} y2={yOffset + scaledTotalDepth} stroke="currentColor" strokeWidth="0.5" />
      <text 
        x={xOffset - 20} 
        y={yOffset + scaledTotalDepth / 2} 
        transform={`rotate(-90, ${xOffset - 20}, ${yOffset + scaledTotalDepth/2})`} 
        textAnchor="middle" 
        dominantBaseline="middle" 
        style={textStyle}
      >
        Total: {totalDepth.toFixed(2)} {lengthUnit}
      </text>
      
      {/* Flow Depth & Freeboard */}
      <line x1={xOffset + scaledWidth + 15} y1={yOffset} x2={xOffset + scaledWidth + 15} y2={yOffset + scaledTotalDepth} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <text 
        x={xOffset + scaledWidth + 20} 
        y={yOffset + scaledTotalDepth - scaledFlowDepth/2} 
        transform={`rotate(-90, ${xOffset + scaledWidth + 20}, ${yOffset + scaledTotalDepth - scaledFlowDepth/2})`} 
        textAnchor="middle" 
        dominantBaseline="middle" 
        style={textStyle}
      >
        Flow: {flowDepth.toFixed(2)} {lengthUnit}
      </text>
      <text 
        x={xOffset + scaledWidth + 20} 
        y={yOffset + (scaledTotalDepth - scaledFlowDepth)/2} 
        transform={`rotate(-90, ${xOffset + scaledWidth + 20}, ${yOffset + (scaledTotalDepth - scaledFlowDepth)/2})`} 
        textAnchor="middle" 
        dominantBaseline="middle" 
        style={textStyle}
      >
        Freeboard: {freeboard.toFixed(2)} {lengthUnit}
      </text>
      
      {/* Top Width */}
      <line x1={xOffset} y1={yOffset - 15} x2={xOffset + scaledWidth} y2={yOffset - 15} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <text x={xOffset + scaledWidth/2} y={yOffset - 20} textAnchor="middle" style={textStyle}>
        Top Width: {topWidth.toFixed(2)} {lengthUnit}
      </text>
      
      {/* Bottom Width (if not triangular) */}
      {!isTriangular && bottomWidth > 0 && (
        <>
          <line x1={xOffset + (scaledWidth - bottomWidth * (scaledWidth/topWidth))/2} y1={yOffset + scaledTotalDepth + 15} x2={xOffset + scaledWidth - (scaledWidth - bottomWidth * (scaledWidth/topWidth))/2} y2={yOffset + scaledTotalDepth + 15} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
          <text x={xOffset + scaledWidth/2} y={yOffset + scaledTotalDepth + 20} textAnchor="middle" dominantBaseline="hanging" style={textStyle}>
            Bottom: {bottomWidth.toFixed(2)} {lengthUnit}
          </text>
        </>
      )}
      
      {/* Side Slope (if applicable) */}
      {sideSlope && sideSlope > 0 && (
        <text x={xOffset + scaledWidth/2} y={yOffset + scaledTotalDepth + 35} textAnchor="middle" dominantBaseline="hanging" style={textStyle}>
          Side Slope: {sideSlope.toFixed(1)}:1 (H:V)
        </text>
      )}
    </g>
  );
}