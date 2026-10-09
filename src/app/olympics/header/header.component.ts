import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { Indicator } from './indicator.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  readonly title = input.required<string>();
  readonly indicators = input.required<readonly Indicator[]>();
  readonly loading = input(false);
}
