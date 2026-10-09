import type { Olympic, Participation } from '../../models/olympic';
import { summarizeCountry } from './country-summary';
import { createCountryState } from './country-view-model';

const participation = (id: number, year: number, medalsCount: number): Participation =>
  Object.freeze({ id, year, city: 'Tokyo', medalsCount, athleteCount: 100 });

describe('Country statistics', () => {
  it('should sort a copy chronologically and keep equal-year entries stable', () => {
    const participations = Object.freeze([
      participation(1, 2020, 40),
      participation(2, 2012, 10),
      participation(3, 2012, 20),
      participation(4, 2016, 30),
    ]);
    const country: Olympic = Object.freeze({ id: 5, country: 'France', participations });
    const summary = summarizeCountry(country);
    expect(summary.participations.map((item) => item.id)).toEqual([2, 3, 4, 1]);
    expect(participations.map((item) => item.id)).toEqual([1, 2, 3, 4]);
    expect(summary.entries).toBe(4);
    expect(summary.totalMedals).toBe(100);
    expect(summary.athleteEntries).toBe(400);
  });

  it('should retain country identity with zero totals for no participations', () => {
    const summary = summarizeCountry({ id: 5, country: 'France', participations: [] });
    expect(summary).toEqual({
      id: 5,
      name: 'France',
      participations: [],
      entries: 0,
      totalMedals: 0,
      athleteEntries: 0,
    });
  });

  it('should distinguish an absent country from an existing empty one', () => {
    const countries = [{ id: 5, country: 'France', participations: [] }];
    expect(createCountryState(countries, 999)).toEqual({ status: 'not-found' });
    const state = createCountryState(countries, 5);
    expect(state.status).toBe('empty');
    if (state.status !== 'empty') throw new Error('Expected an empty country.');
    expect(state.data.options).toEqual([{ id: 5, name: 'France', flagCode: 'fr' }]);
    expect(state.data.indicators.map((item) => item.value)).toEqual([0, 0, 0]);
  });

  it('should select by ID when names match and preserve chart associations', () => {
    const state = createCountryState(
      [
        { id: 1, country: 'France', participations: [] },
        {
          id: 5,
          country: 'France',
          participations: [participation(1, 2020, 40), participation(2, 2012, 10)],
        },
      ],
      5,
    );
    if (state.status !== 'success') throw new Error('Expected country data.');
    expect(state.data.summary.id).toBe(5);
    expect(state.data.chartItems).toEqual([
      { label: 2012, value: 10 },
      { label: 2020, value: 40 },
    ]);
  });
});
