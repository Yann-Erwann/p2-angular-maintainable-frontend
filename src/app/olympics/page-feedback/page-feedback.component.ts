import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PageState } from '../page-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-page-feedback',
  template: `
    <p role="status" aria-atomic="true"
      [attr.class]="state().status === 'success' || state().status === 'error' ? 'page-message visually-hidden' : 'page-message'">{{ statusMessage() }}</p>
    <p role="alert" aria-atomic="true"
      [attr.class]="state().status !== 'error' ? 'page-message visually-hidden' : 'page-message'">{{ errorMessage() }}</p>
    @if (state().status === 'loading') {
      <div class="loading-skeleton" aria-hidden="true">
        <div class="skeleton-title"></div>
        <div class="skeleton-indicators">
          @for (indicator of indicatorSlots(); track $index) {
            <div class="skeleton-indicator"></div>
          }
        </div>
        <div class="skeleton-chart"></div>
      </div>
    }
  `,
  styleUrl: './page-feedback.component.scss',
  styles: ':host { display: block; }',
})
export class PageFeedbackComponent {
  readonly state = input.required<PageState<unknown>>();
  readonly indicatorCount = input<2 | 3>(2);
  readonly indicatorSlots = computed(() => Array.from({ length: this.indicatorCount() }));
  readonly successMessage = input('Olympic data loaded.');
  readonly statusMessage = computed(() => {
    switch (this.state().status) {
      case 'loading': return 'Loading Olympic data...';
      case 'empty': return 'No Olympic data available.';
      case 'not-found': return 'Country not found.';
      case 'success': return this.successMessage();
      case 'error': return '';
    }
  });
  readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.message : '';
  });
}
