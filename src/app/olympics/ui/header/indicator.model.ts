/** `kind` détermine pictogramme, couleur et suivi ; il doit être unique dans une vue. */
export interface Indicator {
  /** Catégorie déterminant l’icône et le style du compteur. */
  readonly kind: 'countries' | 'editions' | 'entries' | 'medals' | 'athletes';
  /** Libellé accessible et visible associé au compteur. */
  readonly label: string;
  /** Compteur calculé ; les athlètes sont cumulés par participation. */
  readonly value: number;
}
