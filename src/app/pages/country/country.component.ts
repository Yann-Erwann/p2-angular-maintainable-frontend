import { afterNextRender, type AfterRenderRef, Component, computed, DestroyRef, inject, Injector, type OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, map } from 'rxjs';
import type { Olympic } from '../../models/olympic';
import { olympicLoadState } from '../../olympics/olympic-load-state';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';
import { HeaderComponent } from '../../olympics/header/header.component';
import type { PageState } from '../../olympics/page-state';
import { DataService } from '../../services/data.service';


@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss'],
  imports: [RouterLink, HeaderComponent]
})
export class CountryComponent implements OnInit {
  public lineChart!: Chart<"line", number[], number>;
  private readonly pageState = signal<PageState<Olympic>>({ status: 'loading' });
  private readonly summary = computed(() => {
    const state = this.pageState();
    const country = state.status === 'success' || state.status === 'empty' ? state.data : undefined;
    const participations = country?.participations ?? [];
    return {
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
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private pendingRender?: AfterRenderRef;

  ngOnInit() {
    this.destroyRef.onDestroy(() => this.pendingRender?.destroy());
    combineLatest([
      this.route.paramMap,
      olympicLoadState(this.dataService.getOlympics()),
    ]).pipe(
      map(([params, state]): PageState<Olympic> => {
        if (state.status !== 'success') {
          return state.status === 'empty' ? { status: 'empty' } : state;
        }
        const country = state.data.find((item) => item.country === params.get('countryName'));
        if (!country) {
          return { status: 'not-found' };
        }
        return { status: country.participations.length > 0 ? 'success' : 'empty', data: country };
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((state) => {
      this.pendingRender?.destroy();
      this.lineChart?.destroy();
      this.pageState.set(state);
      if (state.status === 'success') {
        this.pendingRender = afterNextRender(() => {
          const summary = this.summary();
          this.buildChart(summary.years, summary.medals);
        }, { injector: this.injector });
      }
    });
  }

  buildChart(years: number[], medals: number[]) {
    const lineChart = new Chart("countryChart", {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: "medals",
            data: medals,
            backgroundColor: '#0b868f'
          },
        ]
      },
      options: {
        aspectRatio: 2.5
      }
    });
    this.lineChart = lineChart;
  }
}
