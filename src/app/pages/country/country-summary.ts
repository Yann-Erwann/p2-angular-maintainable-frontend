import type { Olympic, Participation } from '../../models/olympic';

/** Résumé métier d’un pays chargé, indépendant de sa présentation. */
export interface CountrySummary {
  /** Identifiant utilisé pour conserver l’identité du pays. */
  readonly id: number;
  /** Libellé du pays provenant des données validées. */
  readonly name: string;
  /** Copie triée par année croissante, stable à année égale. */
  readonly participations: readonly Participation[];
  /** Nombre de participations, y compris celles d’une même année. */
  readonly entries: number;
  /** Somme des médailles de toutes les participations. */
  readonly totalMedals: number;
  /** Cumul par participation, sans déduplication des personnes. */
  readonly athleteEntries: number;
}

/**
 * Trie une copie par année croissante, de façon stable à année égale, puis cumule les compteurs.
 * @param country Pays validé et présent ; une collection vide produit des totaux à zéro.
 */
export function summarizeCountry(country: Olympic): CountrySummary {
  const participations = [...country.participations].sort((a, b) => a.year - b.year);
  return {
    id: country.id,
    name: country.country,
    participations,
    entries: participations.length,
    totalMedals: participations.reduce((total, item) => total + item.medalsCount, 0),
    athleteEntries: participations.reduce((total, item) => total + item.athleteCount, 0),
  };
}
