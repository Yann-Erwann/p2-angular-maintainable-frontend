import { parseCountryId } from './country-id';

describe('parseCountryId', () => {
  for (const value of [null, '', ' ', 'France', '0', '-1', '01', '1.5', '1e2', '0x10', '9007199254740992']) {
    it(`should reject ${JSON.stringify(value)}`, () => {
      expect(parseCountryId(value)).toBeNull();
    });
  }

  it('should accept positive safe integer IDs', () => {
    expect(parseCountryId('2')).toBe(2);
    expect(parseCountryId('9007199254740991')).toBe(Number.MAX_SAFE_INTEGER);
  });
});
