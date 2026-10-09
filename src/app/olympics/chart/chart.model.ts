/** Paire indivisible libellé/médailles ; l’ordre de la collection détermine la sélection. */
export interface ChartItem {
  /** Nom du pays ou année, associé au compteur de médailles. */
  readonly label: string | number;
  /** Nombre de médailles associé au libellé. */
  readonly value: number;
}

/** Entrée de l’adaptateur sans dépendance aux modèles métier. */
export interface OlympicChartData {
  /** Présentation en répartition (`pie`) ou en historique (`line`). */
  readonly type: 'pie' | 'line';
  /** Paires libellé/médailles dans l’ordre de sélection. */
  readonly items: readonly ChartItem[];
}
