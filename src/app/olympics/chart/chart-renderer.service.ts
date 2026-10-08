import { Injectable } from '@angular/core';
import Chart from 'chart.js/auto';

export interface OlympicChartData {
  readonly type: 'pie' | 'line';
  readonly labels: readonly (string | number)[];
  readonly values: readonly number[];
}

export interface RenderedChart {
  destroy(): void;
}

@Injectable({ providedIn: 'root' })
export class ChartRenderer {
  create(
    canvas: HTMLCanvasElement,
    data: OlympicChartData,
    onCountrySelected: (country: string) => void,
  ): RenderedChart {
    const chart = new Chart(canvas, {
      type: data.type,
      data: {
        labels: [...data.labels],
        datasets: [{
          label: data.type === 'pie' ? 'Medals' : 'medals',
          data: [...data.values],
          backgroundColor: data.type === 'pie'
            ? ['#0b868f', '#adc3de', '#7a3c53', '#8f6263', 'orange', '#94819d']
            : '#0b868f',
          ...(data.type === 'pie' ? { hoverOffset: 4 } : {}),
        }],
      },
      options: {
        aspectRatio: 2.5,
        onClick: (event) => {
          if (data.type !== 'pie' || !event.native) {
            return;
          }
          const points = chart.getElementsAtEventForMode(event.native, 'point', { intersect: true }, true);
          const country = points.length > 0 ? chart.data.labels?.[points[0].index] : undefined;
          if (typeof country === 'string') {
            onCountrySelected(country);
          }
        },
      },
    });
    return { destroy: () => chart.destroy() };
  }
}
