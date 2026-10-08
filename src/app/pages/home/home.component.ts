import {HttpClient, type HttpErrorResponse} from '@angular/common/http';
import {Component, type OnInit} from '@angular/core';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import type { Olympic } from '../../models/olympic';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
})
export class HomeComponent implements OnInit {
  private readonly olympicUrl = './assets/mock/olympic.json';
  public pieChart!: Chart<"pie", number[], string>;
  public totalCountries = 0
  public totalJOs = 0
  public error!:string
  titlePage = "Medals per Country";

  constructor(private readonly router: Router, private readonly http:HttpClient) { }

  ngOnInit() {
    this.http.get<Olympic[]>(this.olympicUrl).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.totalJOs = new Set(data.flatMap((i) => i.participations.map((f) => f.year)).flat()).size;
          const countries: string[] = data.map((i) => i.country);
          this.totalCountries = countries.length;
          const medals = data.map((i) => i.participations.map((i) => (i.medalsCount)));
          const sumOfAllMedalsYears = medals.map((i) => i.reduce((acc, i) => acc + i, 0));
          this.buildPieChart(countries, sumOfAllMedalsYears);
        }
      },
      error: (error:HttpErrorResponse) => {
        this.error = error.message
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
        onClick: async (e) => {
          if (e.native) {
            const points = pieChart.getElementsAtEventForMode(e.native, 'point', { intersect: true }, true)
            if (points.length) {
              const firstPoint = points[0];
              const countryName = pieChart.data.labels ? pieChart.data.labels[firstPoint.index] : '';
              await this.router.navigate(['country', countryName]);
            }
          }
        }
      }
    });
    this.pieChart = pieChart;
  }
}

