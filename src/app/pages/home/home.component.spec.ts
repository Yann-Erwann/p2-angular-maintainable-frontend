import { renderCharts } from '../../../testing/render-charts';
import { Chart } from 'chart.js';
import { ChartRenderer } from '../../olympics/chart/chart-renderer.service';
import { HttpErrorResponse } from '@angular/common/http';
import { type ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { OlympicChartComponent } from '../../olympics/chart/chart.component';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';

import type { Olympic } from '../../models/olympic';
import { DataService } from '../../services/data.service';
import { HomeComponent } from './home.component';


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
  let dataService: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    data = new Subject<readonly Olympic[]>();
    dataService = jasmine.createSpyObj<DataService>('DataService', ['getOlympics']);
    dataService.getOlympics.and.returnValue(data.asObservable());
    await TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      imports: [HomeComponent],
      providers: [
        provideZoneChangeDetection(),
        provideRouter([]),
        { provide: DataService, useValue: dataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    data.complete();
  });

  it('should stop consuming data when destroyed', () => {
    expect(data.observed).toBeTrue();
    fixture.destroy();
    expect(data.observed).toBeFalse();
    data.next([]);
    expect(component.state.status).toBe('loading');
  });

  it('should cancel a pending chart render when destroyed', () => {
    const chartSpy = spyOn(TestBed.inject(ChartRenderer), 'create').and.callThrough();
    data.next([{ id: 1, country: 'France', participations: [] }]);
    fixture.destroy();
    TestBed.tick();
    expect(chartSpy).not.toHaveBeenCalled();
    expect(data.observed).toBeFalse();
  });

  it('should render only the latest response when several arrive before rendering', async () => {
    const chartSpy = spyOn(TestBed.inject(ChartRenderer), 'create').and.callThrough();
    data.next([{ id: 1, country: 'France', participations: [] }]);
    data.next([{ id: 2, country: 'Italy', participations: [] }]);
    fixture.detectChanges();
    await renderCharts(fixture);
    expect(chartSpy).toHaveBeenCalledTimes(1);
    expect(chartAt(fixture.nativeElement as HTMLElement).data.labels).toEqual(['Italy']);
    expect(component.totalCountries).toBe(1);
  });

  it('should expose data and keyboard links before the chart loads, including after a chunk failure', async () => {
    data.next([{ id: 1, country: 'France', participations: [] }]);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('canvas')).toBeNull();
    expect(page.querySelector('.chart-placeholder')?.getAttribute('aria-hidden')).toBe('true');
    expect(page.querySelector('tbody a')?.getAttribute('href')).toBe('/country/1');
    const [block] = await fixture.getDeferBlocks();
    await block.render(DeferBlockState.Loading);
    expect(page.querySelector('.chart-panel [role="status"]')?.textContent).toContain('Loading chart');
    await block.render(DeferBlockState.Error);
    expect(page.querySelector('.chart-panel [role="alert"]')?.textContent).toContain('Unable to load the chart');
    expect(page.querySelector('tbody a')?.getAttribute('href')).toBe('/country/1');
    expect(page.querySelector('app-header')).not.toBeNull();
  });

  it('should navigate when the isolated chart emits a country selection', async () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    data.next([{ id: 1, country: 'France', participations: [] }]);
    fixture.detectChanges();
    await renderCharts(fixture);
    const chart = fixture.debugElement.query(By.directive(OlympicChartComponent)).componentInstance as OlympicChartComponent;
    chart.pointSelected.emit(0);
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledOnceWith(['/country', 1]);
  });

  it('should navigate by ID for duplicate names and ignore invalid chart indices', async () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    data.next([
      { id: 1, country: 'France', participations: [] },
      { id: 5, country: 'France', participations: [] },
    ]);
    component.selectCountry(-1);
    component.selectCountry(2);
    expect(navigate).not.toHaveBeenCalled();
    component.selectCountry(1);
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledOnceWith(['/country', 5]);
  });

  it('should keep reporting navigation errors from country selection', async () => {
    const failure = new Error('Navigation failed');
    spyOn(TestBed.inject(Router), 'navigate').and.rejectWith(failure);
    const report = spyOn(TestBed.inject(ErrorHandler), 'handleError');
    data.next([{ id: 1, country: 'France', participations: [] }]);
    component.selectCountry(0);
    await fixture.whenStable();
    expect(report).toHaveBeenCalledOnceWith(failure);
  });

  it('should create', () => {
    data.next([]);
    expect(dataService.getOlympics.calls.count()).toBe(1);
    expect(component).toBeTruthy();
  });

  it('should render country and edition totals with the medal chart', async () => {
    const chartSpy = spyOn(TestBed.inject(ChartRenderer), 'create').and.callThrough();
    expect(dataService.getOlympics.calls.count()).toBe(1);
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
        participations: [
          { id: 1, year: 2012, city: 'London', medalsCount: 15, athleteCount: 120 },
        ],
      },
    ]);

    fixture.detectChanges();
    await renderCharts(fixture);

    expect(component.totalCountries).toBe(2);
    expect(component.totalJOs).toBe(2);
    expect(chartSpy).toHaveBeenCalledTimes(1);
    expect(chartAt(fixture.nativeElement as HTMLElement).data.labels).toEqual(['France', 'Italy']);
    expect(chartAt(fixture.nativeElement as HTMLElement).data.datasets[0].data).toEqual([30, 15]);

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('app-header .center > h2')?.textContent?.trim()).toBe('Medals per Country');
    expect(Array.from(page.querySelectorAll('app-header .split dt, app-header .split dd'), item => item.textContent?.trim())).toEqual([
      'Number of countries', '2', 'Number of JOs', '2',
    ]);
    expect(page.querySelector('canvas')).toBe(chartAt(fixture.nativeElement as HTMLElement).canvas);
    expect(Array.from(page.querySelectorAll('tbody tr'), row =>
      Array.from(row.querySelectorAll('th, td'), cell => cell.textContent?.trim()),
    )).toEqual([['France', '30'], ['Italy', '15']]);
    expect(Array.from(page.querySelectorAll('tbody a'), link => link.getAttribute('href'))).toEqual(['/country/1', '/country/2']);
    expect(page.querySelector('canvas')?.getAttribute('aria-describedby')).toBe(page.querySelector('caption')?.id);
    expect(page.querySelector('canvas')?.getAttribute('role')).toBe('img');
    expect(page.querySelectorAll('thead th[scope="col"]').length).toBe(2);
    expect(page.querySelectorAll('tbody th[scope="row"]').length).toBe(2);
  });

  it('should display loading without statistics or a chart before the response', () => {
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Loading Olympic data');
    expect(page.querySelector('app-header')).toBeNull();
    expect(page.querySelector('canvas')).toBeNull();
  });

  it('should distinguish an empty response from a loading or failure state', async () => {
    const chartSpy = spyOn(TestBed.inject(ChartRenderer), 'create').and.callThrough();
    data.next([]);
    fixture.detectChanges();
    await renderCharts(fixture);

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="status"]')?.textContent).toContain('No Olympic data available');
    expect(page.querySelector('[role="alert"]')?.textContent).toBe('');
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
      data.error(new HttpErrorResponse({ status: scenario.status, error: 'private server details' }));
      fixture.detectChanges();
    await renderCharts(fixture);

      const page = fixture.nativeElement as HTMLElement;
      expect(page.querySelector('[role="alert"]')?.textContent?.trim()).toBe(scenario.message);
      expect(page.textContent).not.toContain('private server details');
      expect(page.querySelector('app-header')).toBeNull();
      expect(page.querySelector('canvas')).toBeNull();
      expect(page.querySelector('a')?.getAttribute('href')).toBe('/');
    });
  }


  it('should remove previous statistics and the chart when loading fails after data was shown', async () => {
    data.next([{ id: 1, country: 'France', participations: [
      { id: 1, year: 2012, city: 'London', medalsCount: 10, athleteCount: 100 },
    ] }]);
    fixture.detectChanges();
    await renderCharts(fixture);
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('canvas')).not.toBeNull();

    data.error(new HttpErrorResponse({ status: 503 }));
    fixture.detectChanges();
    await renderCharts(fixture);

    expect(page.querySelector('[role="alert"]')?.textContent).toContain('temporarily unavailable');
    expect(page.querySelector('app-header')).toBeNull();
    expect(page.querySelector('canvas')).toBeNull();
  });

});
