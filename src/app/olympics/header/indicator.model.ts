/** `kind` détermine pictogramme, couleur et suivi ; il doit être unique dans une vue. */
export interface Indicator {
  readonly kind: 'countries' | 'editions' | 'entries' | 'medals' | 'athletes';
  readonly label: string;
  /** Compteur calculé ; les athlètes sont cumulés par participation. */
  readonly value: number;
}
