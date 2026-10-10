/** Paire indivisible libellé/médailles ; l’ordre de la collection détermine la sélection. */
export interface ChartItem {
  /** Libellé du pays ou année affiché sur le graphique. */
  readonly label: string | number;
  /** Valeur numérique représentée par le point ou le secteur. */
  readonly value: number;
}

/** Entrée de l’adaptateur sans dépendance aux modèles métier. */
export interface OlympicChartData {
  /** Type de graphique choisi par la page consommatrice. */
  readonly type: 'pie' | 'line';
  /** Collection ordonnée des valeurs représentées. */
  readonly items: readonly ChartItem[];
}
