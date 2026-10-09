/**
 * Accepte un entier positif sûr en écriture décimale, sans signe ni zéro initial.
 * @returns Identifiant validé, ou `null` pour une entrée absente ou invalide.
 */
export function parseCountryId(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
