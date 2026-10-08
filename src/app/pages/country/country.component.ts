import { Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, map } from 'rxjs';
import type { Olympic } from '../../models/olympic';
import { olympicLoadState } from '../../olympics/olympic-load-state';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OlympicChartComponent } from '../../olympics/chart/chart.component';
import { HeaderComponent } from '../../olympics/header/header.component';
import { PageFeedbackComponent } from '../../olympics/page-feedback/page-feedback.component';
import type { PageState } from '../../olympics/page-state';
import { DataService } from '../../services/data.service';


@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss'],
  imports: [RouterLink, HeaderComponent, OlympicChartComponent, PageFeedbackComponent]
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

  ngOnInit() {
    combineLatest([
      this.route.paramMap,
      olympicLoadState(this.dataService.getOlympics()),
    ]).pipe(
      map(([params, state]): PageState<Olympic> => {
        const countryName = params.get('countryName');
        if (!countryName?.trim()) {
          return { status: 'not-found' };
        }
        if (state.status !== 'success') {
          return state.status === 'empty' ? { status: 'empty' } : state;
        }
        const country = state.data.find((item) => item.country === countryName);
        if (!country) {
          return { status: 'not-found' };
        }
        return { status: country.participations.length > 0 ? 'success' : 'empty', data: country };
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((state) => this.pageState.set(state));
  }
}
