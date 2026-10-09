import { provideZoneChangeDetection } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartRenderer, type RenderedChart } from './chart-renderer.service';
import { OlympicChartComponent } from './chart.component';

describe('OlympicChartComponent', () => {
  let fixture: ComponentFixture<OlympicChartComponent>;
  let renderer: jasmine.SpyObj<ChartRenderer>;
  let chart: jasmine.SpyObj<RenderedChart>;

  beforeEach(() => {
    renderer = jasmine.createSpyObj<ChartRenderer>('ChartRenderer', ['create']);
    chart = jasmine.createSpyObj<RenderedChart>('RenderedChart', ['destroy', 'focusPoint']);
    renderer.create.and.returnValue(chart);
    TestBed.configureTestingModule({
      imports: [OlympicChartComponent],
      providers: [provideZoneChangeDetection(), { provide: ChartRenderer, useValue: renderer }],
    });
    fixture = TestBed.createComponent(OlympicChartComponent);
    fixture.componentRef.setInput('type', 'pie');
    fixture.componentRef.setInput('items', [{ label: 'France', value: 30 }]);
    fixture.componentRef.setInput('dataDescriptionId', 'data-caption');
  });

  it('should create after the view renders using its own canvas and typed inputs', () => {
    expect(renderer.create.calls.count()).toBe(0);
    fixture.detectChanges();
    const [canvas, data] = renderer.create.calls.mostRecent().args;
    expect((fixture.nativeElement as HTMLElement).querySelector('canvas')).toBe(canvas);
    expect(data).toEqual({ type: 'pie', items: [{ label: 'France', value: 30 }] });
    expect(renderer.create.calls.count()).toBe(1);
  });

  it('should release the previous instance before replacing changed data', () => {
    fixture.detectChanges();
    const replacement = jasmine.createSpyObj<RenderedChart>('replacement', [
      'destroy',
      'focusPoint',
    ]);
    renderer.create.and.callFake(() => {
      expect(chart.destroy.calls.count()).toBe(1);
      return replacement;
    });
    fixture.componentRef.setInput('items', [
      { label: 2012, value: 10 },
      { label: 2016, value: 20 },
    ]);
    fixture.componentRef.setInput('type', 'line');
    fixture.detectChanges();
    expect(renderer.create.calls.count()).toBe(2);
    expect(renderer.create.calls.mostRecent().args[1]).toEqual({
      type: 'line',
      items: [
        { label: 2012, value: 10 },
        { label: 2016, value: 20 },
      ],
    });
    fixture.destroy();
    expect(chart.destroy.calls.count()).toBe(1);
    expect(replacement.destroy.calls.count()).toBe(1);
  });

  it('should keep its instance when inputs do not change', () => {
    fixture.detectChanges();
    fixture.detectChanges();
    expect(renderer.create.calls.count()).toBe(1);
    expect(chart.destroy.calls.count()).toBe(0);
  });

  it('should release its instance exactly once when destroyed', () => {
    fixture.detectChanges();
    fixture.destroy();
    TestBed.tick();
    expect(chart.destroy.calls.count()).toBe(1);
    expect(renderer.create.calls.count()).toBe(1);
  });

  it('should never create a chart if destroyed before rendering', () => {
    fixture.destroy();
    TestBed.tick();
    expect(renderer.create.calls.count()).toBe(0);
  });

  it('should emit the country selection received from the renderer', () => {
    const selected = jasmine.createSpy('selected');
    fixture.componentInstance.pointSelected.subscribe(selected);
    fixture.detectChanges();
    renderer.create.calls.mostRecent().args[2](0);
    expect(selected).toHaveBeenCalledOnceWith(0);
  });

  it('should pass distinct canvases to concurrent chart instances', () => {
    fixture.detectChanges();
    const other = TestBed.createComponent(OlympicChartComponent);
    other.componentRef.setInput('type', 'line');
    other.componentRef.setInput('items', [{ label: 2012, value: 10 }]);
    other.componentRef.setInput('dataDescriptionId', 'other-caption');
    other.detectChanges();
    const firstCanvas = renderer.create.calls.argsFor(0)[0];
    const secondCanvas = renderer.create.calls.argsFor(1)[0];
    expect(firstCanvas).not.toBe(secondCanvas);
    expect((other.nativeElement as HTMLElement).querySelector('canvas')).toBe(secondCanvas);
  });
  it('should explore and open countries on the canvas without rebuilding or trapping Tab', () => {
    fixture.componentRef.setInput('items', [
      { label: 'France', value: 30 },
      { label: 'Italy', value: 20 },
    ]);
    fixture.detectChanges();
    const canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas')!;
    const selected = jasmine.createSpy('selected');
    fixture.componentInstance.pointSelected.subscribe(selected);
    const key = (value: string) => {
      const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
      canvas.dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };
    canvas.dispatchEvent(new FocusEvent('focus'));
    expect(chart.focusPoint.calls.mostRecent().args).toEqual([0]);
    expect(key('ArrowLeft').defaultPrevented).toBeTrue();
    expect(fixture.componentInstance.selection()).toBe('Italy: 20 medals');
    expect(chart.focusPoint.calls.mostRecent().args).toEqual([1]);
    key('ArrowRight');
    expect(fixture.componentInstance.selectedIndex()).toBe(0);
    key('End');
    key('Enter');
    expect(selected).toHaveBeenCalledOnceWith(1);
    key('Home');
    expect(fixture.componentInstance.selectedIndex()).toBe(0);
    expect(key('Tab').defaultPrevented).toBeTrue();
    expect(fixture.componentInstance.selectedIndex()).toBe(1);
    expect(key('Tab').defaultPrevented).toBeFalse();
    expect(renderer.create.calls.count()).toBe(1);
    (fixture.nativeElement as HTMLElement).dispatchEvent(
      new FocusEvent('focusout', { relatedTarget: document.body }),
    );
    expect(chart.focusPoint.calls.mostRecent().args).toEqual([null]);
  });

  it('should explore years without emitting a country navigation', () => {
    fixture.componentRef.setInput('type', 'line');
    fixture.componentRef.setInput('items', [
      { label: 2012, value: 10 },
      { label: 2016, value: 20 },
    ]);
    fixture.detectChanges();
    const selected = jasmine.createSpy('selected');
    fixture.componentInstance.pointSelected.subscribe(selected);
    fixture.componentInstance.move(1);
    expect(fixture.componentInstance.selection()).toBe('2016: 20 medals');
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(selected).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('should provide complete fallback data and accessible keyboard instructions without buttons', () => {
    fixture.componentRef.setInput('items', [
      { label: 'France', value: 30 },
      { label: 'Italy', value: 20 },
    ]);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const canvas = page.querySelector('canvas')!;
    expect(canvas.textContent).toBe('France: 30 medals. Italy: 20 medals.');
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBe('Total medals by country chart');
    expect(canvas.getAttribute('aria-describedby')).toBe('data-caption data-caption-keys');
    expect(page.querySelector('#data-caption-keys')?.textContent).toContain('Enter or Space');
    expect(page.querySelector('button')).toBeNull();
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(page.querySelector('[role="status"]')?.textContent?.trim()).toBe('Italy: 20 medals');
  });

  it('should visit every chart item with Tab and allow exiting at either boundary', () => {
    fixture.componentRef.setInput('items', [
      { label: 'France', value: 30 },
      { label: 'Italy', value: 20 },
      { label: 'Spain', value: 10 },
    ]);
    fixture.detectChanges();
    const canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas')!;
    const tab = (shiftKey = false) => {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      canvas.dispatchEvent(event);
      fixture.detectChanges();
      return event.defaultPrevented;
    };
    canvas.dispatchEvent(new FocusEvent('focus'));
    expect(fixture.componentInstance.selectedIndex()).toBe(0);
    expect(tab()).toBeTrue();
    expect(fixture.componentInstance.selection()).toBe('Italy: 20 medals');
    expect(tab()).toBeTrue();
    expect(fixture.componentInstance.selection()).toBe('Spain: 10 medals');
    expect(tab()).toBeFalse();
    expect(tab(true)).toBeTrue();
    expect(fixture.componentInstance.selectedIndex()).toBe(1);
    expect(tab(true)).toBeTrue();
    expect(fixture.componentInstance.selectedIndex()).toBe(0);
    expect(tab(true)).toBeFalse();
    fixture.componentInstance.rememberTabDirection(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }),
    );
    canvas.dispatchEvent(new FocusEvent('focus'));
    expect(fixture.componentInstance.selectedIndex()).toBe(2);
    expect(renderer.create.calls.count()).toBe(1);
  });
});
