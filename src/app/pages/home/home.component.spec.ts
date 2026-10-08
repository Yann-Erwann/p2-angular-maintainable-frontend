import { HttpErrorResponse } from '@angular/common/http';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import type { Olympic } from '../../models/olympic';
import { DataService } from '../../services/data.service';
import { HomeComponent } from './home.component';

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
    component.pieChart?.destroy();
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
    const chartSpy = spyOn(component, 'buildPieChart');
    data.next([{ id: 1, country: 'France', participations: [] }]);
    fixture.destroy();
    TestBed.tick();
    expect(chartSpy).not.toHaveBeenCalled();
    expect(data.observed).toBeFalse();
  });

  it('should render only the latest response when several arrive before rendering', () => {
    const chartSpy = spyOn(component, 'buildPieChart');
    data.next([{ id: 1, country: 'France', participations: [] }]);
    data.next([{ id: 2, country: 'Italy', participations: [] }]);
    fixture.detectChanges();
    expect(chartSpy).toHaveBeenCalledOnceWith(['Italy'], [0]);
    expect(component.totalCountries).toBe(1);
  });

  it('should create', () => {
    data.next([]);
    expect(dataService.getOlympics.calls.count()).toBe(1);
    expect(component).toBeTruthy();
  });

  it('should render country and edition totals with the medal chart', () => {
    const chartSpy = spyOn(component, 'buildPieChart').and.callThrough();
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

    expect(component.totalCountries).toBe(2);
    expect(component.totalJOs).toBe(2);
    expect(chartSpy).toHaveBeenCalledWith(['France', 'Italy'], [30, 15]);
    expect(component.pieChart.data.labels).toEqual(['France', 'Italy']);
    expect(component.pieChart.data.datasets[0].data).toEqual([30, 15]);

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('app-header .center > div')?.textContent?.trim()).toBe('Medals per Country');
    expect(Array.from(page.querySelectorAll('app-header .split p'), item => item.textContent?.trim())).toEqual([
      'Number of countries', '2', 'Number of JOs', '2',
    ]);
    expect(page.querySelector('canvas')).toBe(component.pieChart.canvas);
  });

  it('should display loading without statistics or a chart before the response', () => {
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Loading Olympic data');
    expect(page.querySelector('app-header')).toBeNull();
    expect(page.querySelector('canvas')).toBeNull();
  });

  it('should distinguish an empty response from a loading or failure state', () => {
    const chartSpy = spyOn(component, 'buildPieChart');
    data.next([]);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="status"]')?.textContent).toContain('No Olympic data available');
    expect(page.querySelector('[role="alert"]')).toBeNull();
    expect(page.querySelector('app-header')).toBeNull();
    expect(page.querySelector('canvas')).toBeNull();
    expect(chartSpy).not.toHaveBeenCalled();
  });

  for (const scenario of [
    { status: 0, message: 'Unable to connect. Check your connection and try again.' },
    { status: 404, message: 'Olympic data could not be found.' },
    { status: 503, message: 'Olympic data is temporarily unavailable. Please try again later.' },
  ]) {
    it(`should display a safe error for HTTP status ${scenario.status}`, () => {
      data.error(new HttpErrorResponse({ status: scenario.status, error: 'private server details' }));
      fixture.detectChanges();

      const page = fixture.nativeElement as HTMLElement;
      expect(page.querySelector('[role="alert"]')?.textContent?.trim()).toBe(scenario.message);
      expect(page.textContent).not.toContain('private server details');
      expect(page.querySelector('app-header')).toBeNull();
      expect(page.querySelector('canvas')).toBeNull();
      expect(page.querySelector('a')?.getAttribute('href')).toBe('/');
    });
  }


  it('should remove previous statistics and the chart when loading fails after data was shown', () => {
    data.next([{ id: 1, country: 'France', participations: [
      { id: 1, year: 2012, city: 'London', medalsCount: 10, athleteCount: 100 },
    ] }]);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('canvas')).not.toBeNull();

    data.error(new HttpErrorResponse({ status: 503 }));
    fixture.detectChanges();

    expect(page.querySelector('[role="alert"]')?.textContent).toContain('temporarily unavailable');
    expect(page.querySelector('app-header')).toBeNull();
    expect(page.querySelector('canvas')).toBeNull();
  });

});
