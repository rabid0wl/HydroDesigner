import { round, gpmToCfs, cfsToGpm, GPM, CFS } from './num';

describe('num utilities', () => {
  test('round function works correctly', () => {
    expect(round(1/3, 4)).toBe(0.3333);
    expect(round(1/3, 2)).toBe(0.33);
    expect(round(1.23456789, 6)).toBe(1.234568);
  });

  test('gpm to cfs and back conversion is invertible', () => {
    const originalGpm: GPM = 123.5 as GPM;
    const cfs: CFS = gpmToCfs(originalGpm);
    const convertedGpm: GPM = cfsToGpm(cfs);
    
    expect(Math.abs(convertedGpm - originalGpm)).toBeLessThan(1e-6);
  });

  test('cfs to gpm and back conversion is invertible', () => {
    const originalCfs: CFS = 10 as CFS;
    const gpm: GPM = cfsToGpm(originalCfs);
    const convertedCfs: CFS = gpmToCfs(gpm);
    
    expect(Math.abs(convertedCfs - originalCfs)).toBeLessThan(1e-6);
  });
});