import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { Olympic } from '../models/olympic';
import type { DataLoadError } from './data-load-error';
import { DataService } from './data.service';
import { OlympicDataValidationError } from './olympic-data.validator';

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
    const data: readonly Olympic[] = [
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
        ],
      },
    ];
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

  for (const scenario of [
    { name: 'a non-array payload', payload: { details: 'private server details' } },
    {
      name: 'a malformed participation',
      payload: [
        {
          id: 1,
          country: 'France',
          participations: [
            {
              id: 1,
              year: 2012,
              city: 'London',
              medalsCount: '10',
              athleteCount: 100,
            },
          ],
        },
      ],
    },
    {
      name: 'duplicate country IDs',
      payload: [
        { id: 1, country: 'France', participations: [] },
        { id: 1, country: 'Italy', participations: [] },
      ],
    },
  ]) {
    it(`should propagate ${scenario.name} as a data error without emitting success`, () => {
      const nextSpy = jasmine.createSpy<(data: readonly Olympic[]) => void>('next');
      const errorSpy = jasmine.createSpy<(error: DataLoadError) => void>('error');
      service.getOlympics().subscribe({ next: nextSpy, error: errorSpy });
      httpTesting.expectOne('./assets/mock/olympic.json').flush(scenario.payload);

      expect(nextSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          message: 'Olympic data is invalid. Please try again later.',
          cause: jasmine.any(OlympicDataValidationError),
        }),
      );
    });
  }

  it('should propagate HTTP errors instead of returning an empty collection', () => {
    const nextSpy = jasmine.createSpy<(data: readonly Olympic[]) => void>('next');
    const errorSpy = jasmine.createSpy<(error: DataLoadError) => void>('error');
    service.getOlympics().subscribe({ next: nextSpy, error: errorSpy });
    httpTesting.expectOne('./assets/mock/olympic.json').flush('Unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(nextSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        message: 'Olympic data is temporarily unavailable. Please try again later.',
        cause: jasmine.objectContaining({ status: 503 }),
      }),
    );
  });

  for (const scenario of [
    { status: 404, message: 'Olympic data could not be found.' },
    { status: 400, message: 'Unable to load Olympic data. Please try again.' },
  ]) {
    it(`should translate HTTP status ${scenario.status} and retain its cause`, () => {
      const errorSpy = jasmine.createSpy<(error: DataLoadError) => void>('error');
      service.getOlympics().subscribe({ next: () => fail('Expected a failure'), error: errorSpy });
      httpTesting.expectOne('./assets/mock/olympic.json').flush('private server details', {
        status: scenario.status,
        statusText: 'Technical failure',
      });
      expect(errorSpy).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          message: scenario.message,
          cause: jasmine.any(HttpErrorResponse),
        }),
      );
    });
  }

  it('should translate network failures without returning a successful empty response', () => {
    const errorSpy = jasmine.createSpy<(error: DataLoadError) => void>('error');
    service.getOlympics().subscribe({ next: () => fail('Expected a failure'), error: errorSpy });
    httpTesting.expectOne('./assets/mock/olympic.json').error(new ProgressEvent('error'));

    expect(errorSpy).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        message: 'Unable to connect. Check your connection and try again.',
        cause: jasmine.objectContaining({ status: 0 }),
      }),
    );
  });
});
