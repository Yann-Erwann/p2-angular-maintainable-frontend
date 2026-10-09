import { TestBed } from '@angular/core/testing';
import { PageFeedbackComponent } from './page-feedback.component';

describe('PageFeedbackComponent', () => {
  it('should keep loading announcements without a skeleton when the page reserves its own layout', () => {
    const fixture = TestBed.createComponent(PageFeedbackComponent);
    fixture.componentRef.setInput('state', { status: 'loading' });
    fixture.componentRef.setInput('showSkeleton', false);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const status = page.querySelector('[role="status"]');
    expect(page.querySelector('.loading-skeleton')).toBeNull();
    expect(status?.textContent?.trim()).toContain('Loading Olympic data');
    expect(status?.classList.contains('visually-hidden')).toBeTrue();

    fixture.componentRef.setInput('state', { status: 'success' });
    fixture.detectChanges();
    expect(page.querySelector('[role="status"]')).toBe(status);
  });

  it('should keep live regions mounted across loading, success and error transitions', () => {
    const fixture = TestBed.createComponent(PageFeedbackComponent);
    fixture.componentRef.setInput('state', { status: 'loading' });
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const status = page.querySelector('[role="status"]');
    const alert = page.querySelector('[role="alert"]');
    expect(status?.textContent?.trim()).toContain('Loading Olympic data');
    expect(status?.getAttribute('aria-atomic')).toBe('true');
    expect(alert?.textContent?.trim()).toBe('');

    fixture.componentRef.setInput('successMessage', 'Loaded results for Italy.');
    fixture.componentRef.setInput('state', { status: 'success' });
    fixture.detectChanges();
    expect(page.querySelector('[role="status"]')).toBe(status);
    expect(status?.textContent?.trim()).toBe('Loaded results for Italy.');
    expect(status?.classList.contains('visually-hidden')).toBeTrue();

    fixture.componentRef.setInput('state', {
      status: 'error',
      message: 'Unable to connect.',
    });
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')).toBe(alert);
    expect(status?.textContent?.trim()).toBe('');
    expect(alert?.textContent?.trim()).toBe('Unable to connect.');
    expect(alert?.getAttribute('aria-atomic')).toBe('true');
    expect(alert?.classList.contains('visually-hidden')).toBeFalse();
  });

  it('should show a decorative skeleton only while loading and keep the status announcement', () => {
    const fixture = TestBed.createComponent(PageFeedbackComponent);
    fixture.componentRef.setInput('state', { status: 'loading' });
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.loading-skeleton')?.getAttribute('aria-hidden')).toBe('true');
    expect(page.querySelectorAll('.skeleton-indicator').length).toBe(2);
    expect(page.querySelector('[role="status"]')?.textContent?.trim()).toContain(
      'Loading Olympic data',
    );
    expect(page.querySelector('canvas')).toBeNull();

    fixture.componentRef.setInput('indicatorCount', 3);
    fixture.detectChanges();
    expect(page.querySelectorAll('.skeleton-indicator').length).toBe(3);

    for (const state of [
      { status: 'success' },
      { status: 'empty' },
      { status: 'not-found' },
      { status: 'error', message: 'Unable to connect.' },
    ]) {
      fixture.componentRef.setInput('state', state);
      fixture.detectChanges();
      expect(page.querySelector('.loading-skeleton')).toBeNull();
    }
    fixture.componentRef.setInput('state', { status: 'loading' });
    fixture.detectChanges();
    expect(page.querySelector('.loading-skeleton')).not.toBeNull();
  });

  for (const [state, message] of [
    ['empty', 'No Olympic data available.'],
    ['not-found', 'Country not found.'],
  ] as const) {
    it(`should display ${state} without an error announcement`, () => {
      const fixture = TestBed.createComponent(PageFeedbackComponent);
      fixture.componentRef.setInput('state', { status: state });
      fixture.detectChanges();
      const page = fixture.nativeElement as HTMLElement;
      expect(page.querySelector('[role="status"]')?.textContent?.trim()).toBe(message);
      expect(page.querySelector('[role="alert"]')?.textContent?.trim()).toBe('');
    });
  }
});
