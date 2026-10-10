import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ArcElement, Chart } from 'chart.js';
import { ChartRenderer, type RenderedChart } from './chart-renderer.service';

describe('ChartRenderer', () => {
  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let rendered: RenderedChart | undefined;

  beforeEach(() => {
    container = document.createElement('div');
    container.getBoundingClientRect = () => new DOMRect(0, 0, 300, 150);
    canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;
    container.appendChild(canvas);
    document.body.appendChild(container);
    rendered = undefined;
  });

  afterEach(() => {
    rendered?.destroy();
    container.remove();
  });

  for (const type of ['pie', 'line'] as const) {
    it(`should render a ${type} on the supplied canvas without mutating inputs`, () => {
      const labels = Object.freeze(type === 'pie' ? ['France', 'Italy'] : [2012, 2016]);
      const values = Object.freeze([10, 20]);
      rendered = TestBed.inject(ChartRenderer).create(
        canvas,
        { type, items: labels.map((label, index) => ({ label, value: values[index] })) },
        () => undefined,
      );
      const chart = Chart.getChart(canvas);
      expect(chart?.data.labels).toEqual([...labels]);
      expect(chart?.data.datasets[0].data).toEqual([10, 20]);
      expect(chart?.options.animation).toBe(false);
      expect(chart?.options.responsive).toBe(true);
      expect(chart?.options.maintainAspectRatio).toBe(false);
      expect(chart?.canvas).toBe(canvas);
      expect(chart?.legend?.options.display).toBe(false);
      expect(chart?.isPluginEnabled('tooltip')).toBe(true);
      rendered.destroy();
      rendered = undefined;
      expect(Chart.getChart(canvas)).toBeUndefined();
    });
  }

  it('should emit the selected pie index and ignore clicks outside a country', () => {
    const selected = vi.fn();
    rendered = TestBed.inject(ChartRenderer).create(
      canvas,
      {
        type: 'pie',
        items: [
          { label: 'France', value: 10 },
          { label: 'Italy', value: 20 },
        ],
      },
      selected,
    );
    const chart = Chart.getChart(canvas);
    if (!chart) {
      throw new Error('Expected a rendered pie chart.');
    }
    const hits = vi.spyOn(chart, 'getElementsAtEventForMode').mockReturnValue([]);
    const event = { type: 'click', native: new MouseEvent('click'), x: 0, y: 0 } as const;
    chart.options.onClick?.call(chart, event, [], chart);
    expect(selected).not.toHaveBeenCalled();
    hits.mockReturnValue([{ index: 1, datasetIndex: 0, element: new ArcElement({}) }]);
    chart.options.onClick?.call(chart, event, [], chart);
    expect(selected).toHaveBeenCalledTimes(1);
    expect(selected).toHaveBeenCalledWith(1);
  });
  for (const type of ['pie', 'line'] as const) {
    it(`should highlight the keyboard-selected ${type} item and its tooltip`, () => {
      rendered = TestBed.inject(ChartRenderer).create(
        canvas,
        {
          type,
          items: [
            { label: 'First', value: 10 },
            { label: 'Second', value: 20 },
          ],
        },
        () => undefined,
      );
      const chart = Chart.getChart(canvas)!;
      rendered.focusPoint(1);
      expect(chart.getActiveElements().map((item) => item.index)).toEqual([1]);
      expect(chart.tooltip?.getActiveElements().map((item) => item.index)).toEqual([1]);
      rendered.focusPoint(null);
      expect(chart.getActiveElements()).toEqual([]);
      expect(chart.tooltip?.getActiveElements()).toEqual([]);
      rendered.focusPoint(99);
      expect(chart.getActiveElements()).toEqual([]);
    });
  }

  it('should render country point values with area fill and keyboard selection', () => {
    rendered = TestBed.inject(ChartRenderer).create(
      canvas,
      {
        type: 'line',
        items: [
          { label: 2012, value: 35 },
          { label: 2016, value: 45 },
          { label: 2020, value: 33 },
        ],
      },
      () => undefined,
    );
    const chart = Chart.getChart(canvas)!;
    chart.resize(650, 336);
    const text = vi.spyOn(chart.ctx, 'fillText');
    chart.update('none');
    expect(vi.mocked(text).mock.calls.some((args) => args[0] === '45')).toBe(true);
    const dataset = chart.data.datasets[0];
    expect('fill' in dataset && dataset.fill).toBe(true);
    expect(chart.legend?.options.display).toBe(false);
    expect(chart.scales['y'].min).toBeLessThanOrEqual(33);
    expect(chart.scales['y'].max).toBeGreaterThanOrEqual(45);
    rendered.focusPoint(2);
    expect(chart.tooltip?.getActiveElements().map((item) => item.index)).toEqual([2]);
  });

  it('should draw a medal beside the complete dashboard tooltip', () => {
    rendered = TestBed.inject(ChartRenderer).create(
      canvas,
      {
        type: 'pie',
        items: [
          { label: 'France', value: 10 },
          { label: 'Italy', value: 30 },
        ],
      },
      () => undefined,
    );
    const chart = Chart.getChart(canvas)!;
    chart.resize(650, 400);
    const arc = vi.spyOn(chart.ctx, 'arc');
    rendered.focusPoint(0);
    expect(chart.tooltip?.title[0].trim()).toBe('France');
    expect(chart.tooltip?.body[0].lines.map((line) => line.trim())).toEqual([
      '10 medals',
      '25% of total',
    ]);
    expect(
      vi.mocked(arc).mock.calls.some((args) => args[0] === 11 && args[1] === 13 && args[2] === 7),
    ).toBe(true);
  });

  it('should paint an opaque white canvas background after every redraw', () => {
    rendered = TestBed.inject(ChartRenderer).create(
      canvas,
      { type: 'pie', items: [{ label: 'France', value: 10 }] },
      () => undefined,
    );
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
    rendered = TestBed.inject(ChartRenderer).create(
      canvas,
      {
        type: 'pie',
        items: [
          { label: 'Italy', value: 96 },
          { label: 'United States', value: 345 },
        ],
      },
      () => undefined,
    );
    const chart = Chart.getChart(canvas)!;
    const fillText = vi.spyOn(chart.ctx, 'fillText');
    chart.resize(650, 400);
    chart.update('none');
    expect(vi.mocked(fillText).mock.calls.some((args) => args[0] === '345')).toBe(true);
    expect(vi.mocked(fillText).mock.calls.some((args) => args[0] === 'United States')).toBe(true);
    expect(chart.legend?.options.display).toBe(false);
    rendered.focusPoint(1);
    expect(chart.getActiveElements().map((item) => item.index)).toEqual([1]);
    expect(chart.tooltip?.getActiveElements().map((item) => item.index)).toEqual([1]);
    chart.resize(300, 300);
    chart.update('none');
    expect(chart.canvas.width).toBeGreaterThan(0);
  });
});
