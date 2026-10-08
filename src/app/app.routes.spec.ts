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

describe('Country routing', () => {
  const url = './assets/mock/olympic.json';
  const countries: readonly Olympic[] = [
    { id: 1, country: 'France', participations: [
      { id: 1, year: 2012, city: 'London', medalsCount: 10, athleteCount: 100 },
      { id: 2, year: 2016, city: 'Rio', medalsCount: 20, athleteCount: 150 },
    ] },
    { id: 2, country: 'Italy', participations: [
      { id: 1, year: 2020, city: 'Tokyo', medalsCount: 15, athleteCount: 120 },
    ] },
  ];
  let http: HttpTestingController;
  let country: CountryComponent | undefined;
  let home: HomeComponent | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting(), provideLocationMocks()],
    });
    http = TestBed.inject(HttpTestingController);
    country = undefined;
    home = undefined;
  });

  afterEach(() => {
    country?.lineChart?.destroy();
    home?.pieChart?.destroy();
    http.verify();
  });

  it('should render a country when starting directly at its public URL', async () => {
    const harness = await RouterTestingHarness.create('/country/Italy');
    country = await harness.navigateByUrl('/country/Italy', CountryComponent);
    http.expectOne(url).flush(countries);
    harness.detectChanges();

    expect(country.titlePage).toBe('Italy');
    expect(country.totalMedals).toBe(15);
    expect(country.lineChart.data.labels).toEqual([2020]);
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/');
  });

  it('should replace statistics and the chart when reusing the country component', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl('/country/France', CountryComponent);
    http.expectOne(url).flush(countries);
    harness.detectChanges();
    const previousChart = country.lineChart;
    const destroy = spyOn(previousChart, 'destroy').and.callThrough();

    const reused = await harness.navigateByUrl('/country/Italy', CountryComponent);
    expect(reused).toBe(country);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(country.titlePage).toBe('Italy');
    expect(country.totalEntries).toBe(1);
    expect(country.totalMedals).toBe(15);
    expect(country.totalAthletes).toBe(120);
    expect(country.lineChart).not.toBe(previousChart);
    expect(country.lineChart.data.labels).toEqual([2020]);
    expect(country.lineChart.data.datasets[0].data).toEqual([15]);
    expect(harness.routeNativeElement?.querySelector('app-header')?.textContent).not.toContain('France');
    http.expectNone(url);
  });

  it('should select the latest requested country when the response arrives after rapid navigation', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl('/country/France', CountryComponent);
    const request = http.expectOne(url);
    await harness.navigateByUrl('/country/Italy', CountryComponent);
    await harness.navigateByUrl('/country/France', CountryComponent);
    await harness.navigateByUrl('/country/Italy', CountryComponent);
    expect(country.state.status).toBe('loading');
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();

    request.flush(countries);
    harness.detectChanges();
    expect(country.titlePage).toBe('Italy');
    expect(country.lineChart.data.datasets[0].data).toEqual([15]);
    http.expectNone(url);
  });

  for (const name of ['Unknown', '%20']) {
    it(`should remove the previous country's view for ${name} and recover on a valid route`, async () => {
      const harness = await RouterTestingHarness.create();
      country = await harness.navigateByUrl('/country/France', CountryComponent);
      http.expectOne(url).flush(countries);
      harness.detectChanges();

      await harness.navigateByUrl(`/country/${name}`, CountryComponent);
      expect(country.state.status).toBe('not-found');
      expect(country.titlePage).toBe('');
      expect(country.totalMedals).toBe(0);
      expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent?.trim()).toBe('Country not found.');
      expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();

      await harness.navigateByUrl('/country/Italy', CountryComponent);
      expect(country.titlePage).toBe('Italy');
      expect(country.lineChart.data.datasets[0].data).toEqual([15]);
      http.expectNone(url);
    });
  }

  it('should display an unusable name before the HTTP response arrives', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl('/country/%20', CountryComponent);
    const request = http.expectOne(url);
    expect(country.state.status).toBe('not-found');
    request.flush([]);
    harness.detectChanges();
    expect(country.state.status).toBe('not-found');
  });

  it('should decode names with spaces and accents without changing the URL contract', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl(`/country/${encodeURIComponent('Côte d’Ivoire')}`, CountryComponent);
    http.expectOne(url).flush([{ ...countries[1], country: 'Côte d’Ivoire' }]);
    harness.detectChanges();
    expect(country.titlePage).toBe('Côte d’Ivoire');
    expect(country.totalMedals).toBe(15);
  });

  it('should recompute the country on browser back and forward navigation', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl('/country/France', CountryComponent);
    http.expectOne(url).flush(countries);
    harness.detectChanges();
    await harness.navigateByUrl('/country/Italy', CountryComponent);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    router.setUpLocationChangeListener();

    let navigation = firstValueFrom(router.events.pipe(filter((event) => event instanceof NavigationEnd)));
    location.back();
    await navigation;
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/country/France');
    expect(country.titlePage).toBe('France');
    expect(country.lineChart.data.datasets[0].data).toEqual([10, 20]);

    navigation = firstValueFrom(router.events.pipe(filter((event) => event instanceof NavigationEnd)));
    location.forward();
    await navigation;
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/country/Italy');
    expect(country.titlePage).toBe('Italy');
    expect(country.lineChart.data.datasets[0].data).toEqual([15]);
    http.expectNone(url);
  });

  it('should display an empty trailing country name as not-found', async () => {
    const harness = await RouterTestingHarness.create();
    country = await harness.navigateByUrl('/country/', CountryComponent);
    http.expectOne(url).flush(countries);
    harness.detectChanges();
    expect(country.state.status).toBe('not-found');
    expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/');
  });

  for (const invalidUrl of ['/country', '/country/France/extra', '/unknown/nested']) {
    it(`should send ${invalidUrl} to the not-found page with a working home link`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(invalidUrl, NotFoundComponent);
      const link = harness.routeNativeElement?.querySelector('a');
      expect(link?.getAttribute('href')).toBe('/');
      link?.click();
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/');
      home = await harness.navigateByUrl('/', HomeComponent);
      http.expectOne(url).flush([]);
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('No Olympic data available.');
    });
  }
});
