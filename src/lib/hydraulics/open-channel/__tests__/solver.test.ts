import {
  solveUsingBrent,
  solveUsingNewtonRaphson,
  solveRobust,
  findBracket
} from '../solver';

describe('Numerical Solver Functions', () => {
  // Simple test function: f(x) = x² - 4, root at x = 2
  const quadraticFunction = (x: number) => x * x - 4;
  
  // More complex test function: f(x) = x³ - 6x² + 11x - 6, roots at x = 1, 2, 3
  const cubicFunction = (x: number) => x * x * x - 6 * x * x + 11 * x - 6;

  describe('Brent\'s Method', () => {
    it('should find root of quadratic function', () => {
      const result = solveUsingBrent(quadraticFunction, {
        bracket: { lower: 0, upper: 5 },
        tolerance: 1e-6
      });

      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(2, 6);
      expect(result.residual).toBeLessThan(1e-6);
    });

    it('should find root of cubic function', () => {
      const result = solveUsingBrent(cubicFunction, {
        bracket: { lower: 0.5, upper: 1.5 },
        tolerance: 1e-8
      });

      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(1, 6);
      expect(result.residual).toBeLessThan(1e-8);
    });

    it('should handle case with no root in bracket', () => {
      const result = solveUsingBrent(quadraticFunction, {
        bracket: { lower: -1, upper: -0.1 },
        tolerance: 1e-6
      });

      expect(result.converged).toBe(false);
      expect(result.error).toContain('No root found in bracket');
    });

    it('should handle case where root is at bracket endpoint', () => {
      const result = solveUsingBrent(quadraticFunction, {
        bracket: { lower: 2, upper: 3 },
        tolerance: 1e-6
      });

      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(2, 6);
      expect(result.iterations).toBe(0);
    });
  });

  describe('Newton-Raphson Method', () => {
    it('should find root of quadratic function', () => {
      const result = solveUsingNewtonRaphson(quadraticFunction, {
        initialGuess: 3,
        tolerance: 1e-6
      });

      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(2, 6);
      expect(result.residual).toBeLessThan(1e-6);
    });

    it('should find root of cubic function', () => {
      const result = solveUsingNewtonRaphson(cubicFunction, {
        initialGuess: 0.8,
        tolerance: 1e-8
      });

      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(1, 6);
      expect(result.iterations).toBeLessThan(10);
    });

    it('should converge faster than bisection for smooth functions', () => {
      const newtonResult = solveUsingNewtonRaphson(quadraticFunction, {
        initialGuess: 3,
        tolerance: 1e-10
      });

      const brentResult = solveUsingBrent(quadraticFunction, {
        bracket: { lower: 1, upper: 3 },
        tolerance: 1e-10
      });

      expect(newtonResult.converged).toBe(true);
      expect(brentResult.converged).toBe(true);
      expect(newtonResult.iterations).toBeLessThan(brentResult.iterations);
    });

    it('should handle poor initial guess', () => {
      const result = solveUsingNewtonRaphson(quadraticFunction, {
        initialGuess: 100,
        tolerance: 1e-6
      });

      // Newton-Raphson should still converge even with poor initial guess
      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(2, 6);
    });
  });

  describe('Robust Solver (Hybrid)', () => {
    it('should find root using best available method', () => {
      const result = solveRobust(quadraticFunction, {
        bracket: { lower: 0, upper: 5 },
        tolerance: 1e-8
      });

      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(2, 6);
      expect(result.residual).toBeLessThan(1e-8);
    });

    it('should handle difficult functions', () => {
      // Function with steep gradient near root
      const steepFunction = (x: number) => Math.tanh(10 * (x - 1));
      
      const result = solveRobust(steepFunction, {
        bracket: { lower: 0, upper: 2 },
        tolerance: 1e-6
      });

      expect(result.converged).toBe(true);
      expect(result.value).toBeCloseTo(1, 4);
    });

    it('should provide fallback when no method converges easily', () => {
      // Discontinuous function that might be challenging
      const challengingFunction = (x: number) => {
        if (x < 1.5) return x - 2;
        return x - 1;
      };

      const result = solveRobust(challengingFunction, {
        bracket: { lower: 0, upper: 3 },
        tolerance: 1e-6
      });

      // Should find one of the roots (x = 1 or x = 2)
      expect(result.value).toBeGreaterThan(0.5);
      expect(result.value).toBeLessThan(2.5);
    });
  });

  describe('Bracket Finding', () => {
    it('should find valid bracket for function with root', () => {
      const bracket = findBracket(quadraticFunction, 1);

      expect(bracket).not.toBeNull();
      if (bracket) {
        const fLower = quadraticFunction(bracket.lower);
        const fUpper = quadraticFunction(bracket.upper);
        expect(fLower * fUpper).toBeLessThan(0); // Different signs
      }
    });

    it('should find bracket starting from different initial guesses', () => {
      const bracket1 = findBracket(quadraticFunction, 0.1);
      const bracket2 = findBracket(quadraticFunction, 5);

      expect(bracket1).not.toBeNull();
      expect(bracket2).not.toBeNull();
      
      if (bracket1 && bracket2) {
        // Both should bracket a root (x = 2 in this case)
        expect(bracket1.lower).toBeLessThan(2);
        expect(bracket1.upper).toBeGreaterThan(2);
        expect(bracket2.lower).toBeLessThan(2);
        expect(bracket2.upper).toBeGreaterThan(2);
      }
    });

    it('should handle functions with no roots', () => {
      const noRootFunction = (x: number) => x * x + 1; // Always positive
      
      const bracket = findBracket(noRootFunction, 0);
      
      expect(bracket).toBeNull();
    });

    it('should handle functions that grow too quickly', () => {
      const explosiveFunction = (x: number) => Math.exp(10 * Math.abs(x));
      
      const bracket = findBracket(explosiveFunction, 0.1);
      
      // Should handle gracefully even if function grows very large
      expect(bracket).toBeNull();
    });
  });

  describe('Performance and Convergence', () => {
    it('should converge within reasonable iteration count', () => {
      const result = solveUsingBrent(quadraticFunction, {
        bracket: { lower: 0, upper: 5 },
        tolerance: 1e-12,
        maxIterations: 100
      });

      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThan(50);
    });

    it('should respect maximum iteration limit', () => {
      const result = solveUsingBrent(quadraticFunction, {
        bracket: { lower: 0, upper: 5 },
        tolerance: 1e-15, // Very tight tolerance
        maxIterations: 5 // Very few iterations
      });

      expect(result.iterations).toBeLessThanOrEqual(5);
      if (!result.converged) {
        expect(result.error).toContain('Maximum iterations');
      }
    });

    it('should handle tolerance requirements appropriately', () => {
      const looseTolerance = solveUsingBrent(quadraticFunction, {
        bracket: { lower: 0, upper: 5 },
        tolerance: 1e-3
      });

      const tightTolerance = solveUsingBrent(quadraticFunction, {
        bracket: { lower: 0, upper: 5 },
        tolerance: 1e-10
      });

      expect(looseTolerance.converged).toBe(true);
      expect(tightTolerance.converged).toBe(true);
      expect(looseTolerance.iterations).toBeLessThan(tightTolerance.iterations);
      expect(tightTolerance.residual).toBeLessThan(looseTolerance.residual);
    });
  });

  describe('Manning\'s Equation Application', () => {
    it('should solve Manning\'s equation for typical channel', () => {
      // Manning's equation: Q = (1/n) * A * R^(2/3) * S^(1/2)
      // For rectangular channel: A = b*y, R = (b*y)/(b+2*y)
      const Q = 10; // m³/s
      const b = 5;  // m
      const S = 0.001;
      const n = 0.025;
      
      const manningFunction = (y: number) => {
        if (y <= 0) return -Q;
        const A = b * y;
        const P = b + 2 * y;
        const R = A / P;
        return (A * Math.pow(R, 2/3) * Math.pow(S, 0.5)) / n - Q;
      };

      const result = solveRobust(manningFunction, {
        bracket: { lower: 0.1, upper: 10 },
        tolerance: 1e-6
      });

      expect(result.converged).toBe(true);
      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeLessThan(5); // Reasonable depth
      
      // Verify the solution satisfies Manning's equation
      const depth = result.value;
      const area = b * depth;
      const perimeter = b + 2 * depth;
      const hydraulicRadius = area / perimeter;
      const calculatedQ = (area * Math.pow(hydraulicRadius, 2/3) * Math.pow(S, 0.5)) / n;
      
      expect(calculatedQ).toBeCloseTo(Q, 4);
    });
  });
});