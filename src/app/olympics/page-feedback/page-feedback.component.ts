import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PageFeedbackState } from '../page-state';

/**
 * Annonces de statut et d’erreur sans données métier ; les régions restent présentes
 * lors des transitions pour les lecteurs d’écran.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-page-feedback',
  template: `
    <p
      role="status"
      aria-atomic="true"
      [attr.class]="
        state().status === 'success' ||
        state().status === 'error' ||
        (state().status === 'loading' && !showSkeleton())
          ? 'page-message visually-hidden'
          : 'page-message'
      "
    >
      {{ statusMessage() }}
    </p>
    <p
      role="alert"
      aria-atomic="true"
      [attr.class]="state().status !== 'error' ? 'page-message visually-hidden' : 'page-message'"
    >
      {{ errorMessage() }}
    </p>
    @if (state().status === 'loading' && showSkeleton()) {
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
  host: {
    '[class.feedback-success]':
      "state().status === 'success' || (state().status === 'loading' && !showSkeleton())",
  },
  styles: ':host { display: block; } :host(.feedback-success) { position: absolute; }',
})
export class PageFeedbackComponent {
  /** Statut et message d’erreur éventuel, sans données métier. */
  readonly state = input.required<PageFeedbackState>();
  /** Nombre de cartes du squelette intégré. */
  readonly indicatorCount = input<2 | 3>(2);
  /** Désactive le squelette visuel sans supprimer l’annonce du chargement. */
  readonly showSkeleton = input(true);
  /** Emplacements décoratifs du squelette, sans statistiques. */
  readonly indicatorSlots = computed(() => Array.from({ length: this.indicatorCount() }));
  /** Annonce de réussite personnalisable par la page. */
  readonly successMessage = input('Olympic data loaded.');
  /** Annonce de statut ; les erreurs utilisent une région distincte. */
  readonly statusMessage = computed(() => {
    switch (this.state().status) {
      case 'loading':
        return 'Loading Olympic data...';
      case 'empty':
        return 'No Olympic data available.';
      case 'not-found':
        return 'Country not found.';
      case 'success':
        return this.successMessage();
      case 'error':
        return '';
    }
  });
  /** Message affichable de l’erreur, vide dans les autres états. */
  readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.message : '';
  });
}
