import { afterNextRender, Component, inject, Injector, type OnInit } from '@angular/core';
import { ActivatedRoute, type ParamMap, RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';
import { HeaderComponent } from '../../olympics/header/header.component';
import type { PageState } from '../../olympics/page-state';
import { toDataLoadError } from '../../services/data-load-error';
import { DataService } from '../../services/data.service';


@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss'],
  imports: [RouterLink, HeaderComponent]
})
export class CountryComponent implements OnInit {
  public lineChart!: Chart<"line", number[], number>;
  public titlePage = '';
  public totalEntries = 0;
  public totalMedals = 0;
  public totalAthletes = 0;
  public error!: string;
  public state: PageState = { status: 'loading' };

  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(DataService);
  private readonly injector = inject(Injector);

  ngOnInit() {
    let countryName: string | null = null
    this.route.paramMap.subscribe((param: ParamMap) => countryName = param.get('countryName'));
    this.dataService.getOlympics().subscribe({
      next: (data) => {
        this.lineChart?.destroy();
        this.titlePage = '';
        this.totalEntries = 0;
        this.totalMedals = 0;
        this.totalAthletes = 0;
        if (data && data.length > 0) {
          const selectedCountry = data.find((i) => i.country === countryName);
          if (!selectedCountry) {
            this.state = { status: 'not-found' };
            return;
          }
          this.titlePage = selectedCountry.country;
          const participations = selectedCountry?.participations;
          this.totalEntries = participations?.length ?? 0;
          const years = selectedCountry?.participations.map((i) => i.year) ?? [];
          const medals = selectedCountry?.participations.map((i) => i.medalsCount) ?? [];
          this.totalMedals = medals.reduce((accumulator, item) => accumulator + item, 0);
          const nbAthletes = selectedCountry?.participations.map((i) => i.athleteCount) ?? []
          this.totalAthletes = nbAthletes.reduce((accumulator, item) => accumulator + item, 0);
          this.state = { status: participations.length > 0 ? 'success' : 'empty' };
          if (this.state.status === 'success') {
            afterNextRender(() => {
              if (this.state.status === 'success') {
                this.buildChart(years, medals);
              }
            }, { injector: this.injector });
          }
        } else {
          this.state = { status: 'empty' };
        }
      },
      error: (error: unknown) => {
        this.lineChart?.destroy();
        this.error = toDataLoadError(error).message;
        this.state = { status: 'error', message: this.error };
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
