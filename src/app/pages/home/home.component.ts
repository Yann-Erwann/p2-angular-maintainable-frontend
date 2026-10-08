import {afterNextRender, Component, ErrorHandler, inject, Injector, type OnInit} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';
import { HeaderComponent } from '../../olympics/header/header.component';
import type { PageState } from '../../olympics/page-state';
import { toDataLoadError } from '../../services/data-load-error';
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
  public totalCountries = 0
  public totalJOs = 0
  public error!:string
  public state: PageState = { status: 'loading' };
  titlePage = "Medals per Country";

  private readonly router = inject(Router);
  private readonly dataService = inject(DataService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly injector = inject(Injector);

  ngOnInit() {
    this.dataService.getOlympics().subscribe({
      next: (data) => {
        this.pieChart?.destroy();
        if (data && data.length > 0) {
          this.totalJOs = new Set(data.flatMap((i) => i.participations.map((f) => f.year)).flat()).size;
          const countries: string[] = data.map((i) => i.country);
          this.totalCountries = countries.length;
          const medals = data.map((i) => i.participations.map((i) => (i.medalsCount)));
          const sumOfAllMedalsYears = medals.map((i) => i.reduce((acc, i) => acc + i, 0));
          this.state = { status: 'success' };
          afterNextRender(() => {
            if (this.state.status === 'success') {
              this.buildPieChart(countries, sumOfAllMedalsYears);
            }
          }, { injector: this.injector });
        } else {
          this.totalCountries = 0;
          this.totalJOs = 0;
          this.state = { status: 'empty' };
        }
      },
      error: (error: unknown) => {
        this.pieChart?.destroy();
        this.error = toDataLoadError(error).message;
        this.state = { status: 'error', message: this.error };
      }
    })
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
                this.error = error instanceof Error ? error.message : String(error);
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

