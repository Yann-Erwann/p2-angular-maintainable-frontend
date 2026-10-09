import { renderCharts } from '../testing/render-charts';
import { Chart } from 'chart.js';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom } from 'rxjs';
import { appConfig } from './app.config';
import type { Olympic } from './models/olympic';
import { CountryComponent } from './pages/country/country.component';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

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

describe('Country routing', () => {
  const url = './assets/mock/olympic.json';
  const countries: readonly Olympic[] = [
    {
      id: 1,
      country: 'France',
      participations: [
        { id: 1, year: 2012, city: 'London', medalsCount: 10, athleteCount: 100 },
        { id: 2, year: 2016, city: 'Rio', medalsCount: 20, athleteCount: 150 },
      ],
    },
    {
      id: 2,
      country: 'Italy',
      participations: [{ id: 1, year: 2020, city: 'Tokyo', medalsCount: 15, athleteCount: 120 }],
    },
  ];
  let http: HttpTestingController;
  let country: CountryComponent | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting(), provideLocationMocks()],
    });
    http = TestBed.inject(HttpTestingController);
    country = undefined;
  });

  afterEach(() => {
    http.verify();
  });

  it('should render a country when starting directly at its public URL', async () => {
    const harness = await RouterTestingHarness.create('/country/2');
    country = await harness.navigateByUrl('/country/2', CountryComponent);
    http.expectOne(url).flush(countries);
    harness.detectChanges();
    await renderCharts(harness.fixture);

    expect(countrySummary(country).name).toBe('Italy');
    expect(countrySummary(country).totalMedals).toBe(15);
    expect(chartAt(harness.routeNativeElement).data.labels).toEqual([2020]);
    expect(harness.routeNativeElement?.querySelector('.back-link')).toBeNull();
  });

  it('should replace statistics and the chart when reusing the country component', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl('/country/1', CountryComponent);
    http.expectOne(url).flush(countries);
    harness.detectChanges();
    await renderCharts(harness.fixture);
    const previousChart = chartAt(harness.routeNativeElement);
    const destroy = spyOn(previousChart, 'destroy').and.callThrough();

    const reused = await harness.navigateByUrl('/country/2', CountryComponent);
    expect(reused).toBe(country);
    http.expectNone(url);
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(countrySummary(country).name).toBe('Italy');
    expect(countrySummary(country).entries).toBe(1);
    expect(countrySummary(country).totalMedals).toBe(15);
    expect(countrySummary(country).athleteEntries).toBe(120);
    expect(chartAt(harness.routeNativeElement)).not.toBe(previousChart);
    expect(chartAt(harness.routeNativeElement).data.labels).toEqual([2020]);
    expect(chartAt(harness.routeNativeElement).data.datasets[0].data).toEqual([15]);
    expect(harness.routeNativeElement?.querySelector('app-header')?.textContent).not.toContain(
      'France',
    );
    http.expectNone(url);
  });

  it('should select the latest requested country when the response arrives after rapid navigation', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl('/country/1', CountryComponent);
    let request = http.expectOne(url);
    for (const id of [2, 1, 2]) {
      await harness.navigateByUrl(`/country/${id}`, CountryComponent);
      expect(request.cancelled).toBeTrue();
      request = http.expectOne(url);
    }
    expect(country.state().status).toBe('loading');
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();

    request.flush(countries);
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(countrySummary(country).name).toBe('Italy');
    expect(chartAt(harness.routeNativeElement).data.datasets[0].data).toEqual([15]);
    http.expectNone(url);
  });

  it('should recover on another ID after a failed country request', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl('/country/1', CountryComponent);
    http.expectOne(url).flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(country.state().status).toBe('error');
    expect(
      harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent?.trim(),
    ).toContain('temporarily unavailable');

    await harness.navigateByUrl('/country/2', CountryComponent);
    http.expectOne(url).flush(countries);
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(countrySummary(country).name).toBe('Italy');
    expect(document.title).toBe('Italy | Olympic Games');
    expect(country.state().status).toBe('success');
  });

  it('should redirect an absent ID to the not-found page and reuse cached data', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/country/5999', CountryComponent);
    http.expectOne(url).flush(countries);
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/not-found');
    expect(document.title).toBe('Page not found | Olympic Games');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Cette page n’existe pas',
    );
    await harness.navigateByUrl('/country/2', CountryComponent);
    http.expectNone(url);
  });

  it('should dispose chart instances across repeated page navigation', async () => {
    const harness = await RouterTestingHarness.create();
    for (let visit = 0; visit < 3; visit++) {
      await harness.navigateByUrl('/', HomeComponent);
      if (visit === 0) {
        http.expectOne(url).flush(countries);
      } else {
        http.expectNone(url);
      }
      harness.detectChanges();
      await renderCharts(harness.fixture);
      const pie = chartAt(harness.routeNativeElement);
      const pieCanvas = pie.canvas;
      const destroyPie = spyOn(pie, 'destroy').and.callThrough();

      country = await harness.navigateByUrl('/country/1', CountryComponent);
      expect(destroyPie).toHaveBeenCalledTimes(1);
      expect(Chart.getChart(pieCanvas)).toBeUndefined();
      http.expectNone(url);
      harness.detectChanges();
      await renderCharts(harness.fixture);
      const line = chartAt(harness.routeNativeElement);
      const lineCanvas = line.canvas;
      const destroyLine = spyOn(line, 'destroy').and.callThrough();

      await harness.navigateByUrl('/not-found', NotFoundComponent);
      expect(destroyLine).toHaveBeenCalledTimes(1);
      expect(Chart.getChart(lineCanvas)).toBeUndefined();
    }
  });

  for (const name of ['Unknown', '%20']) {
    it(`should remove the previous country's view for ${name} and recover on a valid route`, async () => {
      const harness = await RouterTestingHarness.create();
      country = await harness.navigateByUrl('/country/1', CountryComponent);
      http.expectOne(url).flush(countries);
      harness.detectChanges();
      await renderCharts(harness.fixture);

      await harness.navigateByUrl(`/country/${name}`, NotFoundComponent);
      expect(TestBed.inject(Router).url).toBe('/not-found');
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
        'Cette page n’existe pas',
      );
      expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();

      country = await harness.navigateByUrl('/country/2', CountryComponent);
      http.expectNone(url);
      harness.detectChanges();
      await renderCharts(harness.fixture);
      expect(countrySummary(country).name).toBe('Italy');
      expect(chartAt(harness.routeNativeElement).data.datasets[0].data).toEqual([15]);
      http.expectNone(url);
    });
  }

  it('should reject an unusable ID without requesting data', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/country/%20');
    await harness.fixture.whenStable();
    harness.detectChanges();
    http.expectNone(url);
    expect(TestBed.inject(Router).url).toBe('/not-found');
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(TestBed.inject(Router).url).toBe('/not-found');
  });

  it('should display country names with spaces and accents on an ID route', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl('/country/2', CountryComponent);
    http.expectOne(url).flush([{ ...countries[1], country: 'Côte d’Ivoire' }]);
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(countrySummary(country).name).toBe('Côte d’Ivoire');
    expect(countrySummary(country).totalMedals).toBe(15);
  });

  it('should recompute the country on browser back and forward navigation', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl('/country/1', CountryComponent);
    http.expectOne(url).flush(countries);
    harness.detectChanges();
    await renderCharts(harness.fixture);
    await harness.navigateByUrl('/country/2', CountryComponent);
    http.expectNone(url);
    harness.detectChanges();
    await renderCharts(harness.fixture);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    router.setUpLocationChangeListener();

    let navigation = firstValueFrom(
      router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    location.back();
    await navigation;
    harness.detectChanges();
    await renderCharts(harness.fixture);
    http.expectNone(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(router.url).toBe('/country/1');
    expect(countrySummary(country).name).toBe('France');
    expect(chartAt(harness.routeNativeElement).data.datasets[0].data).toEqual([10, 20]);

    navigation = firstValueFrom(
      router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    location.forward();
    await navigation;
    harness.detectChanges();
    await renderCharts(harness.fixture);
    http.expectNone(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(router.url).toBe('/country/2');
    expect(countrySummary(country).name).toBe('Italy');
    expect(chartAt(harness.routeNativeElement).data.datasets[0].data).toEqual([15]);
    http.expectNone(url);
  });

  it('should display an empty trailing country ID as not-found', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/country/');
    await harness.fixture.whenStable();
    harness.detectChanges();
    http.expectNone(url);
    harness.detectChanges();
    await renderCharts(harness.fixture);
    expect(TestBed.inject(Router).url).toBe('/not-found');
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('.back-link')).toBeNull();
  });

  for (const invalidUrl of ['/country', '/country/1/extra', '/unknown/nested']) {
    it(`should send ${invalidUrl} to the not-found page without a go-back link`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(invalidUrl, NotFoundComponent);
      expect(harness.routeNativeElement?.querySelector('.back-link')).toBeNull();
      await harness.navigateByUrl('/', HomeComponent);
      http.expectOne(url).flush([]);
      harness.detectChanges();
      await renderCharts(harness.fixture);
      expect(harness.routeNativeElement?.textContent).toContain('No Olympic data available.');
    });
  }
});
