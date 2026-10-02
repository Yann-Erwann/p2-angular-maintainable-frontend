import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';

import { appConfig } from './app.config';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

describe('Application routing', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
      ],
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

    expect(harness.routeNativeElement?.textContent).toContain('Medals per Country');
  });

  it('should render the not-found page at its explicit URL', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/not-found', NotFoundComponent);

    expect(harness.routeNativeElement?.textContent).toContain('No corresponding page found');
  });

  it('should render the not-found page for an unknown URL', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/unknown-page', NotFoundComponent);

    expect(harness.routeNativeElement?.textContent).toContain('No corresponding page found');
  });
});
