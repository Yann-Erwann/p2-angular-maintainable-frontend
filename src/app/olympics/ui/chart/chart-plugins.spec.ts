import { describe, expect, it } from 'vitest';
import { placeChartLabel } from './chart-plugins';

describe('placeChartLabel', () => {
  it('clamps the preferred position to the available bounds', () => {
    expect(placeChartLabel(100, [], 10, 30, 10)).toBe(30);
    expect(placeChartLabel(-10, [], 10, 30, 10)).toBe(10);
  });

  it('uses a bounded fallback when every candidate is occupied', () => {
    expect(placeChartLabel(20, [10, 20, 30], 10, 30, 10)).toBe(20);
  });

  it('chooses the next available bounded position before falling back', () => {
    expect(placeChartLabel(20, [20], 10, 30, 10)).toBe(30);
    expect(placeChartLabel(20, [20, 30], 10, 30, 10)).toBe(10);
  });
});
