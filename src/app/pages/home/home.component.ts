import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ErrorHandler,
  inject,
  type OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { OlympicChartComponent } from '../../olympics/chart/chart.component';
import { HeaderComponent } from '../../olympics/header/header.component';
import { PageFeedbackComponent } from '../../olympics/page-feedback/page-feedback.component';
import { DataService } from '../../services/data.service';
import { toDataLoadError } from '../../services/data-load-error';
import { createHomeState, HOME_LOADING_INDICATORS, type HomePageState } from './home-view-model';

/** Accueil : chargement partagé, préparation de la vue et navigation par ID. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [HeaderComponent, OlympicChartComponent, PageFeedbackComponent, RouterLink],
})
export class HomeComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly router = inject(Router);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageState = signal<HomePageState>({ status: 'loading' });

  readonly state = this.pageState.asReadonly();
  readonly loadingIndicators = HOME_LOADING_INDICATORS;
  ngOnInit(): void {
    this.dataService
      .getOlympics()
      .pipe(
        map(createHomeState),
        catchError((error: unknown) =>
          of<HomePageState>({ status: 'error', message: toDataLoadError(error).message }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => this.pageState.set(state));
  }

  /** L’index correspond aux lignes du modèle courant ; une sélection absente est ignorée. */
  selectCountry(index: number): void {
    const state = this.state();
    if (state.status !== 'success') return;
    const country = state.data.rows[index];
    if (!country) return;
    void this.router
      .navigate(['/country', country.id])
      .catch((error: unknown) => this.errorHandler.handleError(error));
  }
}
