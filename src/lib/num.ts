export type GPM = number & { __brand: "GPM" };
export type CFS = number & { __brand: "CFS" };

/**
 * Rounds a number to a specified number of decimal places using the exponent trick
 * @param x The number to round
 * @param places The number of decimal places (default: 4)
 * @returns The rounded number
 */
export function round(x: number, places = 4): number {
  const factor = 10 ** places;
  return Math.round(x * factor) / factor;
}

/**
 * Converts gallons per minute (GPM) to cubic feet per second (CFS)
 * @param gpm The flow rate in gallons per minute
 * @returns The flow rate in cubic feet per second
 */
export function gpmToCfs(gpm: number): CFS {
  return (gpm / 448.831) as CFS;
}

/**
 * Converts cubic feet per second (CFS) to gallons per minute (GPM)
 * @param cfs The flow rate in cubic feet per second
 * @returns The flow rate in gallons per minute
 */
export function cfsToGpm(cfs: number): GPM {
  return (cfs * 448.831) as GPM;
}