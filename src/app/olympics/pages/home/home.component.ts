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
import { toOlympicDataLoadError } from '../../services/olympic-data-load-error';
import { OlympicDataService } from '../../services/olympic-data.service';
import { OlympicChartComponent } from '../../ui/chart/chart.component';
import { HeaderComponent } from '../../ui/header/header.component';
import { PageFeedbackComponent } from '../../ui/page-feedback/page-feedback.component';
import { createHomeState, HOME_LOADING_INDICATORS, type HomePageState } from './home-view-model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [HeaderComponent, OlympicChartComponent, PageFeedbackComponent, RouterLink],
})
export class HomeComponent implements OnInit {
  private readonly dataService = inject(OlympicDataService);
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
          of<HomePageState>({ status: 'error', message: toOlympicDataLoadError(error).message }),
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
