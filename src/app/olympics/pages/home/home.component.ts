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

/** Page d’accueil chargée depuis le service partagé de données olympiques. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [HeaderComponent, OlympicChartComponent, PageFeedbackComponent, RouterLink],
})
export class HomeComponent implements OnInit {
  /** Service partagé de chargement et de cache des données. */
  private readonly dataService = inject(OlympicDataService);
  /** Routeur utilisé par la sélection d’un pays dans le tableau ou le graphique. */
  private readonly router = inject(Router);
  /** Gestionnaire de secours pour les erreurs de navigation. */
  private readonly errorHandler = inject(ErrorHandler);
  /** Arrête l’écoute lorsque la page est détruite. */
  private readonly destroyRef = inject(DestroyRef);
  /** État interne de la page d’accueil. */
  private readonly pageState = signal<HomePageState>({ status: 'loading' });

  /** État public consommé par le template. */
  readonly state = this.pageState.asReadonly();
  /** Indicateurs neutres affichés pendant le chargement. */
  readonly loadingIndicators = HOME_LOADING_INDICATORS;
  /** Charge les données et transforme les erreurs en état affichable. */
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
