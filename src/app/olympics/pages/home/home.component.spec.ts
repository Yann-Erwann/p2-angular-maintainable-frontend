import { afterEach, beforeEach, describe, expect, it, type MockedObject, vi } from 'vitest';
import { renderDeferredBlocks } from '../../../../testing/render-deferred-blocks';
import { Chart } from 'chart.js';
import { ChartRenderer } from '../../ui/chart/chart-renderer.service';
import { HttpErrorResponse } from '@angular/common/http';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { By } from '@angular/platform-browser';
import { OlympicChartComponent } from '../../ui/chart/chart.component';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';

import type { Olympic } from '../../models/olympic.model';
import { OlympicDataService } from '../../services/olympic-data.service';
import { HomeComponent } from './home.component';

function homeView(component: HomeComponent) {
  const state = component.state();
  if (state.status !== 'success') throw new Error('Expected loaded home data.');
  return state.data;
}

function chartAt(page: HTMLElement | null) {
  const canvas = page?.querySelector('canvas');
  const chart = canvas ? Chart.getChart(canvas) : undefined;
  if (!chart) {
    throw new Error('Expected a rendered chart on the page.');
  }
  return chart;
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let data: Subject<readonly Olympic[]>;
  let dataService: MockedObject<Pick<OlympicDataService, 'getOlympics'>>;

  beforeEach(async () => {
    data = new Subject<readonly Olympic[]>();
    dataService = {
      getOlympics: vi.fn().mockName('OlympicDataService.getOlympics'),
    };
    dataService.getOlympics.mockReturnValue(data.asObservable());
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), { provide: OlympicDataService, useValue: dataService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    data.complete();
  });

  it('should stop consuming data when destroyed', () => {
    expect(data.observed).toBe(true);
    fixture.destroy();
    expect(data.observed).toBe(false);
    data.next([]);
    expect(component.state().status).toBe('loading');
  });

  it('should cancel a pending chart render when destroyed', () => {
    const chartSpy = vi.spyOn(TestBed.inject(ChartRenderer), 'create');
    data.next([{ id: 1, country: 'France', participations: [] }]);
    fixture.destroy();
    TestBed.tick();
    expect(chartSpy).not.toHaveBeenCalled();
    expect(data.observed).toBe(false);
  });

  it('should render only the latest response when several arrive before rendering', async () => {
    const chartSpy = vi.spyOn(TestBed.inject(ChartRenderer), 'create');
    data.next([{ id: 1, country: 'France', participations: [] }]);
    data.next([{ id: 2, country: 'Italy', participations: [] }]);
    fixture.detectChanges();
    await renderDeferredBlocks(fixture);
    expect(chartSpy).toHaveBeenCalledTimes(1);
    expect(chartAt(fixture.nativeElement as HTMLElement).data.labels).toEqual(['Italy']);
    expect(homeView(component).rows).toHaveLength(1);
  });

  it('should render the home chart immediately after data arrives', async () => {
    data.next([{ id: 1, country: 'France', participations: [] }]);
    fixture.detectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('canvas')).not.toBeNull();
    expect(page.querySelector('.chart-placeholder')).toBeNull();
    expect(page.querySelector('#country-medals-description')?.textContent).toContain('France');
    expect(page.querySelector('app-header')).not.toBeNull();
  });

  it('should navigate when the isolated chart emits a country selection', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    data.next([{ id: 1, country: 'France', participations: [] }]);
    fixture.detectChanges();
    await renderDeferredBlocks(fixture);
    const chart = fixture.debugElement.query(By.directive(OlympicChartComponent))
      .componentInstance as OlympicChartComponent;
    chart.pointSelected.emit(0);
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/country', 1]);

    const canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas');
    canvas?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(vi.mocked(navigate).mock.lastCall).toEqual([['/country', 1]]);
  });

  it('should navigate by ID for duplicate names and ignore invalid chart indices', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    data.next([
      { id: 1, country: 'France', participations: [] },
      { id: 5, country: 'France', participations: [] },
    ]);
    component.selectCountry(-1);
    component.selectCountry(2);
    expect(navigate).not.toHaveBeenCalled();
    component.selectCountry(1);
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/country', 5]);
  });

  it('should keep reporting navigation errors from country selection', async () => {
    const failure = new Error('Navigation failed');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockRejectedValue(failure);
    const report = vi.spyOn(TestBed.inject(ErrorHandler), 'handleError');
    data.next([{ id: 1, country: 'France', participations: [] }]);
    component.selectCountry(0);
    await fixture.whenStable();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(failure);
  });

  it('should create', () => {
    data.next([]);
    expect(vi.mocked(dataService.getOlympics).mock.calls).toHaveLength(1);
    expect(component).toBeTruthy();
  });

  it('should render country and edition totals with the medal chart', async () => {
    const chartSpy = vi.spyOn(TestBed.inject(ChartRenderer), 'create');
    expect(vi.mocked(dataService.getOlympics).mock.calls).toHaveLength(1);
    data.next([
      {
        id: 1,
        country: 'France',
        participations: [
          { id: 1, year: 2012, city: 'London', medalsCount: 10, athleteCount: 100 },
          { id: 2, year: 2016, city: 'Rio de Janeiro', medalsCount: 20, athleteCount: 150 },
        ],
      },
      {
        id: 2,
        country: 'Italy',
        participations: [{ id: 1, year: 2012, city: 'London', medalsCount: 15, athleteCount: 120 }],
      },
    ]);

    fixture.detectChanges();
    await renderDeferredBlocks(fixture);

    expect(homeView(component).rows).toHaveLength(2);
    expect(homeView(component).indicators[1].value).toBe(2);
    expect(chartSpy).toHaveBeenCalledTimes(1);
    expect(chartAt(fixture.nativeElement as HTMLElement).data.labels).toEqual(['France', 'Italy']);
    expect(chartAt(fixture.nativeElement as HTMLElement).data.datasets[0].data).toEqual([30, 15]);

    const page = fixture.nativeElement as HTMLElement;
    expect(
      page.querySelector('app-header .results-header__heading > h2')?.textContent?.trim(),
    ).toBe('Olympic summary');
    expect(
      Array.from(
        page.querySelectorAll(
          'app-header .results-header__indicators dt, app-header .results-header__indicators dd',
        ),
        (item) => item.textContent?.trim(),
      ),
    ).toEqual(['Number of countries', '2', 'Number of JOs', '2']);
    expect(page.querySelector('canvas')).toBe(chartAt(fixture.nativeElement as HTMLElement).canvas);
    expect(
      Array.from(page.querySelectorAll('tbody tr'), (row) =>
        Array.from(row.querySelectorAll('th, td'), (cell) => cell.textContent?.trim()),
      ),
    ).toEqual([
      ['France', '30 medals', '66.7% of total'],
      ['Italy', '15 medals', '33.3% of total'],
    ]);
    const countryLinks = Array.from(
      page.querySelectorAll<HTMLAnchorElement>('tbody .medal-table__country-link'),
    );
    expect(countryLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/country/1',
      '/country/2',
    ]);
    expect(countryLinks.every((link) => link.tabIndex === 0)).toBe(true);
    expect(countryLinks[0].getAttribute('aria-describedby')).toBe(
      'country-medals-1 country-percentage-1',
    );
    expect(page.querySelectorAll('thead th[scope="col"]')).toHaveLength(3);
    expect(page.querySelector('#country-medals-description')?.textContent).toContain(
      'France: 30 medals.',
    );
    expect(page.querySelector('#country-medals-description')?.textContent).toContain(
      'Italy: 15 medals.',
    );
    expect(page.querySelector('canvas')?.getAttribute('aria-describedby')).toBe(
      'country-medals-description country-medals-description-keys',
    );
    expect(page.querySelector('canvas')?.getAttribute('role')).toBe('img');
    expect(page.querySelector('canvas')?.getAttribute('tabindex')).toBe('0');
  });

  it('should reserve the header and chart layout without displaying statistics before the response', () => {
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="status"]')?.textContent?.trim()).toContain(
      'Loading Olympic data',
    );
    expect(page.querySelector('app-header')).not.toBeNull();
    expect(
      Array.from(page.querySelectorAll('app-header dd'), (item) => item.textContent?.trim()),
    ).toEqual(['—', '—']);
    expect(page.querySelector('.chart-card')?.hasAttribute('hidden')).toBe(false);
    expect(page.querySelector('.chart-placeholder')).not.toBeNull();
    expect(page.querySelector('.loading-skeleton')).toBeNull();
    expect(page.querySelector('canvas')).toBeNull();
  });

  it('should distinguish an empty response from a loading or failure state', async () => {
    const chartSpy = vi.spyOn(TestBed.inject(ChartRenderer), 'create');
    data.next([]);
    fixture.detectChanges();
    await renderDeferredBlocks(fixture);

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="status"]')?.textContent?.trim()).toContain(
      'No Olympic data available',
    );
    expect(page.querySelector('[role="alert"]')?.textContent?.trim()).toBe('');
    expect(page.querySelector('app-header')).toBeNull();
    expect(page.querySelector('canvas')).toBeNull();
    expect(chartSpy).not.toHaveBeenCalled();
  });

  for (const scenario of [
    { status: 0, message: 'Unable to connect. Check your connection and try again.' },
    { status: 404, message: 'Olympic data could not be found.' },
    { status: 503, message: 'Olympic data is temporarily unavailable. Please try again later.' },
  ]) {
    it(`should display a safe error for HTTP status ${scenario.status}`, async () => {
      data.error(
        new HttpErrorResponse({ status: scenario.status, error: 'private server details' }),
      );
      fixture.detectChanges();
      await renderDeferredBlocks(fixture);

      const page = fixture.nativeElement as HTMLElement;
      expect(page.querySelector('[role="alert"]')?.textContent?.trim()).toBe(scenario.message);
      expect(page.textContent).not.toContain('private server details');
      expect(page.querySelector('app-header')).toBeNull();
      expect(page.querySelector('canvas')).toBeNull();
      expect(page.querySelector('.back-link')).toBeNull();
    });
  }

  it('should remove previous statistics and the chart when loading fails after data was shown', async () => {
    data.next([
      {
        id: 1,
        country: 'France',
        participations: [{ id: 1, year: 2012, city: 'London', medalsCount: 10, athleteCount: 100 }],
      },
    ]);
    fixture.detectChanges();
    await renderDeferredBlocks(fixture);
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('canvas')).not.toBeNull();

    data.error(new HttpErrorResponse({ status: 503 }));
    fixture.detectChanges();
    await renderDeferredBlocks(fixture);

    expect(page.querySelector('[role="alert"]')?.textContent?.trim()).toContain(
      'temporarily unavailable',
    );
    expect(page.querySelector('app-header')).toBeNull();
    expect(page.querySelector('canvas')).toBeNull();
  });

  it('should avoid invalid percentage values when no medals have been won', async () => {
    data.next([{ id: 1, country: 'France', participations: [] }]);
    fixture.detectChanges();
    await renderDeferredBlocks(fixture);
    expect(homeView(component).rows[0].percentage).toBe(0);
    expect((fixture.nativeElement as HTMLElement).querySelector('tbody tr')?.textContent).toContain(
      '0%',
    );
    expect(
      chartAt(fixture.nativeElement as HTMLElement).isPluginEnabled('dashboardMedalLabels'),
    ).toBe(true);
    expect(chartAt(fixture.nativeElement as HTMLElement).legend?.options.display).toBe(false);
  });
});
