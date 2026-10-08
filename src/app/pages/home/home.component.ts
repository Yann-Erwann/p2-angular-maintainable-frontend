import { afterNextRender, type AfterRenderRef, Component, computed, DestroyRef, ErrorHandler, inject, Injector, type OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Olympic } from '../../models/olympic';
import { olympicLoadState } from '../../olympics/olympic-load-state';
import { Router, RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';
import { HeaderComponent } from '../../olympics/header/header.component';
import type { PageState } from '../../olympics/page-state';
import { DataService } from '../../services/data.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [HeaderComponent, RouterLink],
})
export class HomeComponent implements OnInit {
  public pieChart!: Chart<"pie", number[], string>;
  private readonly pageState = signal<PageState<readonly Olympic[]>>({ status: 'loading' });
  private readonly summary = computed(() => {
    const state = this.pageState();
    const data = state.status === 'success' ? state.data : [];
    return {
      countries: data.map((country) => country.country),
      medals: data.map((country) => country.participations.reduce((total, item) => total + item.medalsCount, 0)),
      editions: new Set(data.flatMap((country) => country.participations.map((item) => item.year))).size,
    };
  });
  public get state() { return this.pageState(); }
  public get totalCountries() { return this.summary().countries.length; }
  public get totalJOs() { return this.summary().editions; }
  readonly titlePage = "Medals per Country";

  private readonly router = inject(Router);
  private readonly dataService = inject(DataService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private pendingRender?: AfterRenderRef;

  ngOnInit() {
    this.destroyRef.onDestroy(() => this.pendingRender?.destroy());
    olympicLoadState(this.dataService.getOlympics()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((state) => {
      this.pendingRender?.destroy();
      this.pieChart?.destroy();
      this.pageState.set(state);
      if (state.status === 'success') {
        this.pendingRender = afterNextRender(() => {
          const summary = this.summary();
          this.buildPieChart(summary.countries, summary.medals);
        }, { injector: this.injector });
      }
    });
  }

  buildPieChart(countries: string[], sumOfAllMedalsYears: number[]) {
    const pieChart = new Chart("DashboardPieChart", {
      type: 'pie',
      data: {
        labels: countries,
        datasets: [{
          label: 'Medals',
          data: sumOfAllMedalsYears,
          backgroundColor: ['#0b868f', '#adc3de', '#7a3c53', '#8f6263', 'orange', '#94819d'],
          hoverOffset: 4
        }],
      },
      options: {
        aspectRatio: 2.5,
        onClick: (e) => {
          if (e.native) {
            const points = pieChart.getElementsAtEventForMode(e.native, 'point', { intersect: true }, true)
            if (points.length) {
              const firstPoint = points[0];
              const countryName = pieChart.data.labels ? pieChart.data.labels[firstPoint.index] : '';
              void this.router.navigate(['country', countryName]).catch((error: unknown) => {
                this.errorHandler.handleError(error);
              });
            }
          }
        }
      }
    });
    this.pieChart = pieChart;
  }
}

