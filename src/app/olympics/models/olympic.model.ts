/** Participation d’un pays ; son ID est unique dans ce pays, son année peut être répétée. */
export interface Participation {
  /** Identifiant unique de la participation dans le pays. */
  readonly id: number;
  /** Année de l’édition olympique. */
  readonly year: number;
  /** Ville hôte de l’édition. */
  readonly city: string;
  /** Médailles obtenues pendant cette participation. */
  readonly medalsCount: number;
  /** Effectif de la participation, sans déduplication des personnes entre éditions. */
  readonly athleteCount: number;
}

/** Pays identifié par un ID unique ; une collection de participations vide est valide. */
export interface Olympic {
  /** Identifiant stable utilisé dans les URL. */
  readonly id: number;
  /** Libellé affiché ; la navigation utilise l’identifiant. */
  readonly country: string;
  /** Participations du pays, éventuellement vide. */
  readonly participations: readonly Participation[];
}
