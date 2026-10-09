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
import { OlympicChartComponent } from '../../olympics/chart/chart.component';
import { parseCountryId } from '../../olympics/country-id';
import { HeaderComponent } from '../../olympics/header/header.component';
import { PageFeedbackComponent } from '../../olympics/page-feedback/page-feedback.component';
import { toDataLoadError } from '../../services/data-load-error';
import { DataService } from '../../services/data.service';
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
  private readonly dataService = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentTitle = inject(Title);
  private readonly router = inject(Router);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly pageState = signal<CountryPageState>({ status: 'loading' });

  readonly state = this.pageState.asReadonly();
  readonly loadingIndicators = COUNTRY_LOADING_INDICATORS;

  /** Suit les changements d’ID sans conserver un chargement précédent. */
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => parseCountryId(params.get('id'))),
        distinctUntilChanged(),
        switchMap((id) => this.loadCountry(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => {
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
        of<CountryPageState>({ status: 'error', message: toDataLoadError(error).message }),
      ),
      startWith({ status: 'loading' } as const),
    );
  }
}
