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
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
  type Observable,
} from 'rxjs';
import { toOlympicDataLoadError } from '../../services/olympic-data-load-error';
import { OlympicDataService } from '../../services/olympic-data.service';
import { parseCountryId } from '../../routing/country-id.parser';
import { OlympicChartComponent } from '../../ui/chart/chart.component';
import { HeaderComponent } from '../../ui/header/header.component';
import { PageFeedbackComponent } from '../../ui/page-feedback/page-feedback.component';
import {
  COUNTRY_LOADING_INDICATORS,
  countryDocumentTitle,
  createCountryState,
  type CountryPageState,
} from './country-view-model';

/**
 * Détail piloté par l’ID de route. Le titre et le contenu suivent le même état.
 * Les erreurs de chargement ne terminent pas l’écoute de la route.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrl: './country.component.scss',
  imports: [HeaderComponent, OlympicChartComponent, PageFeedbackComponent],
})
export class CountryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(OlympicDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentTitle = inject(Title);
  private readonly router = inject(Router);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly pageState = signal<Exclude<CountryPageState, { status: 'not-found' }>>({
    status: 'loading',
  });

  readonly state = this.pageState.asReadonly();
  readonly loadingIndicators = COUNTRY_LOADING_INDICATORS;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => parseCountryId(params.get('id'))),
        distinctUntilChanged(),
        switchMap((id) => this.loadCountry(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => {
        if (state.status === 'not-found') {
          void this.router
            .navigate(['/not-found'], { replaceUrl: true })
            .catch((error: unknown) => this.errorHandler.handleError(error));
          return;
        }
        this.pageState.set(state);
        this.documentTitle.setTitle(countryDocumentTitle(state));
      });
  }

  /** La route reste la source de sélection ; seules les options chargées sont acceptées. */
  changeCountry(value: string): void {
    const id = parseCountryId(value);
    const state = this.state();
    if (id === null || (state.status !== 'success' && state.status !== 'empty')) return;
    if (!state.data.options.some((country) => country.id === id)) return;
    void this.router
      .navigate(['/country', id])
      .catch((error: unknown) => this.errorHandler.handleError(error));
  }

  /** Rejette l’ID invalide sans HTTP et garde les erreurs dans le chargement. */
  private loadCountry(id: number | null): Observable<CountryPageState> {
    if (id === null) return of({ status: 'not-found' });
    return this.dataService.getOlympics().pipe(
      map((countries) => createCountryState(countries, id)),
      catchError((error: unknown) =>
        of<CountryPageState>({
          status: 'error',
          message: toOlympicDataLoadError(error).message,
        }),
      ),
      startWith({ status: 'loading' } as const),
    );
  }
}
