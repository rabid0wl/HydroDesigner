'use server';

/**
 * @fileOverview Provides AI-powered design recommendations for civil engineering projects.
 *
 * - designRecommendation - A function that generates design recommendations based on project data.
 * - DesignRecommendationInput - The input type for the designRecommendation function.
 * - DesignRecommendationOutput - The return type for the designRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DesignRecommendationInputSchema = z.object({
  projectType: z.string().describe('The type of civil engineering project (e.g., road, bridge, water treatment plant).'),
  location: z.string().describe('The geographical location of the project.'),
  historicalData: z.string().describe('Historical project data, including past designs, performance metrics, and environmental conditions.'),
  designRequirements: z.string().describe('Specific design requirements for the project (e.g., load capacity, flow rate, safety standards).'),
});
export type DesignRecommendationInput = z.infer<typeof DesignRecommendationInputSchema>;

const DesignRecommendationOutputSchema = z.object({
  recommendations: z.string().describe('AI-powered design recommendations based on historical data and project requirements.'),
  confidenceLevel: z.number().describe('The confidence level of the recommendations (0-1).'),
  potentialIssues: z.string().describe('Potential issues and considerations for the design.'),
});
export type DesignRecommendationOutput = z.infer<typeof DesignRecommendationOutputSchema>;

export async function designRecommendation(input: DesignRecommendationInput): Promise<DesignRecommendationOutput> {
  return designRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'designRecommendationPrompt',
  input: {schema: DesignRecommendationInputSchema},
  output: {schema: DesignRecommendationOutputSchema},
  prompt: `You are an AI assistant for civil engineers, specializing in providing design recommendations based on historical project data.

  Analyze the following project details and provide design recommendations, including potential issues and a confidence level for the recommendations.

  Project Type: {{{projectType}}}
  Location: {{{location}}}
  Historical Data: {{{historicalData}}}
  Design Requirements: {{{designRequirements}}}
  `,
});

const designRecommendationFlow = ai.defineFlow(
  {
    name: 'designRecommendationFlow',
    inputSchema: DesignRecommendationInputSchema,
    outputSchema: DesignRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
