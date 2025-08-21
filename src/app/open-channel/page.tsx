"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useProjectData } from "@/context/ProjectDataContext";
import { Form } from "./Form";
import { ChannelInputs, HydraulicResults } from "@/lib/hydraulics/open-channel/types";
import { calculateChannelHydraulics } from "./calc";
import { generateOptimizedRatingCurve } from "@/lib/hydraulics/open-channel/rating-curve";

// Dynamically import heavy components
import dynamic from 'next/dynamic';

const Result = dynamic(() => import('./Result').then(mod => mod.Result), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading results...</div>
});

const ChannelVisualization = dynamic(() => import('@/components/open-channel-design/visualization').then(mod => mod.ChannelVisualization), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading visualization...</div>
});

interface OpenChannelDesignProps {
  searchParams: { units?: 'metric' | 'imperial' };
}

export default function OpenChannelDesignPage({ searchParams }: OpenChannelDesignProps) {
  const units = searchParams?.units === 'metric' ? 'metric' : 'imperial';
  const { setChannelRatingCurve } = useProjectData();
  const [results, setResults] = useState<HydraulicResults | null>(null);
  const [currentInputs, setCurrentInputs] = useState<ChannelInputs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleCalculate = async (inputs: ChannelInputs) => {
    setLoading(true);
    setError(null);
    setWarnings([]);
    setResults(null);

    try {
      // Calculate hydraulic results
      const calculationResult = calculateChannelHydraulics(inputs);
      
      if (!calculationResult.success) {
        if (calculationResult.errors) {
          setError(calculationResult.errors[0]?.message || 'Calculation failed');
        }
        return;
      }

      const hydraulicResults = calculationResult.data!;
      
      // Set warnings if any
      if (calculationResult.warnings && calculationResult.warnings.length > 0) {
        setWarnings(calculationResult.warnings);
      }

      // Generate rating curve in the background
      try {
        const ratingCurveResult = generateOptimizedRatingCurve(inputs, 25);
        if (ratingCurveResult.success && ratingCurveResult.data) {
          setChannelRatingCurve(ratingCurveResult.data);
          
          if (ratingCurveResult.warnings && ratingCurveResult.warnings.length > 0) {
            setWarnings(prev => [...prev, ...ratingCurveResult.warnings!]);
          }
        }
      } catch (ratingError) {
        console.warn('Rating curve generation failed:', ratingError);
        setWarnings(prev => [...prev, 'Rating curve generation failed - basic curve will be used']);
      }

      setResults(hydraulicResults);
      setCurrentInputs(inputs);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown calculation error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Open Channel Flow Design</h1>
          <p className="text-muted-foreground">
            Calculate hydraulic properties for open channel flow
          </p>
        </div>

        {/* Input Form */}
        <Form 
          units={units} 
          onCalculate={handleCalculate}
          loading={loading}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Calculation Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Warnings Display */}
        {warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {results && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Results take up 2 columns on xl screens */}
            <div className="xl:col-span-2">
              <Result results={results} units={units} />
            </div>
            
            {/* Visualization takes up 1 column on xl screens */}
            <div className="xl:col-span-1">
              {currentInputs && (
                <ChannelVisualization
                  results={results}
                  geometry={currentInputs.geometry}
                  units={units}
                />
              )}
            </div>
          </div>
        )}

        {/* Help Text when no results */}
        {!results && !loading && !error && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Open Channel Flow Design</p>
            <p className="text-sm">
              Enter your channel parameters above and click "Calculate Channel Design" to begin.
            </p>
            <div className="mt-4 text-xs space-y-1">
              <p>• Supports rectangular, trapezoidal, triangular, and circular channels</p>
              <p>• Calculates normal depth, critical depth, and flow characteristics</p>
              <p>• Includes freeboard calculations and design recommendations</p>
              <p>• Generates rating curves for flow analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}