/** Paire indivisible libellé/médailles ; l’ordre de la collection détermine la sélection. */
export interface ChartItem {
  readonly label: string | number;
  readonly value: number;
}

/** Entrée de l’adaptateur sans dépendance aux modèles métier. */
export interface OlympicChartData {
  readonly type: 'pie' | 'line';
  readonly items: readonly ChartItem[];
}
