import type { Olympic } from '../../models/olympic.model';
import { MEDAL_COLORS } from '../../ui/chart/chart-colors';
import type { ChartItem } from '../../ui/chart/chart.model';
import type { Indicator } from '../../ui/header/indicator.model';

/** Ligne de tableau et de graphique représentant un pays. */
export interface CountryMedalRow {
  /** Identifiant utilisé pour naviguer vers le pays. */
  readonly id: number;
  /** Nom affiché dans le tableau et le graphique. */
  readonly name: string;
  /** Total de médailles du pays. */
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

/** Le tableau et le graphique partagent l’ordre des pays pour la sélection par index. */
export interface HomeViewModel {
  /** Lignes colorées affichées dans le tableau. */
  readonly rows: readonly (CountryMedalRow & { readonly color: string })[];
  /** Indicateurs globaux affichés dans l’en-tête. */
  readonly indicators: readonly Indicator[];
  /** Données adaptées au graphique de répartition. */
  readonly chartItems: readonly ChartItem[];
}

/** États affichables de la page d’accueil. */
export type HomePageState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly data: HomeViewModel };

/** Construit les indicateurs globaux de la page d’accueil. */
function homeIndicators(countries: number, editions: number): readonly Indicator[] {
  return [
    { kind: 'countries', label: 'Number of countries', value: countries },
    { kind: 'editions', label: 'Number of JOs', value: editions },
  ];
}

/** Indicateurs neutres affichés pendant le chargement. */
export const HOME_LOADING_INDICATORS = homeIndicators(0, 0);

/** Prépare une vue sans mutation ; des pays à zéro médaille restent un succès. */
export function createHomeState(countries: readonly Olympic[]): HomePageState {
  if (!countries.length) return { status: 'empty' };
  const summary = summarizeOlympics(countries);
  return {
    status: 'success',
    data: {
      rows: summary.rows.map((row, index) => ({
        ...row,
        color: MEDAL_COLORS[index % MEDAL_COLORS.length],
      })),
      indicators: homeIndicators(summary.rows.length, summary.editions),
      chartItems: summary.rows.map((row) => ({ label: row.name, value: row.medals })),
    },
  };
}
