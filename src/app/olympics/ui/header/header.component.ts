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
  readonly title = input.required<string>();
  readonly indicators = input.required<readonly Indicator[]>();
  readonly loading = input(false);
  readonly variant = input<'standard' | 'dashboard' | 'country'>('standard');
}
