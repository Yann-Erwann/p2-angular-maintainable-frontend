import { HttpErrorResponse } from '@angular/common/http';
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

    harness.detectChanges();

    expect(component).toBeTruthy();
    expect(component.titlePage).toBe('France');
    expect(component.totalEntries).toBe(2);
    expect(component.totalMedals).toBe(30);
    expect(component.totalAthletes).toBe(250);
    expect(chartSpy).toHaveBeenCalledWith([2012, 2016], [10, 20]);
    expect(component.lineChart.data.labels).toEqual([2012, 2016]);
    expect(component.lineChart.data.datasets[0].data).toEqual([10, 20]);

    const page = harness.routeNativeElement;
    expect(page?.querySelector('app-header .center > div')?.textContent?.trim()).toBe('France');
    expect(Array.from(page?.querySelectorAll('app-header .split p') ?? [], item => item.textContent?.trim())).toEqual([
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
    expect(chartSpy).not.toHaveBeenCalled();
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('app-header')?.textContent).toContain('France');
    expect(Array.from(harness.routeNativeElement?.querySelectorAll('.split p') ?? [], item => item.textContent?.trim())).toEqual([
      'Number of entries', '0', 'Total Number of medals', '0', 'Total Number of athletes', '0',
    ]);
    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent).toContain('No Olympic data available');
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

  it('should display loading before country data arrives', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/France', CountryComponent);

    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent).toContain('Loading Olympic data');
    expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

  it('should display an empty collection without a country header or chart', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/France', CountryComponent);
    data.next([]);
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent).toContain('No Olympic data available');
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

  it('should distinguish a missing country from an HTTP failure', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/Unknown', CountryComponent);
    data.next([{ id: 1, country: 'France', participations: [] }]);
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent?.trim()).toBe('Country not found.');
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

  for (const scenario of [
    { status: 0, message: 'Unable to connect. Check your connection and try again.' },
    { status: 404, message: 'Olympic data could not be found.' },
    { status: 503, message: 'Olympic data is temporarily unavailable. Please try again later.' },
  ]) {
    it(`should display a safe error for HTTP status ${scenario.status}`, async () => {
      const harness = await RouterTestingHarness.create();
      component = await harness.navigateByUrl('/country/France', CountryComponent);
      data.error(new HttpErrorResponse({ status: scenario.status, error: 'private server details' }));
      harness.detectChanges();

      expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent?.trim()).toBe(scenario.message);
      expect(harness.routeNativeElement?.textContent).not.toContain('private server details');
      expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/');
    });
  }


  it('should remove previous country statistics and the chart when data loading fails', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/France', CountryComponent);
    data.next([{ id: 1, country: 'France', participations: [
      { id: 1, year: 2012, city: 'London', medalsCount: 10, athleteCount: 100 },
    ] }]);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('canvas')).not.toBeNull();

    data.error(new HttpErrorResponse({ status: 503 }));
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain('temporarily unavailable');
    expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

});
