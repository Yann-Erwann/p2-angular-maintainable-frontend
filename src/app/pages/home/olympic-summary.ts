import type { Olympic } from '../../models/olympic';

/** Identité et statistiques associées d’un pays parmi ceux du fichier. */
export interface CountryMedalRow {
  /** Identifiant utilisé pour conserver l’identité du pays. */
  readonly id: number;
  /** Libellé du pays provenant des données validées. */
  readonly name: string;
  /** Médailles cumulées pour ce pays. */
  readonly medals: number;
  /** Part de la collection arrondie à une décimale, ou zéro sans médaille. */
  readonly percentage: number;
}

/** Éditions distinctes et répartition des médailles de la collection. */
export interface OlympicSummary {
  /** Nombre d’années distinctes, et non nombre de participations. */
  readonly editions: number;
  /** Une ligne par pays dans l’ordre de la collection reçue. */
  readonly rows: readonly CountryMedalRow[];
}

/**
 * Conserve l’ordre des pays sans mutation. Les parts concernent uniquement la collection
 * fournie : arrondi à une décimale sans redistribution ; zéro si aucune médaille.
 */
export function summarizeOlympics(countries: readonly Olympic[]): OlympicSummary {
  const totals = countries.map((country) => ({
    id: country.id,
    name: country.country,
    medals: country.participations.reduce((sum, item) => sum + item.medalsCount, 0),
  }));
  const totalMedals = totals.reduce((sum, country) => sum + country.medals, 0);
  return {
    editions: new Set(
      countries.flatMap((country) => country.participations.map((item) => item.year)),
    ).size,
    rows: totals.map((country) => ({
      ...country,
      percentage: totalMedals ? Math.round((country.medals / totalMedals) * 1000) / 10 : 0,
    })),
  };
}
