import { Injectable } from '@angular/core';
import {
  ArcElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PieController,
  PointElement,
  Tooltip,
} from 'chart.js';
import { createMedalDistributionConfig, createMedalHistoryConfig } from './chart-config';
import type { OlympicChartData } from './chart.model';

Chart.register(
  ArcElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PieController,
  PointElement,
  Tooltip,
);

/** Contrat de cycle de vie et de focus masquant l’instance Chart.js. */
export interface RenderedChart {
  destroy(): void;
  /** `null` ou un index absent retire la mise en évidence et l’infobulle. */
  focusPoint(index: number | null): void;
}

/** Frontière Chart.js ; l’appelant possède le cycle de vie de {@link RenderedChart}. */
@Injectable({ providedIn: 'root' })
export class ChartRenderer {
  /**
   * Crée le graphique après disponibilité du canvas.
   * @param canvas Toute instance précédente sur ce canvas doit déjà avoir été détruite.
   * @param onPointSelected Index dans `data.items`, émis seulement pour le camembert.
   */
  create(
    canvas: HTMLCanvasElement,
    data: OlympicChartData,
    onPointSelected: (index: number) => void,
  ): RenderedChart {
    const config =
      data.type === 'pie'
        ? createMedalDistributionConfig(data.items, onPointSelected)
        : createMedalHistoryConfig(data.items);
    const chart = new Chart(canvas, config);
    return {
      destroy: () => chart.destroy(),
      focusPoint: (index) => {
        const element = index === null ? undefined : chart.getDatasetMeta(0).data[index];
        const active = element && index !== null ? [{ datasetIndex: 0, index }] : [];
        chart.setActiveElements(active);
        chart.tooltip?.setActiveElements(
          active,
          element instanceof ArcElement || element instanceof PointElement
            ? element.getCenterPoint(false)
            : { x: 0, y: 0 },
        );
        chart.update('none');
      },
    };
  }
}
