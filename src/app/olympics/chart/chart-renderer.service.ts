import { Injectable } from '@angular/core';
import { MEDAL_COLORS } from './chart-colors';
import { ArcElement, CategoryScale, Chart, Legend, LinearScale, LineController, LineElement, PieController, PointElement, Tooltip, type Plugin, type ScriptableContext } from 'chart.js';

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

const dashboardLabels = (data: OlympicChartData): Plugin => ({
  id: 'dashboardMedalLabels',
  afterDatasetsDraw: (chart) => {
    const { ctx, width } = chart;
    ctx.save();
    chart.getDatasetMeta(0).data.forEach((element, index) => {
      if (!(element instanceof ArcElement) || data.values[index] <= 0) return;
      const angle = (element.startAngle + element.endAngle) / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const radius = element.outerRadius;
      ctx.font = `600 ${width < 500 ? 17 : 23}px system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(data.values[index]), element.x + cos * radius * .65, element.y + sin * radius * .65);
      if (width < 520) return;
      const right = cos >= 0;
      const label = String(data.labels[index]);
      ctx.font = '600 15px system-ui, sans-serif';
      const textWidth = ctx.measureText(label).width;
      const startX = element.x + cos * radius;
      const startY = element.y + sin * radius;
      const elbowX = element.x + cos * (radius + 30);
      const elbowY = Math.max(14, Math.min(chart.height - 14, element.y + sin * (radius + 30)));
      const endX = right ? Math.min(width - textWidth - 22, elbowX + 70) : Math.max(textWidth + 22, elbowX - 30);
      ctx.strokeStyle = MEDAL_COLORS[index % MEDAL_COLORS.length];
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(elbowX, elbowY); ctx.lineTo(endX, elbowY); ctx.stroke();
      ctx.fillStyle = '#0c204b'; ctx.textAlign = right ? 'left' : 'right';
      ctx.fillText(label, endX + (right ? 12 : -12), elbowY);
    });
    ctx.restore();
  },
});

Chart.register(ArcElement, CategoryScale, Legend, LinearScale, LineController, LineElement, PieController, PointElement, Tooltip);

export interface OlympicChartData {
  readonly type: 'pie' | 'line';
  readonly labels: readonly (string | number)[];
  readonly values: readonly number[];
  readonly dashboard?: boolean;
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
    const dashboard = data.type === 'pie' && data.dashboard;
    const chart = new Chart(canvas, {
      type: data.type,
      plugins: dashboard ? [accessibleBackground, dashboardLabels(data)] : [accessibleBackground],
      data: {
        labels: [...data.labels],
        datasets: [{
          label: data.type === 'pie' ? 'Medals' : 'medals',
          data: [...data.values],
          backgroundColor: dashboard ? (context: ScriptableContext<'pie' | 'line'>) => {
            const color = MEDAL_COLORS[context.dataIndex % MEDAL_COLORS.length];
            const area = context.chart.chartArea;
            if (!area) return color;
            const gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color + 'dd');
            return gradient;
          } : data.type === 'pie'
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
        ...(dashboard ? {
          plugins: {
            legend: { display: false },
          },
          layout: { padding: (context) => context.chart.width >= 520
            ? { left: 145, right: 90, top: 15, bottom: 15 }
            : { left: 10, right: 10, top: 15, bottom: 15 } },
        } : {}),
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
