import {
  ChangeDetectionStrategy,
  afterRenderEffect,
  Component,
  computed,
  signal,
  untracked,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ChartRenderer, type RenderedChart } from './chart-renderer.service';
import type { ChartItem, OlympicChartData } from './chart.model';

/**
 * Graphique accessible rendu via {@link ChartRenderer}.
 * L’instance est détruite avant remplacement et au retrait du composant.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-olympic-chart',
  templateUrl: './chart.component.html',
  host: {
    class: 'olympic-chart',
    '[class.olympic-chart--history]': "type() === 'line'",
    '(focusout)': 'onFocusout($event)',
    '(document:keydown)': 'rememberTabDirection($event)',
  },
  styleUrl: './chart.component.scss',
})
export class OlympicChartComponent {
  readonly type = input.required<OlympicChartData['type']>();
  readonly items = input.required<readonly ChartItem[]>();
  /** ID d’une description existante dans la page, reliée au canvas par `aria-describedby`. */
  readonly dataDescriptionId = input.required<string>();
  /** Index dans `items` du secteur choisi ; la page porte la navigation. */
  readonly pointSelected = output<number>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  readonly selectedIndex = signal(0);
  readonly textAlternative = computed(() =>
    this.items().length
      ? this.items()
          .map((item) => `${item.label}: ${item.value} medals.`)
          .join(' ')
      : 'No chart data',
  );
  readonly selection = computed(() => {
    const item = this.items()[this.selectedIndex()];
    return item ? `${item.label}: ${item.value} medals` : 'No chart data';
  });
  private rendered?: RenderedChart;
  private enteringBackwards = false;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(ChartRenderer);

  constructor() {
    afterRenderEffect((onCleanup) => {
      const chart = this.renderer.create(
        this.canvas().nativeElement,
        {
          type: this.type(),
          items: this.items(),
        },
        (index) => this.pointSelected.emit(index),
      );
      this.rendered = chart;
      untracked(() => {
        this.selectedIndex.set(
          Math.min(this.selectedIndex(), Math.max(0, this.items().length - 1)),
        );
        if (this.host.nativeElement.contains(document.activeElement)) this.highlight();
      });
      onCleanup(() => {
        chart.destroy();
        if (this.rendered === chart) this.rendered = undefined;
      });
    });
  }

  rememberTabDirection(event: KeyboardEvent): void {
    if (event.key === 'Tab') this.enteringBackwards = event.shiftKey;
  }

  onCanvasFocus(): void {
    this.selectedIndex.set(this.enteringBackwards ? Math.max(0, this.items().length - 1) : 0);
    this.highlight();
  }

  highlight(): void {
    this.rendered?.focusPoint(this.items().length ? this.selectedIndex() : null);
  }

  move(direction: number): void {
    const count = this.items().length;
    if (!count) return;
    this.selectedIndex.set((this.selectedIndex() + direction + count) % count);
    this.highlight();
  }

  /** Émet le secteur courant du camembert ; la courbe reste en lecture. */
  openCountry(): void {
    if (this.type() === 'pie' && this.items().length) this.pointSelected.emit(this.selectedIndex());
  }

  onFocusout(event: FocusEvent): void {
    if (
      !(event.relatedTarget instanceof Node) ||
      !this.host.nativeElement.contains(event.relatedTarget)
    )
      this.rendered?.focusPoint(null);
  }

  /**
   * Tab laisse sortir le focus aux extrémités ; les flèches permettent une exploration circulaire.
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case 'Tab': {
        const next = this.selectedIndex() + (event.shiftKey ? -1 : 1);
        if (next < 0 || next >= this.items().length) return;
        this.selectedIndex.set(next);
        this.highlight();
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp':
        this.move(-1);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        this.move(1);
        break;
      case 'Home':
        this.selectedIndex.set(0);
        this.highlight();
        break;
      case 'End':
        this.selectedIndex.set(Math.max(0, this.items().length - 1));
        this.highlight();
        break;
      case 'Enter':
      case ' ':
        if (this.type() !== 'pie') return;
        this.openCountry();
        break;
      case 'Escape':
        this.rendered?.focusPoint(null);
        break;
      default:
        return;
    }
    event.preventDefault();
  }
}
