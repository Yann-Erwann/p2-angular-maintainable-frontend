import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import type { Indicator } from './indicator.model';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    page = fixture.nativeElement as HTMLElement;
  });

  it('should render the supplied title, labels and numeric values including zero', () => {
    const indicators: readonly Indicator[] = [
      { kind: 'countries', label: 'Number of countries', value: 5 },
      { kind: 'editions', label: 'Number of JOs', value: 0 },
    ];
    fixture.componentRef.setInput('title', 'Medals per Country');
    fixture.componentRef.setInput('indicators', indicators);
    fixture.detectChanges();

    expect(page.querySelector('.center > h2')?.textContent?.trim()).toBe('Medals per Country');
    expect(
      Array.from(page.querySelectorAll('.split dt, .split dd'), (item) => item.textContent?.trim()),
    ).toEqual(['Number of countries', '5', 'Number of JOs', '0']);
  });

  it('should update the title and indicators when the page context changes', () => {
    fixture.componentRef.setInput('title', 'France');
    fixture.componentRef.setInput('indicators', [
      { kind: 'medals', label: 'Total Number of medals', value: 30 },
    ]);
    fixture.detectChanges();

    fixture.componentRef.setInput('title', 'Italy');
    fixture.componentRef.setInput('indicators', [
      { kind: 'entries', label: 'Number of entries', value: 3 },
    ]);
    fixture.detectChanges();

    expect(page.querySelector('.center > h2')?.textContent?.trim()).toBe('Italy');
    expect(
      Array.from(page.querySelectorAll('.split dt, .split dd'), (item) => item.textContent?.trim()),
    ).toEqual(['Number of entries', '3']);
  });

  it('should render the title without cards when no indicators are supplied', () => {
    fixture.componentRef.setInput('title', 'Olympic games');
    fixture.componentRef.setInput('indicators', []);
    fixture.detectChanges();

    expect(page.querySelector('.center > h2')?.textContent?.trim()).toBe('Olympic games');
    expect(page.querySelectorAll('.split > dl').length).toBe(0);
  });
  it('should keep semantic icons and styles when indicators are reordered', () => {
    const indicators: readonly Indicator[] = [
      { kind: 'medals', label: 'Total Number of medals', value: 30 },
      { kind: 'athletes', label: 'Total Number of athletes', value: 100 },
      { kind: 'entries', label: 'Number of entries', value: 3 },
    ];
    fixture.componentRef.setInput('title', 'France');
    fixture.componentRef.setInput('variant', 'country');
    fixture.componentRef.setInput('indicators', indicators);
    fixture.detectChanges();
    const medalCard = page.querySelector('[data-kind="medals"]')!;
    const medalIcon = medalCard.querySelector('.indicator-icon')!;
    const medalColor = getComputedStyle(medalIcon).color;
    fixture.componentRef.setInput('indicators', [...indicators].reverse());
    fixture.detectChanges();
    expect(page.querySelector('[data-kind="medals"]')).toBe(medalCard);
    expect(page.querySelector('[data-kind="medals"] .indicator-icon')).toBe(medalIcon);
    expect(getComputedStyle(medalIcon).color).toBe(medalColor);
    expect(
      Array.from(page.querySelectorAll('dl'), (item) => item.getAttribute('data-kind')),
    ).toEqual(['entries', 'athletes', 'medals']);
  });
});
