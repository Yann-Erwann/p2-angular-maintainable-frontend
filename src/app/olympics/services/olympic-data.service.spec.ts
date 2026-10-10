import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { Olympic } from '../models/olympic.model';
import { OlympicDataService } from './olympic-data.service';
import { OlympicDataValidationError } from './olympic-data.validator';

describe('OlympicDataService', () => {
  let service: OlympicDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OlympicDataService);
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
    const nextSpy = vi.fn();
    service.getOlympics().subscribe(nextSpy);

    const request = httpTesting.expectOne('./assets/mock/olympic.json');
    expect(request.request.method).toBe('GET');
    request.flush(data);

    expect(nextSpy).toHaveBeenCalledTimes(1);

    expect(nextSpy).toHaveBeenCalledWith(data);
  });

  it('should preserve a successful empty response', () => {
    const nextSpy = vi.fn();
    service.getOlympics().subscribe(nextSpy);
    httpTesting.expectOne('./assets/mock/olympic.json').flush([]);

    expect(nextSpy).toHaveBeenCalledTimes(1);

    expect(nextSpy).toHaveBeenCalledWith([]);
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
      const nextSpy = vi.fn();
      const errorSpy = vi.fn();
      service.getOlympics().subscribe({ next: nextSpy, error: errorSpy });
      httpTesting.expectOne('./assets/mock/olympic.json').flush(scenario.payload);

      expect(nextSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Olympic data is invalid. Please try again later.',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          cause: expect.any(OlympicDataValidationError),
        }),
      );
    });
  }

  it('should propagate HTTP errors instead of returning an empty collection', () => {
    const nextSpy = vi.fn();
    const errorSpy = vi.fn();
    service.getOlympics().subscribe({ next: nextSpy, error: errorSpy });
    httpTesting.expectOne('./assets/mock/olympic.json').flush('Unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(nextSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Olympic data is temporarily unavailable. Please try again later.',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        cause: expect.objectContaining({ status: 503 }),
      }),
    );
  });

  for (const scenario of [
    { status: 404, message: 'Olympic data could not be found.' },
    { status: 400, message: 'Unable to load Olympic data. Please try again.' },
  ]) {
    it(`should translate HTTP status ${scenario.status} and retain its cause`, () => {
      const errorSpy = vi.fn();
      service.getOlympics().subscribe({
        next: () => {
          throw new Error('Expected a failure');
        },
        error: errorSpy,
      });
      httpTesting.expectOne('./assets/mock/olympic.json').flush('private server details', {
        status: scenario.status,
        statusText: 'Technical failure',
      });
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: scenario.message,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          cause: expect.any(HttpErrorResponse),
        }),
      );
    });
  }

  it('should translate network failures without returning a successful empty response', () => {
    const errorSpy = vi.fn();
    service.getOlympics().subscribe({
      next: () => {
        throw new Error('Expected a failure');
      },
      error: errorSpy,
    });
    httpTesting.expectOne('./assets/mock/olympic.json').error(new ProgressEvent('error'));

    expect(errorSpy).toHaveBeenCalledTimes(1);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Unable to connect. Check your connection and try again.',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        cause: expect.objectContaining({ status: 0 }),
      }),
    );
  });
});
