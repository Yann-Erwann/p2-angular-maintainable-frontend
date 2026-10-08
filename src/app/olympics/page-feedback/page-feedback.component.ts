import { Component, computed, input } from '@angular/core';
import type { PageState } from '../page-state';

@Component({
  selector: 'app-page-feedback',
  template: `
    <p role="status" aria-atomic="true"
      [attr.class]="state().status === 'success' || state().status === 'error' ? 'page-message visually-hidden' : 'page-message'">{{ statusMessage() }}</p>
    <p role="alert" aria-atomic="true"
      [attr.class]="state().status !== 'error' ? 'page-message visually-hidden' : 'page-message'">{{ errorMessage() }}</p>
  `,
  styles: ':host { display: block; }',
})
export class PageFeedbackComponent {
  readonly state = input.required<PageState<unknown>>();
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
