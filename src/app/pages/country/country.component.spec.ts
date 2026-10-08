import { TestBed } from '@angular/core/testing';
import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject } from 'rxjs';

import { routes } from '../../app.routes';

import type { Olympic } from '../../models/olympic';
import { DataService } from '../../services/data.service';
import { CountryComponent } from './country.component';

describe('CountryComponent', () => {
  let data: Subject<readonly Olympic[]>;
  let dataService: jasmine.SpyObj<DataService>;
  let component: CountryComponent;

  beforeEach(() => {
    data = new Subject<readonly Olympic[]>();
    dataService = jasmine.createSpyObj<DataService>('DataService', ['getOlympics']);
    dataService.getOlympics.and.returnValue(data.asObservable());
    TestBed.configureTestingModule({
      imports: [CountryComponent],
      providers: [
        provideZoneChangeDetection(),
        provideRouter(routes),
        { provide: DataService, useValue: dataService },
      ],
    });
  });

  afterEach(() => {
    component?.lineChart?.destroy();
    data.complete();
  });

  it('should render the requested country, its totals and numeric medal chart', async () => {
    const harness = await RouterTestingHarness.create();

    component = await harness.navigateByUrl(
      '/country/France',
      CountryComponent,
    );

    const chartSpy = spyOn(component, 'buildChart').and.callThrough();

    expect(dataService.getOlympics.calls.count()).toBe(1);
    data.next([
      {
        id: 2,
        country: 'Italy',
        participations: [
          { id: 1, year: 2012, city: 'London', medalsCount: 15, athleteCount: 120 },
        ],
      },
      {
        id: 1,
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
    expect(component.lineChart.data.labels).toEqual([2012, 2016]);
    expect(component.lineChart.data.datasets[0].data).toEqual([10, 20]);

    harness.detectChanges();
    const page = harness.routeNativeElement;
    expect(page?.querySelector('.center > div')?.textContent?.trim()).toBe('France');
    expect(Array.from(page?.querySelectorAll('.split p') ?? [], item => item.textContent?.trim())).toEqual([
      'Number of entries', '2',
      'Total Number of medals', '30',
      'Total Number of athletes', '250',
    ]);
    expect(page?.querySelector('canvas')).toBe(component.lineChart.canvas);
    expect(page?.querySelector('a')?.textContent?.trim()).toBe('Go back');
    expect(page?.querySelector('a')?.getAttribute('href')).toBe('/');
  });

  it('should keep totals at zero for a country without participations', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/France', CountryComponent);
    const chartSpy = spyOn(component, 'buildChart');

    data.next([
      { id: 1, country: 'France', participations: [] },
    ]);

    expect(component.totalEntries).toBe(0);
    expect(component.totalMedals).toBe(0);
    expect(component.totalAthletes).toBe(0);
    expect(chartSpy).toHaveBeenCalledWith([], []);
  });
});
