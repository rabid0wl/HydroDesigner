import { z } from 'zod';

// Define the schema for environment variables
export const envSchema = z.object({
  NEXT_PUBLIC_ENV: z.enum(['development', 'production', 'test'], {
    required_error: "NEXT_PUBLIC_ENV is required",
    invalid_type_error: "NEXT_PUBLIC_ENV must be 'development', 'production', or 'test'",
  }),
});

// Function to validate environment variables
export function validateEnv() {
  const env = envSchema.safeParse(process.env);

  if (!env.success) {
    console.error("❌ Invalid environment variables:");
    env.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    throw new Error("Invalid environment variables");
  }

  return env.data;
}