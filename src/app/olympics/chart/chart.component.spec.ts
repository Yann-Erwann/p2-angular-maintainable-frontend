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
    chart = jasmine.createSpyObj<RenderedChart>('RenderedChart', ['destroy']);
    renderer.create.and.returnValue(chart);
    TestBed.configureTestingModule({
      imports: [OlympicChartComponent],
      providers: [provideZoneChangeDetection(), { provide: ChartRenderer, useValue: renderer }],
    });
    fixture = TestBed.createComponent(OlympicChartComponent);
    fixture.componentRef.setInput('type', 'pie');
    fixture.componentRef.setInput('labels', ['France']);
    fixture.componentRef.setInput('values', [30]);
    fixture.componentRef.setInput('dataDescriptionId', 'data-caption');
  });

  it('should create after the view renders using its own canvas and typed inputs', () => {
    expect(renderer.create.calls.count()).toBe(0);
    fixture.detectChanges();
    const [canvas, data] = renderer.create.calls.mostRecent().args;
    expect((fixture.nativeElement as HTMLElement).querySelector('canvas')).toBe(canvas);
    expect(data).toEqual({ type: 'pie', labels: ['France'], values: [30] });
    expect(renderer.create.calls.count()).toBe(1);
  });

  it('should release the previous instance before replacing changed data', () => {
    fixture.detectChanges();
    const replacement = jasmine.createSpyObj<RenderedChart>('replacement', ['destroy']);
    renderer.create.and.callFake(() => {
      expect(chart.destroy.calls.count()).toBe(1);
      return replacement;
    });
    fixture.componentRef.setInput('labels', [2012, 2016]);
    fixture.componentRef.setInput('values', [10, 20]);
    fixture.componentRef.setInput('type', 'line');
    fixture.detectChanges();
    expect(renderer.create.calls.count()).toBe(2);
    expect(renderer.create.calls.mostRecent().args[1]).toEqual({ type: 'line', labels: [2012, 2016], values: [10, 20] });
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
    other.componentRef.setInput('labels', [2012]);
    other.componentRef.setInput('values', [10]);
    other.componentRef.setInput('dataDescriptionId', 'other-caption');
    other.detectChanges();
    const firstCanvas = renderer.create.calls.argsFor(0)[0];
    const secondCanvas = renderer.create.calls.argsFor(1)[0];
    expect(firstCanvas).not.toBe(secondCanvas);
    expect((other.nativeElement as HTMLElement).querySelector('canvas')).toBe(secondCanvas);
  });
});
