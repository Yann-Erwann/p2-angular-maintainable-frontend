import { Injectable } from '@angular/core';
import { ArcElement, CategoryScale, Chart, Legend, LinearScale, LineController, LineElement, PieController, PointElement, Tooltip, type Plugin } from 'chart.js';

const accessibleBackground: Plugin = {
  id: 'accessibleCanvasBackground',
  beforeDraw: ({ ctx, width, height }) => {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};

Chart.register(ArcElement, CategoryScale, Legend, LinearScale, LineController, LineElement, PieController, PointElement, Tooltip);

export interface OlympicChartData {
  readonly type: 'pie' | 'line';
  readonly labels: readonly (string | number)[];
  readonly values: readonly number[];
}

export interface RenderedChart {
  destroy(): void;
  focusPoint(index: number | null): void;
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
      plugins: [accessibleBackground],
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
        animation: false,
        color: '#23343b',
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
    return {
      destroy: () => chart.destroy(),
      focusPoint: (index) => {
        const element = index === null ? undefined : chart.getDatasetMeta(0).data[index];
        const active = element && index !== null ? [{ datasetIndex: 0, index }] : [];
        chart.setActiveElements(active);
        chart.tooltip?.setActiveElements(active, element instanceof ArcElement || element instanceof PointElement ? element.getCenterPoint(false) : { x: 0, y: 0 });
        chart.update('none');
      },
    };
  }
}
