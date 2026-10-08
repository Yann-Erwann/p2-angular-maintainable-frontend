import type { Olympic, Participation } from '../models/olympic';

export class OlympicDataValidationError extends Error {
  override readonly name = 'OlympicDataValidationError';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isParticipation(value: unknown): value is Participation {
  return isRecord(value)
    && isPositiveInteger(value['id'])
    && isPositiveInteger(value['year'])
    && isText(value['city'])
    && isCount(value['medalsCount'])
    && isCount(value['athleteCount']);
}

function isOlympic(value: unknown): value is Olympic {
  if (!isRecord(value)
    || !isPositiveInteger(value['id'])
    || !isText(value['country'])
    || !isArray(value['participations'])) {
    return false;
  }

  const participationIds = new Set<number>();
  for (const participation of value['participations']) {
    if (!isParticipation(participation) || participationIds.has(participation.id)) {
      return false;
    }
    participationIds.add(participation.id);
  }
  return true;
}

export function validateOlympicData(payload: unknown): readonly Olympic[] {
  if (!isArray(payload)) {
    throw new OlympicDataValidationError('Expected an Olympic data array.');
  }

  const olympics: Olympic[] = [];
  const countryIds = new Set<number>();
  for (const [index, country] of payload.entries()) {
    if (!isOlympic(country)) {
      throw new OlympicDataValidationError(`Invalid Olympic country or participation at index ${index}.`);
    }
    if (countryIds.has(country.id)) {
      throw new OlympicDataValidationError(`Duplicate Olympic country identifier at index ${index}.`);
    }
    countryIds.add(country.id);
    olympics.push(country);
  }
  return olympics;
}
