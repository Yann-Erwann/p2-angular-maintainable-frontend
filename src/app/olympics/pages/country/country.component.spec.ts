import { renderDeferredBlocks } from '../../../../testing/render-deferred-blocks';
import { Chart } from 'chart.js';
import { ChartRenderer } from '../../ui/chart/chart-renderer.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideZoneChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, ReplaySubject } from 'rxjs';

import { routes } from '../../../app.routes';

import type { Olympic } from '../../models/olympic.model';
import { OlympicDataService } from '../../services/olympic-data.service';
import { CountryComponent } from './country.component';

function countrySummary(component: CountryComponent) {
  const state = component.state();
  if (state.status !== 'success' && state.status !== 'empty')
    throw new Error('Expected a loaded country.');
  return state.data.summary;
}

function chartAt(page: HTMLElement | null) {
  const canvas = page?.querySelector('canvas');
  const chart = canvas ? Chart.getChart(canvas) : undefined;
  if (!chart) {
    throw new Error('Expected a rendered chart on the page.');
  }
  return chart;
}

describe('CountryComponent', () => {
  let data: ReplaySubject<readonly Olympic[]>;
  let dataService: jasmine.SpyObj<OlympicDataService>;
  let component: CountryComponent;

  beforeEach(() => {
    data = new ReplaySubject<readonly Olympic[]>(1);
    dataService = jasmine.createSpyObj<OlympicDataService>('OlympicDataService', ['getOlympics']);
    dataService.getOlympics.and.returnValue(data.asObservable());
    TestBed.configureTestingModule({
      imports: [CountryComponent],
      providers: [
        provideZoneChangeDetection(),
        provideRouter(routes),
        { provide: OlympicDataService, useValue: dataService },
      ],
    });
  });

  afterEach(() => {
    data.complete();
  });

  it('should select the current country and navigate to another country using the dropdown', async () => {
    const countries: readonly Olympic[] = [
      { id: 2, country: 'Italy', participations: [] },
      { id: 5, country: 'France', participations: [] },
    ];
    dataService.getOlympics.and.returnValue(of(countries));
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/5', CountryComponent);
    data.next(countries);
    harness.detectChanges();
    const trigger = harness.routeNativeElement!.querySelector<HTMLButtonElement>(
      '.country-picker__trigger',
    )!;
    expect(trigger.textContent).toContain('France');
    expect(trigger.disabled).toBeFalse();
    expect(
      harness.routeNativeElement!.querySelector('.country-picker__dropdown')?.textContent,
    ).not.toContain('France');
    expect(
      harness.routeNativeElement
        ?.querySelector('.country-picker__flag')
        ?.classList.contains('country-picker__flag--fr'),
    ).toBeTrue();
    const options =
      harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('.country-picker__option');
    options[0].click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(countrySummary(component).name).toBe('Italy');
    expect(trigger.textContent).toContain('Italy');
    expect(
      harness.routeNativeElement!.querySelector('.country-picker__dropdown')?.textContent,
    ).not.toContain('Italy');
    expect(
      harness.routeNativeElement
        ?.querySelector('.country-picker__flag')
        ?.classList.contains('country-picker__flag--it'),
    ).toBeTrue();
    expect(dataService.getOlympics.calls.count()).toBe(2);
  });

  it('should stop consuming route and data changes after leaving the page', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);
    const chartSpy = spyOn(TestBed.inject(ChartRenderer), 'create').and.callThrough();
    expect(data.observed).toBeTrue();

    await harness.navigateByUrl('/not-found');
    expect(data.observed).toBeFalse();
    data.next([{ id: 1, country: 'France', participations: [] }]);
    expect(component.state().status).toBe('loading');
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
    await renderDeferredBlocks(harness.fixture);
    expect(countrySummary(component).name).toBe('France');

    const reused = await harness.navigateByUrl('/country/2', CountryComponent);
    expect(reused).toBe(component);
    expect(countrySummary(component).name).toBe('Italy');
    expect(dataService.getOlympics.calls.count()).toBe(2);
    expect(harness.routeNativeElement?.querySelector('app-header')?.textContent).toContain('Italy');
  });

  it('should render the requested country, its totals and numeric medal chart', async () => {
    const harness = await RouterTestingHarness.create();

    component = await harness.navigateByUrl('/country/1', CountryComponent);

    const chartSpy = spyOn(TestBed.inject(ChartRenderer), 'create').and.callThrough();

    expect(dataService.getOlympics.calls.count()).toBe(1);
    data.next([
      {
        id: 2,
        country: 'Italy',
        participations: [{ id: 1, year: 2012, city: 'London', medalsCount: 15, athleteCount: 120 }],
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
    await renderDeferredBlocks(harness.fixture);

    expect(component).toBeTruthy();
    expect(countrySummary(component).name).toBe('France');
    expect(countrySummary(component).entries).toBe(2);
    expect(countrySummary(component).totalMedals).toBe(30);
    expect(countrySummary(component).athleteEntries).toBe(250);
    expect(chartSpy).toHaveBeenCalledTimes(1);
    expect(chartAt(harness.routeNativeElement).data.labels).toEqual([2012, 2016]);
    expect(chartAt(harness.routeNativeElement).data.datasets[0].data).toEqual([10, 20]);

    const page = harness.routeNativeElement;
    expect(
      page?.querySelector('app-header .results-header__heading > h2')?.textContent?.trim(),
    ).toBe('France');
    expect(
      Array.from(
        page?.querySelectorAll(
          'app-header .results-header__indicators dt, app-header .results-header__indicators dd',
        ) ?? [],
        (item) => item.textContent?.trim(),
      ),
    ).toEqual([
      'Number of entries',
      '2',
      'Total Number of medals',
      '30',
      'Total Number of athletes',
      '250',
    ]);
    expect(page?.querySelector('canvas')).toBe(chartAt(harness.routeNativeElement).canvas);
    expect(page?.querySelector('.back-link')).toBeNull();
    expect(page?.querySelector('table')).toBeNull();
    const description = page
      ?.querySelector('#participation-description')
      ?.textContent?.replace(/\s+/g, ' ')
      .trim();
    expect(description).toContain('2012, London: 10 medals, 100 athletes.');
    expect(description).toContain('2016, Rio de Janeiro: 20 medals, 150 athletes.');
    expect(page?.querySelector('canvas')?.getAttribute('aria-describedby')).toBe(
      'participation-description participation-description-keys',
    );
  });

  it('should keep totals at zero for a country without participations', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);
    const chartSpy = spyOn(TestBed.inject(ChartRenderer), 'create').and.callThrough();

    data.next([{ id: 1, country: 'France', participations: [] }]);

    expect(countrySummary(component).entries).toBe(0);
    expect(countrySummary(component).totalMedals).toBe(0);
    expect(countrySummary(component).athleteEntries).toBe(0);
    expect(chartSpy).not.toHaveBeenCalled();
    harness.detectChanges();
    await renderDeferredBlocks(harness.fixture);
    expect(harness.routeNativeElement?.querySelector('app-header')?.textContent).toContain(
      'France',
    );
    expect(
      Array.from(
        harness.routeNativeElement?.querySelectorAll(
          '.results-header__indicators dt, .results-header__indicators dd',
        ) ?? [],
        (item) => item.textContent?.trim(),
      ),
    ).toEqual([
      'Number of entries',
      '0',
      'Total Number of medals',
      '0',
      'Total Number of athletes',
      '0',
    ]);
    expect(
      harness.routeNativeElement?.querySelector('[role="status"]')?.textContent?.trim(),
    ).toContain('No Olympic data available');
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

  it('should display loading before country data arrives', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);

    expect(
      harness.routeNativeElement?.querySelector('[role="status"]')?.textContent?.trim(),
    ).toContain('Loading Olympic data');
    expect(harness.routeNativeElement?.querySelector('app-header')).not.toBeNull();
    expect(
      Array.from(harness.routeNativeElement?.querySelectorAll('app-header dd') ?? [], (item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['—', '—', '—']);
    expect(
      harness.routeNativeElement?.querySelector<HTMLButtonElement>('.country-picker__trigger')
        ?.disabled,
    ).toBeTrue();
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

  it('should redirect an empty collection to the not-found page', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);
    data.next([]);
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/not-found');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Cette page n’existe pas',
    );
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });

  it('should distinguish a missing country from an HTTP failure', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/999', CountryComponent);
    data.next([{ id: 1, country: 'France', participations: [] }]);
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/not-found');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Cette page n’existe pas',
    );
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
      component = await harness.navigateByUrl('/country/1', CountryComponent);
      data.error(
        new HttpErrorResponse({ status: scenario.status, error: 'private server details' }),
      );
      harness.detectChanges();
      await renderDeferredBlocks(harness.fixture);

      expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
        scenario.message,
      );
      expect(harness.routeNativeElement?.textContent).not.toContain('private server details');
      expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('.back-link')).toBeNull();
    });
  }

  it('should remove previous country statistics and the chart when data loading fails', async () => {
    const harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl('/country/1', CountryComponent);
    data.next([
      {
        id: 1,
        country: 'France',
        participations: [{ id: 1, year: 2012, city: 'London', medalsCount: 10, athleteCount: 100 }],
      },
    ]);
    harness.detectChanges();
    await renderDeferredBlocks(harness.fixture);
    expect(harness.routeNativeElement?.querySelector('canvas')).not.toBeNull();

    data.error(new HttpErrorResponse({ status: 503 }));
    harness.detectChanges();
    await renderDeferredBlocks(harness.fixture);

    expect(
      harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent?.trim(),
    ).toContain('temporarily unavailable');
    expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
  });
});
