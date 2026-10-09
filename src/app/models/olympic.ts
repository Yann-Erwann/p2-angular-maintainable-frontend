/** Participation d’un pays ; son ID est unique dans ce pays, son année peut être répétée. */
export interface Participation {
  /** Identifiant unique parmi les participations du pays. */
  readonly id: number;
  /** Année de la participation, utilisée pour le tri chronologique. */
  readonly year: number;
  /** Ville hôte de cette participation. */
  readonly city: string;
  /** Médailles remportées lors de cette participation. */
  readonly medalsCount: number;
  /** Effectif de la participation, sans déduplication des personnes entre éditions. */
  readonly athleteCount: number;
}

/** Pays identifié par un ID unique ; une collection de participations vide est valide. */
export interface Olympic {
  /** Identifiant utilisé pour conserver l’identité du pays. */
  readonly id: number;
  /** Libellé affiché ; la navigation utilise l’identifiant. */
  readonly country: string;
  /** Participations du pays ; la collection peut être vide. */
  readonly participations: readonly Participation[];
}
