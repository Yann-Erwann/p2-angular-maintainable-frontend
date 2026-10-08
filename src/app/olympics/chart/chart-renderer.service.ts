import { Injectable } from '@angular/core';
import { ArcElement, CategoryScale, Chart, Legend, LinearScale, LineController, LineElement, PieController, PointElement, Tooltip } from 'chart.js';

Chart.register(ArcElement, CategoryScale, Legend, LinearScale, LineController, LineElement, PieController, PointElement, Tooltip);

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
    onPointSelected: (index: number) => void,
  ): RenderedChart {
    const chart = new Chart(canvas, {
      type: data.type,
      data: {
        labels: [...data.labels],
        datasets: [{
          label: data.type === 'pie' ? 'Medals' : 'medals',
          data: [...data.values],
          backgroundColor: data.type === 'pie'
            ? ['#0b6470', '#486b94', '#7a3c53', '#8f6263', '#a45a00', '#35665c']
            : '#0b6470',
          borderColor: data.type === 'pie' ? '#ffffff' : '#0b6470',
          borderWidth: 2,
          ...(data.type === 'pie' ? { hoverOffset: 4 } : {}),
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event) => {
          if (data.type !== 'pie' || !event.native) {
            return;
          }
          const points = chart.getElementsAtEventForMode(event.native, 'point', { intersect: true }, true);
          if (points.length > 0) {
            onPointSelected(points[0].index);
          }
        },
      },
    });
    return { destroy: () => chart.destroy() };
  }
}
