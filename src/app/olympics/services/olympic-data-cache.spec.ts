import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OlympicDataService } from './olympic-data.service';

describe('OlympicDataService shared loading', () => {
  const url = './assets/mock/olympic.json';
  const countries = [{ id: 1, country: 'France', participations: [] }];
  let service: OlympicDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OlympicDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should share a pending request without cancelling it when one consumer leaves', () => {
    const next = vi.fn();
    const first = service.getOlympics().subscribe();
    const second = service.getOlympics().subscribe(next);
    const request = http.expectOne(url);
    first.unsubscribe();
    expect(request.cancelled).toBe(false);
    request.flush(countries);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(countries);
    second.unsubscribe();
  });

  it('should cancel when the last consumer leaves and request again on a later subscription', () => {
    const first = service.getOlympics().subscribe();
    const second = service.getOlympics().subscribe();
    const request = http.expectOne(url);
    first.unsubscribe();
    expect(request.cancelled).toBe(false);
    second.unsubscribe();
    expect(request.cancelled).toBe(true);
    const next = vi.fn();
    service.getOlympics().subscribe(next);
    http.expectOne(url).flush(countries);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(countries);
  });

  for (const payload of [countries, []]) {
    it('should reuse a completed valid response across page consumers', () => {
      service.getOlympics().subscribe();
      http.expectOne(url).flush(payload);
      const next = vi.fn();
      service.getOlympics().subscribe(next);
      service.getOlympics().subscribe();
      http.expectNone(url);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(payload);
    });
  }

  for (const invalid of [false, true]) {
    it(`should retry after ${invalid ? 'validation' : 'HTTP'} failure without caching the error`, () => {
      const error = vi.fn();
      service.getOlympics().subscribe({ error });
      const request = http.expectOne(url);
      if (invalid) {
        request.flush({ invalid: true });
      } else {
        request.flush('Unavailable', { status: 503, statusText: 'Unavailable' });
      }
      expect(error).toHaveBeenCalledTimes(1);
      const next = vi.fn();
      service.getOlympics().subscribe(next);
      http.expectOne(url).flush(countries);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(countries);
    });
  }
});
