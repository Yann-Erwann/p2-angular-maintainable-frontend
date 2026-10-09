/** `kind` détermine pictogramme, couleur et suivi ; il doit être unique dans une vue. */
export interface Indicator {
  /** Clé unique dans la vue, utilisée pour le pictogramme et la couleur. */
  readonly kind: 'countries' | 'editions' | 'entries' | 'medals' | 'athletes';
  /** Libellé visible et accessible de la valeur. */
  readonly label: string;
  /** Compteur calculé ; les athlètes sont cumulés par participation. */
  readonly value: number;
}
