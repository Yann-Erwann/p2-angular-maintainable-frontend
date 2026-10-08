import { HttpClient, type HttpErrorResponse } from '@angular/common/http';
import { Component, inject, type OnInit } from '@angular/core';
import { ActivatedRoute, type ParamMap, RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';
import type { Olympic } from '../../models/olympic';


@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss'],
  imports: [RouterLink]
})
export class CountryComponent implements OnInit {
  private readonly olympicUrl = './assets/mock/olympic.json';
  public lineChart!: Chart<"line", number[], number>;
  public titlePage = '';
  public totalEntries = 0;
  public totalMedals = 0;
  public totalAthletes = 0;
  public error!: string;

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  ngOnInit() {
    let countryName: string | null = null
    this.route.paramMap.subscribe((param: ParamMap) => countryName = param.get('countryName'));
    this.http.get<Olympic[]>(this.olympicUrl).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const selectedCountry = data.find((i) => i.country === countryName);
          if (!selectedCountry) {
            throw new Error(`Country not found: ${countryName}`);
          }
          this.titlePage = selectedCountry.country;
          const participations = selectedCountry?.participations;
          this.totalEntries = participations?.length ?? 0;
          const years = selectedCountry?.participations.map((i) => i.year) ?? [];
          const medals = selectedCountry?.participations.map((i) => i.medalsCount) ?? [];
          this.totalMedals = medals.reduce((accumulator, item) => accumulator + item, 0);
          const nbAthletes = selectedCountry?.participations.map((i) => i.athleteCount) ?? []
          this.totalAthletes = nbAthletes.reduce((accumulator, item) => accumulator + item, 0);
          this.buildChart(years, medals);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.message
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
