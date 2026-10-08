import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { CountryComponent } from './country.component';

describe('CountryComponent', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CountryComponent],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should sum numeric counts and pass numeric medals to the chart', async () => {
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl(
      '/country/France',
      CountryComponent,
    );

    const chartSpy = spyOn(component, 'buildChart');

    const request = httpTesting.expectOne('./assets/mock/olympic.json');

    expect(request.request.method).toBe('GET');

    request.flush([
      {
        country: 'France',
        participations: [
          {
            id: 1,
            year: 2012,
            city: 'London',
            medalsCount: 10,
            athleteCount: 100,
          },
          {
            id: 2,
            year: 2016,
            city: 'Rio de Janeiro',
            medalsCount: 20,
            athleteCount: 150,
          },
        ],
      },
    ]);

    expect(component).toBeTruthy();
    expect(component.titlePage).toBe('France');
    expect(component.totalEntries).toBe(2);
    expect(component.totalMedals).toBe(30);
    expect(component.totalAthletes).toBe(250);
    expect(chartSpy).toHaveBeenCalledWith([2012, 2016], [10, 20]);
  });

  it('should keep totals at zero for a country without participations', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/country/France', CountryComponent);
    const chartSpy = spyOn(component, 'buildChart');

    httpTesting.expectOne('./assets/mock/olympic.json').flush([
      { id: 1, country: 'France', participations: [] },
    ]);

    expect(component.totalEntries).toBe(0);
    expect(component.totalMedals).toBe(0);
    expect(component.totalAthletes).toBe(0);
    expect(chartSpy).toHaveBeenCalledWith([], []);
  });
});
