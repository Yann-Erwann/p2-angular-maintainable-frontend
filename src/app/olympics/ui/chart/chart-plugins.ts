import { ArcElement, PointElement, type Plugin } from 'chart.js';
import { MEDAL_COLORS } from './chart-colors';
import type { ChartItem } from './chart.model';

/** Le fond blanc est peint dans le canvas pour être conservé dans les captures et exports. */
export const accessibleBackground: Plugin = {
  id: 'accessibleCanvasBackground',
  beforeDraw: ({ ctx, width, height }) => {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};

/** Décoration de médaille dans l’espace réservé de l’infobulle. */
export const dashboardTooltipMedal: Plugin = {
  id: 'dashboardTooltipMedal',
  afterTooltipDraw: ({ ctx }, { tooltip }) => {
    if (!tooltip.opacity || !tooltip.title.length) return;
    ctx.save();
    const medalSize = Math.min(48, tooltip.height - 32);
    ctx.translate(tooltip.x + 16, tooltip.y + (tooltip.height - medalSize) / 2);
    ctx.scale(medalSize / 22, medalSize / 22);
    ctx.fillStyle = '#4677cf';
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(7, 0);
    ctx.lineTo(13, 10);
    ctx.lineTo(7, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a2d54';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(21, 0);
    ctx.lineTo(15, 10);
    ctx.lineTo(9, 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, 13, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#efb936';
    ctx.fill();
    ctx.strokeStyle = '#b77900';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(11, 13, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
};

/** Compteurs des secteurs et noms des pays autour du camembert, y compris sur mobile. */
export const dashboardLabels = (items: readonly ChartItem[]): Plugin => ({
  id: 'dashboardMedalLabels',
  afterDatasetsDraw: (chart) => {
    const { ctx, width } = chart;
    const compact = width < 520;
    const labelSize = compact ? 11 : 15;
    const labelGap = compact ? 6 : 12;
    const labelDistance = compact ? 18 : 20;
    const labelPositions: Record<'left' | 'right', number[]> = { left: [], right: [] };

    const placeLabel = (preferred: number, side: 'left' | 'right'): number => {
      const min = compact ? 12 : 14;
      const max = chart.height - min;
      let position = Math.max(min, Math.min(max, preferred));
      const occupied = labelPositions[side];
      while (occupied.some((value) => Math.abs(value - position) < labelDistance)) {
        const next = position + labelDistance;
        if (next <= max) {
          position = next;
          continue;
        }
        const previous = position - labelDistance;
        if (previous >= min) {
          position = previous;
          continue;
        }
        break;
      }
      occupied.push(position);
      return position;
    };

    ctx.save();
    chart.getDatasetMeta(0).data.forEach((element, index) => {
      if (!(element instanceof ArcElement) || items[index].value <= 0) return;
      const angle = (element.startAngle + element.endAngle) / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const radius = element.outerRadius;
      const sectorAngle = element.endAngle - element.startAngle;
      const valueLabelSize = compact ? 14 : width < 500 ? 17 : 23;
      const valueLabelRadius = compact && sectorAngle < Math.PI / 4 ? 0.76 : 0.65;
      ctx.font = `600 ${valueLabelSize}px system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const valueX = element.x + cos * radius * valueLabelRadius;
      const valueY = element.y + sin * radius * valueLabelRadius;
      const value = String(items[index].value);
      if (compact && sectorAngle < Math.PI / 4) {
        ctx.strokeStyle = MEDAL_COLORS[index % MEDAL_COLORS.length];
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(value, valueX, valueY);
      }
      ctx.fillText(value, valueX, valueY);
      const right = cos >= 0;
      const side = right ? 'right' : 'left';
      const label = String(items[index].label);
      ctx.font = `600 ${labelSize}px system-ui, sans-serif`;
      const textWidth = ctx.measureText(label).width;
      const startX = element.x + cos * radius;
      const startY = element.y + sin * radius;
      const elbowX = element.x + cos * (radius + (compact ? 14 : 30));
      const elbowY = placeLabel(element.y + sin * (radius + (compact ? 18 : 30)), side);
      const endX = right
        ? Math.min(width - textWidth - labelGap, elbowX + (compact ? 24 : 70))
        : Math.max(textWidth + labelGap, elbowX - (compact ? 20 : 30));
      ctx.strokeStyle = MEDAL_COLORS[index % MEDAL_COLORS.length];
      ctx.lineWidth = compact ? 1.5 : 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(elbowX, elbowY);
      ctx.lineTo(endX, elbowY);
      ctx.stroke();
      ctx.fillStyle = '#0c204b';
      ctx.textAlign = right ? 'left' : 'right';
      ctx.fillText(label, endX + (right ? labelGap : -labelGap), elbowY);
    });
    ctx.restore();
  },
});

/** Compteurs placés au-dessus des points de l’historique. */
export const countryPointLabels = (items: readonly ChartItem[]): Plugin => ({
  id: 'countryPointLabels',
  afterDatasetsDraw: (chart) => {
    const { ctx } = chart;
    ctx.save();
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillStyle = '#008798';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    chart.getDatasetMeta(0).data.forEach((element, index) => {
      if (element instanceof PointElement)
        ctx.fillText(String(items[index].value), element.x, element.y - 16);
    });
    ctx.restore();
  },
});
