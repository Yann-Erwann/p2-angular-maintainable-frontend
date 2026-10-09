import { renderCharts } from '../../../testing/render-charts';
import { Chart } from 'chart.js';
import { ChartRenderer } from '../../olympics/chart/chart-renderer.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { map, of, Subject } from 'rxjs';

import { routes } from '../../app.routes';

import type { Olympic } from '../../models/olympic';
import { DataService } from '../../services/data.service';
import { CountryComponent } from './country.component';


function chartAt(page: HTMLElement | null) {
  const canvas = page?.querySelector('canvas');
  const chart = canvas ? Chart.getChart(canvas) : undefined;
  if (!chart) {
    throw new Error('Expected a rendered chart on the page.');
  }
  return chart;
}

describe('CountryComponent', () => {
  let data: Subject<readonly Olympic[]>;
  let dataService: jasmine.SpyObj<DataService>;
  let component: CountryComponent;

  beforeEach(() => {
    data = new Subject<readonly Olympic[]>();
    dataService = jasmine.createSpyObj<DataService>('DataService', ['getCountryById']);
    dataService.getCountryById.and.callFake(id => data.pipe(map(countries => countries.find(country => country.id === id))));
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
    data.complete();
  });

  it('should stop consuming route and data changes after leaving the page', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);
    const chartSpy = spyOn(TestBed.inject(ChartRenderer), 'create').and.callThrough();
    expect(data.observed).toBeTrue();

    await harness.navigateByUrl('/not-found');
    expect(data.observed).toBeFalse();
    data.next([{ id: 1, country: 'France', participations: [] }]);
    expect(component.state.status).toBe('loading');
    expect(chartSpy).not.toHaveBeenCalled();
  });

  it('should derive the selected country from new route parameters after the response completes', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);
    data.next([
      { id: 1, country: 'France', participations: [] },
      { id: 2, country: 'Italy', participations: [] },
    ]);
    data.complete();
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(component.titlePage).toBe('France');

    dataService.getCountryById.and.returnValue(of({ id: 2, country: 'Italy', participations: [] }));
    const reused = await harness.navigateByUrl('/country/2', CountryComponent);
    expect(reused).toBe(component);
    expect(component.titlePage).toBe('Italy');
    expect(dataService.getCountryById.calls.allArgs()).toEqual([[1], [2]]);
    expect(harness.routeNativeElement?.querySelector('app-header')?.textContent).toContain('Italy');
  });

  it('should render the requested country, its totals and numeric medal chart', async () => {
    const harness = await RouterTestingHarness.create();

    component = await harness.navigateByUrl(
      '/country/1',
      CountryComponent,
    );

    const chartSpy = spyOn(TestBed.inject(ChartRenderer), 'create').and.callThrough();

    expect(dataService.getCountryById.calls.count()).toBe(1);
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
    await renderCharts(harness.fixture);

    expect(component).toBeTruthy();
    expect(component.titlePage).toBe('France');
    expect(component.totalEntries).toBe(2);
    expect(component.totalMedals).toBe(30);
    expect(component.totalAthletes).toBe(250);
    expect(chartSpy).toHaveBeenCalledTimes(1);
    expect(chartAt(harness.routeNativeElement).data.labels).toEqual([2012, 2016]);
    expect(chartAt(harness.routeNativeElement).data.datasets[0].data).toEqual([10, 20]);

    const page = harness.routeNativeElement;
    expect(page?.querySelector('app-header .center > h2')?.textContent?.trim()).toBe('France');
    expect(Array.from(page?.querySelectorAll('app-header .split dt, app-header .split dd') ?? [], item => item.textContent?.trim())).toEqual([
      'Number of entries', '2',
      'Total Number of medals', '30',
      'Total Number of athletes', '250',
    ]);
    expect(page?.querySelector('canvas')).toBe(chartAt(harness.routeNativeElement).canvas);
    expect(page?.querySelector('.back-link')).toBeNull();
    expect(Array.from(page?.querySelectorAll('tbody tr') ?? [], row =>
      Array.from(row.querySelectorAll('th, td'), cell => cell.textContent?.trim()),
    )).toEqual([
      ['2012', 'London', '10', '100'],
      ['2016', 'Rio de Janeiro', '20', '150'],
    ]);
    expect(page?.querySelector('canvas')?.getAttribute('aria-describedby')).toBe(page?.querySelector('caption')?.id + ' ' + page?.querySelector('caption')?.id + '-keys');
    expect(page?.querySelectorAll('thead th[scope="col"]').length).toBe(4);
  });

  it('should keep totals at zero for a country without participations', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);
    const chartSpy = spyOn(TestBed.inject(ChartRenderer), 'create').and.callThrough();

    data.next([
      { id: 1, country: 'France', participations: [] },
    ]);

    expect(component.totalEntries).toBe(0);
    expect(component.totalMedals).toBe(0);
    expect(component.totalAthletes).toBe(0);
    expect(chartSpy).not.toHaveBeenCalled();
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(harness.routeNativeElement?.querySelector('app-header')?.textContent).toContain('France');
    expect(Array.from(harness.routeNativeElement?.querySelectorAll('.split dt, .split dd') ?? [], item => item.textContent?.trim())).toEqual([
      'Number of entries', '0', 'Total Number of medals', '0', 'Total Number of athletes', '0',
    ]);
    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent).toContain('No Olympic data available');
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

  it('should display loading before country data arrives', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);

    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent).toContain('Loading Olympic data');
    expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

  it('should report a missing country for an empty collection', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);
    data.next([]);
    harness.detectChanges();
    await renderCharts(harness.fixture);

    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent).toContain('Country not found.');
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toBe('');
    expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

  it('should distinguish a missing country from an HTTP failure', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/999', CountryComponent);
    data.next([{ id: 1, country: 'France', participations: [] }]);
    harness.detectChanges();
    await renderCharts(harness.fixture);

    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent?.trim()).toBe('Country not found.');
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toBe('');
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
      component = await harness.navigateByUrl('/country/1', CountryComponent);
      data.error(new HttpErrorResponse({ status: scenario.status, error: 'private server details' }));
      harness.detectChanges();
    await renderCharts(harness.fixture);

      expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent?.trim()).toBe(scenario.message);
      expect(harness.routeNativeElement?.textContent).not.toContain('private server details');
      expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('.back-link')).toBeNull();
    });
  }


  it('should remove previous country statistics and the chart when data loading fails', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);
    data.next([{ id: 1, country: 'France', participations: [
      { id: 1, year: 2012, city: 'London', medalsCount: 10, athleteCount: 100 },
    ] }]);
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(harness.routeNativeElement?.querySelector('canvas')).not.toBeNull();

    data.error(new HttpErrorResponse({ status: 503 }));
    harness.detectChanges();
    await renderCharts(harness.fixture);

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain('temporarily unavailable');
    expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

});
