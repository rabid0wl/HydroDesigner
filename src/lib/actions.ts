'use server';

import {
  designRecommendation,
  type DesignRecommendationInput,
  type DesignRecommendationOutput,
} from '@/ai/flows/design-recommendation';
import { z } from 'zod';

const DesignRecommendationInputSchema = z.object({
  projectType: z.string().min(1, 'Project type is required.'),
  location: z.string().min(1, 'Location is required.'),
  historicalData: z.string().min(1, 'Historical data is required.'),
  designRequirements: z.string().min(1, 'Design requirements are required.'),
});

export async function getDesignRecommendationAction(
  input: DesignRecommendationInput
): Promise<{ data: DesignRecommendationOutput | null; error: string | null }> {
  const validatedInput = DesignRecommendationInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return { data: null, error: validatedInput.error.errors.map((e) => e.message).join(', ') };
  }

  try {
    const result = await designRecommendation(validatedInput.data);
    // Add a small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { data: result, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred.';
    console.error(error);
    return { data: null, error: 'Failed to get design recommendation. Please try again.' };
  }
}
