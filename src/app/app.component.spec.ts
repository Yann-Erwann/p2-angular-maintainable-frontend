import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LocationStrategy } from '@angular/common';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { appConfig } from './app.config';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

  it(`should have as title 'olympic-games-starter'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.title).toEqual('olympic-games-starter');
  });

  it('should render the router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});

describe('Accessible application navigation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
  });

  it('should expose a keyboard-accessible main landmark and focus the heading after navigation', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    await router.navigateByUrl('/');
    fixture.detectChanges();
    http
      .expectOne('./assets/mock/olympic.json')
      .flush([{ id: 2, country: 'Italy', participations: [] }]);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.skip-link')).toBeNull();
    expect(page.querySelector('h1')?.getAttribute('tabindex')).toBe('-1');
    expect(page.querySelector('[data-page-heading]')?.getAttribute('tabindex')).toBe('0');
    expect(page.querySelectorAll('main')).toHaveLength(1);
    expect(page.querySelectorAll('h1')).toHaveLength(1);
    expect(document.title).toBe('Medals by country | Olympic Games');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      new URL(TestBed.inject(LocationStrategy).prepareExternalUrl('/'), document.baseURI).href,
    );
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();

    await router.navigateByUrl('/country/2');
    fixture.detectChanges();
    http.expectNone('./assets/mock/olympic.json');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(page.querySelector('h1'));
    expect(page.querySelector('h1')?.textContent?.trim()).toBe('Olympic results');
    expect(document.title).toBe('Italy | Olympic Games');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      new URL(TestBed.inject(LocationStrategy).prepareExternalUrl('/country/2'), document.baseURI)
        .href,
    );

    await router.navigateByUrl('/unknown');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).not.toBe(page.querySelector('h1'));
    expect(page.querySelector('h1')?.getAttribute('tabindex')).toBeNull();
    expect(document.title).toBe('Page not found | Olympic Games');
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    );

    const homeArea = page.querySelector<HTMLAnchorElement>('.brand__home-area');
    expect(homeArea?.getAttribute('href')).toBe(
      TestBed.inject(LocationStrategy).prepareExternalUrl('/'),
    );
    expect(homeArea?.getAttribute('aria-label')).toBe('Home — TéléSport');
    const banner = page.querySelector('.brand__banner');
    expect(banner?.getAttribute('width')).toBe('1339');
    expect(banner?.getAttribute('height')).toBe('211');
    expect(banner?.getAttribute('alt')).toBe('');
    expect(page.querySelector('.brand__name')?.textContent?.trim()).toBe('TéléSport');
    expect(page.querySelector('.brand__title')?.textContent).toBe('Olympic games app');
    expect(banner?.getAttribute('srcset')?.replace(/\s+/g, ' ')).toContain(
      'telesport-header-small.webp 670w',
    );
    homeArea?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/');
    fixture.detectChanges();
    expect(fixture.componentInstance.homeLayout()).toBe(true);
    expect(page.querySelector('.brand__banner')?.getAttribute('src')).toBe(
      'assets/images/telesport-header.webp',
    );
    await router.navigateByUrl('/country/2');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.homeLayout()).toBe(false);
    expect(fixture.componentInstance.countryLayout()).toBe(true);
    expect(page.querySelector('.brand__banner')?.getAttribute('src')).toBe(
      'assets/images/telesport-header.webp',
    );
    http.verify();
  });
});
