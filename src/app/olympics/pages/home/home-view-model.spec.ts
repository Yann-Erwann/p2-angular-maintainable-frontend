import type { Olympic } from '../../models/olympic.model';
import { summarizeOlympics } from './home-view-model';

const country = (id: number, medalsCount: number, year = 2012): Olympic =>
  Object.freeze({
    id,
    country: `Country ${id}`,
    participations: Object.freeze([
      Object.freeze({ id: 1, year, city: 'London', medalsCount, athleteCount: 0 }),
    ]),
  });

describe('Olympic statistics', () => {
  it('should accept an empty collection', () => {
    expect(summarizeOlympics([])).toEqual({ editions: 0, rows: [] });
  });

  it('should retain input order, identity and medals without mutating the source', () => {
    const countries = Object.freeze([country(5, 30, 2020), country(1, 15), country(3, 0)]);
    const summary = summarizeOlympics(countries);
    expect(summary.editions).toBe(2);
    expect(summary.rows).toEqual([
      { id: 5, name: 'Country 5', medals: 30, percentage: 66.7 },
      { id: 1, name: 'Country 1', medals: 15, percentage: 33.3 },
      { id: 3, name: 'Country 3', medals: 0, percentage: 0 },
    ]);
    expect(countries.map((item) => item.id)).toEqual([5, 1, 3]);
  });

  it('should report zero percentages when all medal counts are zero', () => {
    expect(
      summarizeOlympics([country(1, 0), country(2, 0)]).rows.map((item) => item.percentage),
    ).toEqual([0, 0]);
  });

  it('should round independently without redistributing rounding differences', () => {
    const percentages = summarizeOlympics([country(1, 1), country(2, 1), country(3, 1)]).rows.map(
      (item) => item.percentage,
    );
    expect(percentages).toEqual([33.3, 33.3, 33.3]);
    expect(percentages.reduce((sum, value) => sum + value, 0)).toBeCloseTo(99.9);
  });
});
