import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { Title } from '@angular/platform-browser';
import type { Olympic } from '../../models/olympic';
import { parseCountryId } from '../../olympics/country-id';
import { toDataLoadError } from '../../services/data-load-error';
import { ActivatedRoute } from '@angular/router';
import { OlympicChartComponent } from '../../olympics/chart/chart.component';
import { HeaderComponent } from '../../olympics/header/header.component';
import { PageFeedbackComponent } from '../../olympics/page-feedback/page-feedback.component';
import type { PageState } from '../../olympics/page-state';
import { DataService } from '../../services/data.service';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss'],
  imports: [HeaderComponent, OlympicChartComponent, PageFeedbackComponent]
})
export class CountryComponent implements OnInit {
  private readonly pageState = signal<PageState<Olympic>>({ status: 'loading' });
  readonly summary = computed(() => {
    const state = this.pageState();
    const country = state.status === 'success' || state.status === 'empty' ? state.data : undefined;
    const participations = country?.participations ?? [];
    return {
      participations,
      title: country?.country ?? '',
      entries: participations.length,
      medals: participations.map((item) => item.medalsCount),
      years: participations.map((item) => item.year),
      totalMedals: participations.reduce((total, item) => total + item.medalsCount, 0),
      athletes: participations.reduce((total, item) => total + item.athleteCount, 0),
    };
  });
  public get state() { return this.pageState(); }
  public get titlePage() { return this.summary().title; }
  public get totalEntries() { return this.summary().entries; }
  public get totalMedals() { return this.summary().totalMedals; }
  public get totalAthletes() { return this.summary().athletes; }

  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentTitle = inject(Title);

  ngOnInit() {
    this.route.paramMap.pipe(
      map((params) => parseCountryId(params.get('id'))),
      distinctUntilChanged(),
      switchMap((id) => id === null
        ? of<PageState<Olympic>>({ status: 'not-found' })
        : this.dataService.getCountryById(id).pipe(
          map((country): PageState<Olympic> => country
            ? { status: country.participations.length > 0 ? 'success' : 'empty', data: country }
            : { status: 'not-found' }),
          catchError((error: unknown) => of<PageState<Olympic>>({ status: 'error', message: toDataLoadError(error).message })),
          startWith({ status: 'loading' } as const),
        )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((state) => {
      this.pageState.set(state);
      const title = state.status === 'success' || state.status === 'empty'
        ? state.data?.country ?? 'Country details'
        : state.status === 'not-found' ? 'Country not found' : 'Country details';
      this.documentTitle.setTitle(`${title} | Olympic Games`);
    });
  }
}
