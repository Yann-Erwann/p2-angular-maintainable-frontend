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
  /** Titre principal de la page affichée. */
  readonly title = input.required<string>();
  /** Indicateurs numériques affichés sous le titre. */
  readonly indicators = input.required<readonly Indicator[]>();
  /** Affiche l’état de chargement des indicateurs. */
  readonly loading = input(false);
  /** Variante de mise en page correspondant à la page consommatrice. */
  readonly variant = input<'standard' | 'dashboard' | 'country'>('standard');
}
