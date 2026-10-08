import { TestBed } from '@angular/core/testing';
import { ArcElement } from 'chart.js';
import { Chart } from 'chart.js';
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
      expect(chart?.options.responsive).toBeTrue();
      expect(chart?.options.maintainAspectRatio).toBeFalse();
      expect(chart?.canvas).toBe(canvas);
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
});
