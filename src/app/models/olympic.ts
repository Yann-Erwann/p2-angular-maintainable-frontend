/** Participation d’un pays ; son ID est unique dans ce pays, son année peut être répétée. */
export interface Participation {
  readonly id: number;
  readonly year: number;
  readonly city: string;
  readonly medalsCount: number;
  /** Effectif de la participation, sans déduplication des personnes entre éditions. */
  readonly athleteCount: number;
}

/** Pays identifié par un ID unique ; une collection de participations vide est valide. */
export interface Olympic {
  readonly id: number;
  /** Libellé affiché ; la navigation utilise l’identifiant. */
  readonly country: string;
  readonly participations: readonly Participation[];
}
