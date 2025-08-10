"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertTriangle, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DesignRecommendationOutput } from "@/ai/flows/design-recommendation";
import { getDesignRecommendationAction } from "@/lib/actions";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  projectType: z.string().min(3, "Project type must be at least 3 characters."),
  location: z.string().min(2, "Location must be at least 2 characters."),
  historicalData: z.string().min(10, "Historical data must be at least 10 characters."),
  designRequirements: z.string().min(10, "Design requirements must be at least 10 characters."),
});

type FormData = z.infer<typeof formSchema>;

export function AiDesignAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DesignRecommendationOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectType: "",
      location: "",
      historicalData: "",
      designRequirements: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setResult(null);
    const { data: recommendation, error } = await getDesignRecommendationAction(data);
    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    } else if (recommendation) {
      setResult(recommendation);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>AI Design Assistant</CardTitle>
          <CardDescription>
            Provide project details to receive AI-powered design recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Roadway Drainage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Coastal Florida" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="historicalData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Historical Data</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe past projects, soil conditions, rainfall intensity..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="designRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Design Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Specify load capacity, safety standards, 25-year storm event..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Recommendations
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {isLoading && (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Analyzing data and generating insights...</p>
                <p className="text-sm text-muted-foreground">This may take a moment.</p>
            </CardContent>
          </Card>
        )}
        {result && (
          <>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="text-primary" />
                      AI Recommendations
                    </CardTitle>
                    <CardDescription>
                      Design suggestions based on the provided data.
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg flex items-center gap-1">
                      <Percent size={18} /> {(result.confidenceLevel * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                 <Progress value={result.confidenceLevel * 100} className="mb-4 h-2" />
                <p className="text-foreground whitespace-pre-wrap">{result.recommendations}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-destructive" />
                  Potential Issues & Considerations
                </CardTitle>
                <CardDescription>
                  Key factors to consider during the design phase.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{result.potentialIssues}</p>
              </CardContent>
            </Card>
          </>
        )}
        {!isLoading && !result && (
             <Card className="border-dashed">
                <CardContent className="p-6 flex flex-col items-center justify-center h-96">
                    <div className="bg-secondary p-4 rounded-full mb-4">
                        <BrainCircuit className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">Your design insights will appear here.</p>
                    <p className="text-sm text-center text-muted-foreground mt-1">Fill out the form to get started with your AI-powered design analysis.</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
