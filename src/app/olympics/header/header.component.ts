import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { Indicator } from './indicator.model';

/** Présentation des indicateurs ; leur signification dépend de `kind`, jamais de leur position. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  host: {
    class: 'results-header',
    '[class.results-header--dashboard]': "variant() !== 'standard'",
    '[class.results-header--country]': "variant() === 'country'",
  },
})
export class HeaderComponent {
  /** Titre de section au-dessus des indicateurs. */
  readonly title = input.required<string>();
  /** Cartes identifiées par leur clé métier, indépendamment de leur position. */
  readonly indicators = input.required<readonly Indicator[]>();
  /** Remplace les valeurs par des emplacements réservés. */
  readonly loading = input(false);
  /** Mise en page standard, accueil ou détail pays. */
  readonly variant = input<'standard' | 'dashboard' | 'country'>('standard');
}
