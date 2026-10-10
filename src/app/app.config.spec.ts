import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';

import { appConfig } from './app.config';
import { HomeComponent } from './olympics/pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

describe('Application routing', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render the home page at the root URL', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/', HomeComponent);

    const request = httpTesting.expectOne('./assets/mock/olympic.json');

    expect(request.request.method).toBe('GET');

    request.flush([]);

    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No Olympic data available.');
  });

  for (const url of ['/', '/country/1']) {
    it(`should cancel the pending HTTP request when leaving ${url}`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      const request = httpTesting.expectOne('./assets/mock/olympic.json');
      expect(request.cancelled).toBe(false);

      await harness.navigateByUrl('/not-found', NotFoundComponent);
      expect(request.cancelled).toBe(true);
      httpTesting.expectNone('./assets/mock/olympic.json');
    });
  }

  it('should render the not-found page at its explicit URL', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/not-found', NotFoundComponent);

    expect(harness.routeNativeElement?.textContent).toContain('Cette page n’existe pas');
  });

  it('should render the not-found page for an unknown URL', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/unknown-page', NotFoundComponent);

    expect(harness.routeNativeElement?.textContent).toContain('Cette page n’existe pas');
  });

  for (const url of ['/', '/country/1']) {
    it(`should show a data validation error at ${url} without statistics or a chart`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);

      httpTesting
        .expectOne('./assets/mock/olympic.json')
        .flush([{ id: 1, country: 'private server details', participations: 'invalid' }]);
      harness.detectChanges();

      expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
        'Olympic data is invalid. Please try again later.',
      );
      expect(harness.routeNativeElement?.textContent).not.toContain('private server details');
      expect(harness.routeNativeElement?.querySelector('app-header')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
    });
  }
});
