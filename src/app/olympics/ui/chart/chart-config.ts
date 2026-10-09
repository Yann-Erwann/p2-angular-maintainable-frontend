import type { ChartConfiguration, ScriptableContext } from 'chart.js';
import { MEDAL_COLORS } from './chart-colors';
import type { ChartItem } from './chart.model';
import {
  accessibleBackground,
  countryPointLabels,
  dashboardLabels,
  dashboardTooltipMedal,
} from './chart-plugins';

/** Configuration Chart.js limitée aux deux graphiques de médailles. */
type MedalConfig = ChartConfiguration<'pie' | 'line', number[], string | number>;

/** Configuration du camembert ; les secteurs et la sélection conservent l’ordre des éléments. */
export function createMedalDistributionConfig(
  items: readonly ChartItem[],
  select: (index: number) => void,
): MedalConfig {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return {
    type: 'pie',
    plugins: [accessibleBackground, dashboardLabels(items), dashboardTooltipMedal],
    data: {
      labels: items.map((item) => item.label),
      datasets: [
        {
          label: 'Medals',
          data: items.map((item) => item.value),
          backgroundColor: (context: ScriptableContext<'pie' | 'line'>) => {
            const color = MEDAL_COLORS[context.dataIndex % MEDAL_COLORS.length];
            const area = context.chart.chartArea;
            if (!area) return color;
            const gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color + 'dd');
            return gradient;
          },
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      animation: false,
      color: '#23343b',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          borderColor: '#e4e8ef',
          borderWidth: 1,
          cornerRadius: 12,
          padding: 16,
          caretSize: 8,
          caretPadding: 6,
          displayColors: false,
          titleColor: '#0c204b',
          bodyColor: '#64759b',
          titleFont: { family: 'system-ui, sans-serif', size: 16, weight: 'bold' },
          bodyFont: { family: 'system-ui, sans-serif', size: 16 },
          titleMarginBottom: 6,
          callbacks: {
            title: (points) => (points.length ? `\u2003\u2003\u2003\u2003${points[0].label}` : ''),
            label: (context) => {
              const medals = items[context.dataIndex].value;
              const percentage = total ? Math.round((medals / total) * 1000) / 10 : 0;
              return [
                `\u2003\u2003\u2003\u2003${medals} medals`,
                `\u2003\u2003\u2003\u2003${percentage}% of total`,
              ];
            },
          },
        },
      },
      layout: {
        padding: (context) =>
          context.chart.width >= 520
            ? { left: 145, right: 90, top: 15, bottom: 15 }
            : { left: 10, right: 10, top: 15, bottom: 15 },
      },
      onClick: (event, _elements, chart) => {
        if (!event.native) return;
        const points = chart.getElementsAtEventForMode(
          event.native,
          'point',
          { intersect: true },
          true,
        );
        if (points.length) select(points[0].index);
      },
    },
  };
}

/** Configuration de la courbe ; l’ordre chronologique doit être préparé par l’appelant. */
export function createMedalHistoryConfig(items: readonly ChartItem[]): MedalConfig {
  const values = items.map((item) => item.value);
  const minimum = values.length ? Math.max(0, Math.floor(Math.min(...values) / 5) * 5) : 0;
  const maximum = values.length ? Math.ceil(Math.max(...values) / 5) * 5 + 5 : 5;
  return {
    type: 'line',
    plugins: [accessibleBackground, countryPointLabels(items), dashboardTooltipMedal],
    data: {
      labels: items.map((item) => item.label),
      datasets: [
        {
          label: 'medals',
          data: values,
          backgroundColor: (context: ScriptableContext<'pie' | 'line'>) => {
            const area = context.chart.chartArea;
            if (!area) return '#008b9726';
            const gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            gradient.addColorStop(0, '#009bab40');
            gradient.addColorStop(1, '#009bab05');
            return gradient;
          },
          borderColor: '#008798',
          borderWidth: 2,
          fill: true,
          pointRadius: 8,
          pointHoverRadius: 10,
          pointBackgroundColor: '#008798',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 5,
          pointHoverBorderWidth: 5,
        },
      ],
    },
    options: {
      animation: false,
      color: '#23343b',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          borderColor: '#dceaf2',
          borderWidth: 1,
          cornerRadius: 12,
          padding: 16,
          caretSize: 8,
          caretPadding: 6,
          displayColors: false,
          titleColor: '#0c204b',
          bodyColor: '#008798',
          titleFont: { family: 'system-ui, sans-serif', size: 16, weight: 'bold' },
          bodyFont: { family: 'system-ui, sans-serif', size: 16, weight: 'bold' },
          titleMarginBottom: 8,
          callbacks: {
            title: (points) =>
              points.length ? `\u2003\u2003\u2003\u2003Year ${points[0].label}` : '',
            label: (context) => `\u2003\u2003\u2003\u2003${items[context.dataIndex].value} medals`,
          },
        },
      },
      layout: {
        padding: (context) => ({
          top: 24,
          left: context.chart.width >= 600 ? 48 : 16,
          right: context.chart.width >= 600 ? 32 : 16,
        }),
      },
      scales: {
        x: {
          offset: false,
          ticks: { color: '#506a9b', font: { size: 14 } },
          grid: { color: '#e5eef5' },
          border: { color: '#cbd7e6' },
        },
        y: {
          suggestedMin: minimum,
          suggestedMax: maximum,
          ticks: {
            color: '#506a9b',
            stepSize: Math.max(1, Math.ceil((maximum - minimum) / 10)),
            font: { size: 14 },
          },
          grid: { color: '#e5eef5' },
          border: { color: '#cbd7e6' },
        },
      },
    },
  };
}
