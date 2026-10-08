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

    expect(component.totalCountries).toBe(2);
    expect(component.totalJOs).toBe(2);
    expect(chartSpy).toHaveBeenCalledWith(['France', 'Italy'], [30, 15]);
    expect(component.pieChart.data.labels).toEqual(['France', 'Italy']);
    expect(component.pieChart.data.datasets[0].data).toEqual([30, 15]);

    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.center > div')?.textContent?.trim()).toBe('Medals per Country');
    expect(Array.from(page.querySelectorAll('.split p'), item => item.textContent?.trim())).toEqual([
      'Number of countries', '2', 'Number of JOs', '2',
    ]);
    expect(page.querySelector('canvas')).toBe(component.pieChart.canvas);
  });
});
