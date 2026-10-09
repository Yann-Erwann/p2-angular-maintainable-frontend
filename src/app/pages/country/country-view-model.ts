import type { Olympic, Participation } from '../../models/olympic';
import type { ChartItem } from '../../olympics/chart/chart.model';
import type { Indicator } from '../../olympics/header/indicator.model';

export interface CountrySummary {
  readonly id: number;
  readonly name: string;
  /** Copie triée par année croissante, stable à année égale. */
  readonly participations: readonly Participation[];
  /** Nombre de participations, y compris celles d’une même année. */
  readonly entries: number;
  readonly totalMedals: number;
  /** Cumul par participation, sans déduplication des personnes. */
  readonly athleteEntries: number;
}

/**
 * Trie une copie par année croissante, de façon stable à année égale, puis cumule les compteurs.
 * @param country Pays validé. Sans participation, les totaux restent à zéro.
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

const COUNTRY_CODES: Readonly<Record<string, string>> = {
  France: 'fr',
  Italy: 'it',
  Spain: 'es',
  Germany: 'de',
  'United States': 'us',
};

/** Vue complète du pays ; le détail et le sélecteur proviennent de la même collection. */
export interface CountryViewModel {
  readonly summary: CountrySummary;
  /** Pays du sélecteur dans l’ordre du fichier, avec leurs identifiants. */
  readonly options: readonly {
    readonly id: number;
    readonly name: string;
    readonly flagCode: string;
  }[];
  readonly indicators: readonly Indicator[];
  /** Code du drapeau connu, ou chaîne vide pour l’emplacement neutre. */
  readonly flagCode: string;
  readonly chartItems: readonly ChartItem[];
}

/**
 * `empty` désigne un pays existant sans participation ; `not-found` déclenche la redirection 404.
 * Seuls `success` et `empty` portent les données d’affichage.
 */
export type CountryPageState =
  | { readonly status: 'loading' }
  | { readonly status: 'not-found' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly data: CountryViewModel }
  | { readonly status: 'empty'; readonly data: CountryViewModel };

function countryIndicators(
  entries: number,
  medals: number,
  athletes: number,
): readonly Indicator[] {
  return [
    { kind: 'entries', label: 'Number of entries', value: entries },
    { kind: 'medals', label: 'Total Number of medals', value: medals },
    { kind: 'athletes', label: 'Total Number of athletes', value: athletes },
  ];
}

export const COUNTRY_LOADING_INDICATORS = countryIndicators(0, 0, 0);

/**
 * Sélectionne un pays dans la collection validée, sans mutation.
 * @returns Vue chargée, pays sans participation (`empty`) ou ID absent (`not-found`).
 */
export function createCountryState(countries: readonly Olympic[], id: number): CountryPageState {
  const country = countries.find((item) => item.id === id);
  if (!country) return { status: 'not-found' };
  const summary = summarizeCountry(country);
  return {
    status: summary.entries ? 'success' : 'empty',
    data: {
      summary,
      options: countries.map((item) => ({
        id: item.id,
        name: item.country,
        flagCode: COUNTRY_CODES[item.country] ?? '',
      })),
      indicators: countryIndicators(summary.entries, summary.totalMedals, summary.athleteEntries),
      flagCode: COUNTRY_CODES[summary.name] ?? '',
      chartItems: summary.participations.map((item) => ({
        label: item.year,
        value: item.medalsCount,
      })),
    },
  };
}

export function countryDocumentTitle(state: CountryPageState): string {
  if (state.status === 'success' || state.status === 'empty') {
    return `${state.data.summary.name} | Olympic Games`;
  }
  return 'Country details | Olympic Games';
}
