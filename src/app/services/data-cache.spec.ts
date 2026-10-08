import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';

describe('DataService shared loading', () => {
  const url = './assets/mock/olympic.json';
  const countries = [{ id: 1, country: 'France', participations: [] }];
  let service: DataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should share a pending request without cancelling it when one consumer leaves', () => {
    const next = jasmine.createSpy('next');
    const first = service.getOlympics().subscribe();
    const second = service.getCountryById(1).subscribe(next);
    const request = http.expectOne(url);
    first.unsubscribe();
    expect(request.cancelled).toBeFalse();
    request.flush(countries);
    expect(next).toHaveBeenCalledOnceWith(countries[0]);
    second.unsubscribe();
  });

  it('should cancel when the last consumer leaves and request again on a later subscription', () => {
    const first = service.getOlympics().subscribe();
    const second = service.getOlympics().subscribe();
    const request = http.expectOne(url);
    first.unsubscribe();
    expect(request.cancelled).toBeFalse();
    second.unsubscribe();
    expect(request.cancelled).toBeTrue();
    const next = jasmine.createSpy('next');
    service.getOlympics().subscribe(next);
    http.expectOne(url).flush(countries);
    expect(next).toHaveBeenCalledOnceWith(countries);
  });

  for (const payload of [countries, []]) {
    it('should reuse a completed valid response across page consumers', () => {
      service.getOlympics().subscribe();
      http.expectOne(url).flush(payload);
      const next = jasmine.createSpy('next');
      service.getOlympics().subscribe(next);
      service.getCountryById(1).subscribe();
      http.expectNone(url);
      expect(next).toHaveBeenCalledOnceWith(payload);
    });
  }

  for (const invalid of [false, true]) {
    it(`should retry after ${invalid ? 'validation' : 'HTTP'} failure without caching the error`, () => {
      const error = jasmine.createSpy('error');
      service.getOlympics().subscribe({ error });
      const request = http.expectOne(url);
      if (invalid) {
        request.flush({ invalid: true });
      } else {
        request.flush('Unavailable', { status: 503, statusText: 'Unavailable' });
      }
      expect(error).toHaveBeenCalledTimes(1);
      const next = jasmine.createSpy('next');
      service.getOlympics().subscribe(next);
      http.expectOne(url).flush(countries);
      expect(next).toHaveBeenCalledOnceWith(countries);
    });
  }
});
