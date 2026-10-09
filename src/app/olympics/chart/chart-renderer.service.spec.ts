import { TestBed } from '@angular/core/testing';
import { ArcElement, Chart } from 'chart.js';
import { ChartRenderer, type RenderedChart } from './chart-renderer.service';

describe('ChartRenderer', () => {
  let canvas: HTMLCanvasElement;
  let rendered: RenderedChart | undefined;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    rendered = undefined;
  });

  afterEach(() => {
    rendered?.destroy();
    canvas.remove();
  });

  for (const type of ['pie', 'line'] as const) {
    it(`should render a ${type} on the supplied canvas without mutating inputs`, () => {
      const labels = Object.freeze(type === 'pie' ? ['France', 'Italy'] : [2012, 2016]);
      const values = Object.freeze([10, 20]);
      rendered = TestBed.inject(ChartRenderer).create(canvas, { type, labels, values }, () => undefined);
      const chart = Chart.getChart(canvas);
      expect(chart?.data.labels).toEqual([...labels]);
      expect(chart?.data.datasets[0].data).toEqual([10, 20]);
      expect(chart?.options.animation).toBeFalse();
      expect(chart?.options.responsive).toBeTrue();
      expect(chart?.options.maintainAspectRatio).toBeFalse();
      expect(chart?.canvas).toBe(canvas);
      expect(chart?.legend?.legendItems?.map(item => item.text)).toEqual(type === 'pie' ? labels.map(String) : ['medals']);
      expect(chart?.isPluginEnabled('tooltip')).toBeTrue();
      rendered.destroy();
      rendered = undefined;
      expect(Chart.getChart(canvas)).toBeUndefined();
    });
  }

  it('should emit the selected pie index and ignore clicks outside a country', () => {
    const selected = jasmine.createSpy('selected');
    rendered = TestBed.inject(ChartRenderer).create(canvas, {
      type: 'pie', labels: ['France', 'Italy'], values: [10, 20],
    }, selected);
    const chart = Chart.getChart(canvas);
    if (!chart) {
      throw new Error('Expected a rendered pie chart.');
    }
    const hits = spyOn(chart, 'getElementsAtEventForMode').and.returnValue([]);
    const event = { type: 'click', native: new MouseEvent('click'), x: 0, y: 0 } as const;
    chart.options.onClick?.call(chart, event, [], chart);
    expect(selected).not.toHaveBeenCalled();
    hits.and.returnValue([{ index: 1, datasetIndex: 0, element: new ArcElement({}) }]);
    chart.options.onClick?.call(chart, event, [], chart);
    expect(selected).toHaveBeenCalledOnceWith(1);
  });
  for (const type of ['pie', 'line'] as const) {
    it(`should highlight the keyboard-selected ${type} item and its tooltip`, () => {
      rendered = TestBed.inject(ChartRenderer).create(canvas, { type, labels: ['First', 'Second'], values: [10, 20] }, () => undefined);
      const chart = Chart.getChart(canvas)!;
      rendered.focusPoint(1);
      expect(chart.getActiveElements().map(item => item.index)).toEqual([1]);
      expect(chart.tooltip?.getActiveElements().map(item => item.index)).toEqual([1]);
      rendered.focusPoint(null);
      expect(chart.getActiveElements()).toEqual([]);
      expect(chart.tooltip?.getActiveElements()).toEqual([]);
      rendered.focusPoint(99);
      expect(chart.getActiveElements()).toEqual([]);
    });
  }

  it('should paint an opaque white canvas background after every redraw', () => {
    rendered = TestBed.inject(ChartRenderer).create(canvas, { type: 'pie', labels: ['France'], values: [10] }, () => undefined);
    const chart = Chart.getChart(canvas)!;
    const context = canvas.getContext('2d')!;
    const backgroundPixel = () => Array.from(context.getImageData(0, 0, 1, 1).data);
    expect(backgroundPixel()).toEqual([255, 255, 255, 255]);
    rendered.focusPoint(0);
    expect(backgroundPixel()).toEqual([255, 255, 255, 255]);
    chart.resize(400, 300);
    chart.update('none');
    expect(backgroundPixel()).toEqual([255, 255, 255, 255]);
    expect(chart.options.color).toBe('#23343b');
  });

  it('should draw dashboard values and labels while preserving point selection', () => {
    rendered = TestBed.inject(ChartRenderer).create(canvas, {
      type: 'pie', labels: ['Italy', 'United States'], values: [96, 345], dashboard: true,
    }, () => undefined);
    const chart = Chart.getChart(canvas)!;
    const fillText = spyOn(chart.ctx, 'fillText').and.callThrough();
    chart.resize(650, 400);
    chart.update('none');
    expect(fillText.calls.allArgs().some(args => args[0] === '345')).toBeTrue();
    expect(fillText.calls.allArgs().some(args => args[0] === 'United States')).toBeTrue();
    expect(chart.legend?.options.display).toBeFalse();
    rendered.focusPoint(1);
    expect(chart.getActiveElements().map(item => item.index)).toEqual([1]);
    expect(chart.tooltip?.getActiveElements().map(item => item.index)).toEqual([1]);
    chart.resize(300, 300);
    chart.update('none');
    expect(chart.canvas.width).toBeGreaterThan(0);
  });

});
