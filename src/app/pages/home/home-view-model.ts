import type { Olympic } from '../../models/olympic';
import { MEDAL_COLORS } from '../../olympics/chart/chart-colors';
import type { ChartItem } from '../../olympics/chart/chart.model';
import type { Indicator } from '../../olympics/header/indicator.model';
import { summarizeOlympics, type CountryMedalRow } from './olympic-summary';

/** Le tableau et le graphique partagent l’ordre des pays pour la sélection par index. */
export interface HomeViewModel {
  /** Identité, statistiques et couleur réunies pour chaque pays. */
  readonly rows: readonly (CountryMedalRow & { readonly color: string })[];
  /** Cartes identifiées par leur clé métier, indépendamment de leur position. */
  readonly indicators: readonly Indicator[];
  /** Paires pays/médailles dans le même ordre que les lignes du tableau. */
  readonly chartItems: readonly ChartItem[];
}

/** Seule la réussite porte les données d’affichage de l’accueil. */
export type HomePageState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly data: HomeViewModel };

/** Prépare les cartes de pays et d’éditions distinctes. */
function homeIndicators(countries: number, editions: number): readonly Indicator[] {
  return [
    { kind: 'countries', label: 'Number of countries', value: countries },
    { kind: 'editions', label: 'Number of JOs', value: editions },
  ];
}

/** Cartes réservées au chargement de l’accueil. */
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
