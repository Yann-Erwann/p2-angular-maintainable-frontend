import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should count distinct editions and sum medals per country', () => {
    const chartSpy = spyOn(component, 'buildPieChart');
    const httpTesting = TestBed.inject(HttpTestingController);
    httpTesting.expectOne('./assets/mock/olympic.json').flush([
      {
        country: 'France',
        participations: [
          { year: 2012, medalsCount: 10 },
          { year: 2016, medalsCount: 20 },
        ],
      },
      {
        country: 'Italy',
        participations: [{ year: 2012, medalsCount: 15 }],
      },
    ]);

    expect(component.totalCountries).toBe(2);
    expect(component.totalJOs).toBe(2);
    expect(chartSpy).toHaveBeenCalledWith(['France', 'Italy'], [30, 15]);
    httpTesting.verify();
  });
});
