import { envSchema, validateEnv } from "./env";

describe('Environment Variables Validation', () => {
  it('should validate correct environment variables', () => {
    // Mock process.env
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENV: 'development',
    };

    // Validate environment variables
    const env = validateEnv();

    expect(env.NEXT_PUBLIC_ENV).toBe('development');
    
    // Restore original process.env
    process.env = originalEnv;
  });

  it('should fail validation when NEXT_PUBLIC_ENV is missing', () => {
    // Mock process.env
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      // NEXT_PUBLIC_ENV is intentionally missing
    };

    // Validate environment variables and expect error
    expect(() => validateEnv()).toThrow("Invalid environment variables");
    
    // Restore original process.env
    process.env = originalEnv;
  });

  it('should fail validation when NEXT_PUBLIC_ENV is invalid', () => {
    // Mock process.env
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENV: 'invalid',
    };

    // Validate environment variables and expect error
    expect(() => validateEnv()).toThrow("Invalid environment variables");
    
    // Restore original process.env
    process.env = originalEnv;
  });
});