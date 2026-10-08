import { TestBed } from '@angular/core/testing';
import { PageFeedbackComponent } from './page-feedback.component';

describe('PageFeedbackComponent', () => {
  it('should keep live regions mounted across loading, success and error transitions', () => {
    const fixture = TestBed.createComponent(PageFeedbackComponent);
    fixture.componentRef.setInput('state', { status: 'loading' });
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const status = page.querySelector('[role="status"]');
    const alert = page.querySelector('[role="alert"]');
    expect(status?.textContent).toContain('Loading Olympic data');
    expect(status?.getAttribute('aria-atomic')).toBe('true');
    expect(alert?.textContent).toBe('');

    fixture.componentRef.setInput('successMessage', 'Loaded results for Italy.');
    fixture.componentRef.setInput('state', { status: 'success', data: [] });
    fixture.detectChanges();
    expect(page.querySelector('[role="status"]')).toBe(status);
    expect(status?.textContent).toBe('Loaded results for Italy.');
    expect(status?.classList.contains('visually-hidden')).toBeTrue();

    fixture.componentRef.setInput('state', { status: 'error', message: 'Unable to connect.' });
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')).toBe(alert);
    expect(status?.textContent).toBe('');
    expect(alert?.textContent).toBe('Unable to connect.');
    expect(alert?.getAttribute('aria-atomic')).toBe('true');
    expect(alert?.classList.contains('visually-hidden')).toBeFalse();
  });

  for (const [state, message] of [['empty', 'No Olympic data available.'], ['not-found', 'Country not found.']] as const) {
    it(`should display ${state} without an error announcement`, () => {
      const fixture = TestBed.createComponent(PageFeedbackComponent);
      fixture.componentRef.setInput('state', { status: state });
      fixture.detectChanges();
      const page = fixture.nativeElement as HTMLElement;
      expect(page.querySelector('[role="status"]')?.textContent).toBe(message);
      expect(page.querySelector('[role="alert"]')?.textContent).toBe('');
    });
  }
});
