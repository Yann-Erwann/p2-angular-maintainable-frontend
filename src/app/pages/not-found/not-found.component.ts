import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Repli pour un chemin inconnu ; un pays absent relève de l’état de la fiche. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent {}
