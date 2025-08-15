"use client";

import { Suspense, lazy } from "react";
import type { Units } from "@/app/page";
import { SimpleFallback } from "./open-channel-design/simple-fallback";

interface OpenChannelDesignProps {
  units: Units;
}

// Lazy load the complex component to avoid blocking
const LazyOpenChannelDesign = lazy(() =>
  import("./open-channel-design/index").then(module => ({
    default: module.OpenChannelDesign
  })).catch(() => ({
    default: SimpleFallback
  }))
);

// Wrapper component for backward compatibility
export function OpenChannelDesign({ units }: OpenChannelDesignProps) {
  // Map legacy 'us' units to 'imperial'
  const mappedUnits = units === 'us' ? 'imperial' : units as 'metric' | 'imperial';
  
  return (
    <Suspense fallback={<SimpleFallback units={mappedUnits} />}>
      <LazyOpenChannelDesign units={mappedUnits} />
    </Suspense>
  );
}
