import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import type { Indicator } from './indicator.model';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    page = fixture.nativeElement as HTMLElement;
  });

  it('should render the supplied title, labels and numeric values including zero', () => {
    const indicators: readonly Indicator[] = [
      { label: 'Number of countries', value: 5 },
      { label: 'Number of JOs', value: 0 },
    ];
    fixture.componentRef.setInput('title', 'Medals per Country');
    fixture.componentRef.setInput('indicators', indicators);
    fixture.detectChanges();

    expect(page.querySelector('.center > div')?.textContent?.trim()).toBe('Medals per Country');
    expect(Array.from(page.querySelectorAll('.split p'), item => item.textContent?.trim())).toEqual([
      'Number of countries', '5', 'Number of JOs', '0',
    ]);
  });

  it('should update the title and indicators when the page context changes', () => {
    fixture.componentRef.setInput('title', 'France');
    fixture.componentRef.setInput('indicators', [{ label: 'Total Number of medals', value: 30 }]);
    fixture.detectChanges();

    fixture.componentRef.setInput('title', 'Italy');
    fixture.componentRef.setInput('indicators', [{ label: 'Number of entries', value: 3 }]);
    fixture.detectChanges();

    expect(page.querySelector('.center > div')?.textContent?.trim()).toBe('Italy');
    expect(Array.from(page.querySelectorAll('.split p'), item => item.textContent?.trim())).toEqual([
      'Number of entries', '3',
    ]);
  });

  it('should render the title without cards when no indicators are supplied', () => {
    fixture.componentRef.setInput('title', 'Olympic games');
    fixture.componentRef.setInput('indicators', []);
    fixture.detectChanges();

    expect(page.querySelector('.center > div')?.textContent?.trim()).toBe('Olympic games');
    expect(page.querySelectorAll('.split > div').length).toBe(0);
  });
});
