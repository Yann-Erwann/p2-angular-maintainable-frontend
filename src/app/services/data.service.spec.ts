import { type HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { Olympic } from '../models/olympic';
import { DataService } from './data.service';

describe('DataService', () => {
  let service: DataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should request Olympic data and preserve its numeric fields', () => {
    const data: readonly Olympic[] = [{
      id: 1,
      country: 'France',
      participations: [{
        id: 1, year: 2012, city: 'London', medalsCount: 10, athleteCount: 100,
      }],
    }];
    const nextSpy = jasmine.createSpy<(data: readonly Olympic[]) => void>('next');
    service.getOlympics().subscribe(nextSpy);

    const request = httpTesting.expectOne('./assets/mock/olympic.json');
    expect(request.request.method).toBe('GET');
    request.flush(data);

    expect(nextSpy).toHaveBeenCalledOnceWith(data);
  });

  it('should preserve a successful empty response', () => {
    const nextSpy = jasmine.createSpy<(data: readonly Olympic[]) => void>('next');
    service.getOlympics().subscribe(nextSpy);
    httpTesting.expectOne('./assets/mock/olympic.json').flush([]);

    expect(nextSpy).toHaveBeenCalledOnceWith([]);
  });

  it('should propagate HTTP errors instead of returning an empty collection', () => {
    const nextSpy = jasmine.createSpy<(data: readonly Olympic[]) => void>('next');
    const errorSpy = jasmine.createSpy<(error: HttpErrorResponse) => void>('error');
    service.getOlympics().subscribe({ next: nextSpy, error: errorSpy });
    httpTesting.expectOne('./assets/mock/olympic.json').flush('Unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(nextSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledOnceWith(jasmine.objectContaining({ status: 503 }));
  });
});
