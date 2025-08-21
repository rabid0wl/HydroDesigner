"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useProjectData } from "@/context/ProjectDataContext";
import { Form } from "./Form";
import { evaluateCulvertScenarios } from "./calc";
import { CulvertParams, ScenarioResult, CulvertShape } from "@/lib/hydraulics/culvert-types";

// Dynamically import heavy Result component
import dynamic from 'next/dynamic';

const Result = dynamic(() => import('./Result').then(mod => mod.Result), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading results...</div>
});

interface CulvertDesignProps {
  searchParams: { units?: 'metric' | 'imperial' };
}

export default function CulvertDesignPage({ searchParams }: CulvertDesignProps) {
  const units = searchParams?.units === 'metric' ? 'metric' : 'imperial';
  const { setChannelRatingCurve } = useProjectData();
  const [results, setResults] = useState<{ [key in CulvertShape]?: ScenarioResult[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleCalculate = async (params: CulvertParams) => {
    setLoading(true);
    setError(null);
    setWarnings([]);
    setResults(null);

    try {
      // Evaluate culvert scenarios
      const scenarioResults = evaluateCulvertScenarios(params);
      
      setResults(scenarioResults);

      // Add any warnings from the calculation
      const allWarnings: string[] = [];
      Object.values(scenarioResults).forEach(shapeResults => {
        if (shapeResults) {
          shapeResults.forEach(result => {
            allWarnings.push(...result.warnings);
          });
        }
      });
      
      if (allWarnings.length > 0) {
        setWarnings(allWarnings);
      }

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
          <h1 className="text-3xl font-bold">Culvert Design</h1>
          <p className="text-muted-foreground">
            Evaluate multiple culvert scenarios with optimized recommendations
          </p>
        </div>

        {/* Input Form */}
        <Form 
          units={units === 'metric' ? 'metric' : 'us'}
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
          <Result results={results} params={results as any} units={units === 'metric' ? 'metric' : 'us'} />
        )}

        {/* Help Text when no results */}
        {!results && !loading && !error && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Culvert Design Analysis</p>
            <p className="text-sm">
              Enter your culvert parameters above and click "Evaluate Scenarios" to begin.
            </p>
            <div className="mt-4 text-xs space-y-1">
              <p>• Evaluates circular, box, and arch culverts</p>
              <p>• Calculates inlet and outlet control hydraulics</p>
              <p>• Provides optimization scores for engineering decisions</p>
              <p>• Includes fish passage and environmental analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}