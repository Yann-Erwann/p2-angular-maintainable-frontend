import { OlympicDataValidationError, validateOlympicData } from './olympic-data.validator';

describe('validateOlympicData', () => {
  const participation = {
    id: 1, year: 2012, city: 'London', medalsCount: 0, athleteCount: 100,
  };
  const country = { id: 1, country: 'France', participations: [participation] };

  it('should preserve valid values, zero counts and empty participation lists', () => {
    const payload = [country, { id: 2, country: 'Italy', participations: [] }];
    expect(validateOlympicData(payload)).toEqual(payload);
    expect(payload[0]).toBe(country);
  });

  it('should accept an empty collection and participation IDs reused across countries', () => {
    expect(validateOlympicData([])).toEqual([]);
    expect(validateOlympicData([country, { ...country, id: 2, country: 'Italy' }]).length).toBe(2);
  });

  const malformed: readonly { name: string; payload: unknown }[] = [
    { name: 'null response', payload: null },
    { name: 'object response', payload: {} },
    { name: 'string response', payload: 'private server details' },
    { name: 'null country', payload: [null] },
    { name: 'country array', payload: [[]] },
    { name: 'missing country fields', payload: [{ id: 1 }] },
    { name: 'empty country name', payload: [{ ...country, country: ' ' }] },
    { name: 'numeric country name', payload: [{ ...country, country: 1 }] },
    { name: 'string country ID', payload: [{ ...country, id: '1' }] },
    { name: 'zero country ID', payload: [{ ...country, id: 0 }] },
    { name: 'negative country ID', payload: [{ ...country, id: -1 }] },
    { name: 'fractional country ID', payload: [{ ...country, id: 1.5 }] },
    { name: 'unsafe country ID', payload: [{ ...country, id: Number.MAX_SAFE_INTEGER + 1 }] },
    { name: 'duplicate country IDs', payload: [country, { ...country, country: 'Italy' }] },
    { name: 'null participations', payload: [{ ...country, participations: null }] },
    { name: 'object participations', payload: [{ ...country, participations: {} }] },
    { name: 'null participation', payload: [{ ...country, participations: [null] }] },
    { name: 'missing participation fields', payload: [{ ...country, participations: [{ id: 1 }] }] },
    { name: 'duplicate participation IDs', payload: [{ ...country, participations: [participation, participation] }] },
  ];

  for (const scenario of malformed) {
    it(`should reject ${scenario.name}`, () => {
      expect(() => validateOlympicData(scenario.payload)).toThrowError(OlympicDataValidationError);
    });
  }

  for (const field of ['id', 'year']) {
    for (const invalid of ['2012', 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN]) {
      it(`should reject an invalid participation ${field}: ${String(invalid)}`, () => {
        expect(() => validateOlympicData([{ ...country, participations: [{ ...participation, [field]: invalid }] }]))
          .toThrowError(OlympicDataValidationError);
      });
    }
  }

  for (const field of ['medalsCount', 'athleteCount']) {
    for (const invalid of ['10', -1, Infinity, -Infinity, NaN, null]) {
      it(`should reject an invalid numeric ${field}: ${String(invalid)}`, () => {
        expect(() => validateOlympicData([{ ...country, participations: [{ ...participation, [field]: invalid }] }]))
          .toThrowError(OlympicDataValidationError);
      });
    }
  }

  for (const city of ['', ' ', null, 12]) {
    it(`should reject an invalid city: ${String(city)}`, () => {
      expect(() => validateOlympicData([{ ...country, participations: [{ ...participation, city }] }]))
        .toThrowError(OlympicDataValidationError);
    });
  }

  it('should reject the whole response when only a later country is invalid', () => {
    expect(() => validateOlympicData([country, { id: 2 }])).toThrowError(OlympicDataValidationError);
  });
});
