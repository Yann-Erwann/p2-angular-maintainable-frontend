import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { CountryComponent } from './country.component';

describe('CountryComponent', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CountryComponent],
      providers: [
        provideRouter([
          {
            path: 'country/:countryName',
            component: CountryComponent,
          },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', async () => {
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl(
      '/country/France',
      CountryComponent,
    );

    spyOn(component, 'buildChart');

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
        ],
      },
    ]);

    expect(component).toBeTruthy();
  });
});