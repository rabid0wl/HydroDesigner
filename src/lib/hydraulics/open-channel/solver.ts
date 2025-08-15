import { SolverResult } from './types';

/**
 * Numerical methods for solving hydraulic equations
 */

export interface SolverOptions {
  tolerance?: number;
  maxIterations?: number;
  initialGuess?: number;
  bracket?: { lower: number; upper: number };
}

/**
 * Brent's method for root finding - more robust than bisection
 */
export function solveUsingBrent(
  func: (x: number) => number,
  options: SolverOptions = {}
): SolverResult {
  const {
    tolerance = 1e-6,
    maxIterations = 100,
    bracket = { lower: 0.0001, upper: 50.0 }
  } = options;

  let a = bracket.lower;
  let b = bracket.upper;
  let c = b;
  
  let fa = func(a);
  let fb = func(b);
  let fc = fb;

  // Check if we have a bracket
  if (fa * fb > 0) {
    return {
      value: 0,
      converged: false,
      iterations: 0,
      residual: Math.abs(fa),
      error: 'No root found in bracket. Function values have the same sign at bracket endpoints.'
    };
  }

  // Check if we already have a root
  if (Math.abs(fa) < tolerance) {
    return { value: a, converged: true, iterations: 0, residual: Math.abs(fa) };
  }
  if (Math.abs(fb) < tolerance) {
    return { value: b, converged: true, iterations: 0, residual: Math.abs(fb) };
  }

  let mflag = true;
  let s = 0;
  let d = 0;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (Math.abs(fa) < Math.abs(fb)) {
      [a, b] = [b, a];
      [fa, fb] = [fb, fa];
    }

    if (Math.abs(fb) < tolerance) {
      return {
        value: b,
        converged: true,
        iterations: iteration + 1,
        residual: Math.abs(fb)
      };
    }

    if (Math.abs(a - b) < tolerance) {
      return {
        value: b,
        converged: true,
        iterations: iteration + 1,
        residual: Math.abs(fb)
      };
    }

    if (Math.abs(fa - fc) > tolerance && Math.abs(fb - fc) > tolerance) {
      // Inverse quadratic interpolation
      s = (a * fb * fc) / ((fa - fb) * (fa - fc)) +
          (b * fa * fc) / ((fb - fa) * (fb - fc)) +
          (c * fa * fb) / ((fc - fa) * (fc - fb));
    } else {
      // Secant method
      s = b - fb * (b - a) / (fb - fa);
    }

    const condition1 = s < (3 * a + b) / 4 || s > b;
    const condition2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2;
    const condition3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2;
    const condition4 = mflag && Math.abs(b - c) < tolerance;
    const condition5 = !mflag && Math.abs(c - d) < tolerance;

    if (condition1 || condition2 || condition3 || condition4 || condition5) {
      s = (a + b) / 2;
      mflag = true;
    } else {
      mflag = false;
    }

    const fs = func(s);
    d = c;
    c = b;
    fc = fb;

    if (fa * fs < 0) {
      b = s;
      fb = fs;
    } else {
      a = s;
      fa = fs;
    }
  }

  return {
    value: b,
    converged: false,
    iterations: maxIterations,
    residual: Math.abs(fb),
    error: 'Maximum iterations reached without convergence'
  };
}

/**
 * Newton-Raphson method with numerical derivative
 */
export function solveUsingNewtonRaphson(
  func: (x: number) => number,
  options: SolverOptions = {}
): SolverResult {
  const {
    tolerance = 1e-6,
    maxIterations = 50,
    initialGuess = 1.0
  } = options;

  let x = initialGuess;
  const h = 1e-8; // Step size for numerical derivative

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const fx = func(x);
    
    if (Math.abs(fx) < tolerance) {
      return {
        value: x,
        converged: true,
        iterations: iteration + 1,
        residual: Math.abs(fx)
      };
    }

    // Numerical derivative: f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
    const fxh = func(x + h);
    const fxmh = func(x - h);
    const dfx = (fxh - fxmh) / (2 * h);

    if (Math.abs(dfx) < 1e-12) {
      return {
        value: x,
        converged: false,
        iterations: iteration + 1,
        residual: Math.abs(fx),
        error: 'Derivative too small, cannot continue'
      };
    }

    const xNew = x - fx / dfx;
    
    // Check for convergence
    if (Math.abs(xNew - x) < tolerance) {
      return {
        value: xNew,
        converged: true,
        iterations: iteration + 1,
        residual: Math.abs(func(xNew))
      };
    }

    x = xNew;

    // Prevent negative depths
    if (x < 0) {
      x = Math.abs(x) * 0.1;
    }
  }

  return {
    value: x,
    converged: false,
    iterations: maxIterations,
    residual: Math.abs(func(x)),
    error: 'Maximum iterations reached without convergence'
  };
}

/**
 * Hybrid solver that tries multiple methods for robustness
 */
export function solveRobust(
  func: (x: number) => number,
  options: SolverOptions = {}
): SolverResult {
  // First try Brent's method (most robust)
  let result = solveUsingBrent(func, options);
  
  if (result.converged) {
    return result;
  }

  // If Brent's method fails, try Newton-Raphson with a good initial guess
  const initialGuess = options.bracket ? 
    (options.bracket.lower + options.bracket.upper) / 2 : 
    options.initialGuess || 1.0;

  result = solveUsingNewtonRaphson(func, { 
    ...options, 
    initialGuess 
  });

  if (result.converged) {
    return result;
  }

  // If both methods fail, return the better result
  const brentResult = solveUsingBrent(func, options);
  const newtonResult = result;

  if (brentResult.residual < newtonResult.residual) {
    return { ...brentResult, error: 'Convergence failed, returning best Brent result' };
  } else {
    return { ...newtonResult, error: 'Convergence failed, returning best Newton-Raphson result' };
  }
}

/**
 * Find optimal bracket for root finding
 */
export function findBracket(
  func: (x: number) => number,
  initialGuess: number = 1.0,
  factor: number = 2.0,
  maxAttempts: number = 20
): { lower: number; upper: number } | null {
  let lower = initialGuess;
  let upper = initialGuess;
  
  let fLower = func(lower);
  let fUpper = func(upper);

  // Expand the bracket until we find a sign change
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (fLower * fUpper < 0) {
      return { lower, upper };
    }

    // Expand bracket
    if (Math.abs(fLower) < Math.abs(fUpper)) {
      lower /= factor;
      fLower = func(lower);
    } else {
      upper *= factor;
      fUpper = func(upper);
    }
    
    // Prevent infinite values
    if (!isFinite(fLower) || !isFinite(fUpper)) {
      break;
    }
  }

  return null;
}