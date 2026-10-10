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
  /** Type Chart.js déterminant le mode répartition ou historique. */
  readonly type = input.required<OlympicChartData['type']>();
  /** Points affichés dans le graphique, dans l’ordre de sélection. */
  readonly items = input.required<readonly ChartItem[]>();
  /** ID d’une description existante dans la page, reliée au canvas par `aria-describedby`. */
  readonly dataDescriptionId = input.required<string>();
  /** Index dans `items` du secteur choisi ; la page porte la navigation. */
  readonly pointSelected = output<number>();
  /** Canvas possédé par le composant et transmis au renderer. */
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  /** Index du point actuellement mis en évidence. */
  readonly selectedIndex = signal(0);
  /** Alternative textuelle reprenant toutes les valeurs du graphique. */
  readonly textAlternative = computed(() =>
    this.items().length
      ? this.items()
          .map((item) => `${item.label}: ${item.value} medals.`)
          .join(' ')
      : 'No chart data',
  );
  /** Résumé textuel du point sélectionné. */
  readonly selection = computed(() => {
    const item = this.items()[this.selectedIndex()];
    return item ? `${item.label}: ${item.value} medals` : 'No chart data';
  });
  /** Instance rendue et nettoyée par l’effet de rendu. */
  private rendered?: RenderedChart;
  /** Indique que le focus est entré par Maj+Tab. */
  private enteringBackwards = false;
  /** Élément hôte utilisé pour limiter le focus au composant. */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Service qui encapsule la création et le focus Chart.js. */
  private readonly renderer = inject(ChartRenderer);

  /** Crée le graphique après le rendu du canvas et nettoie l’instance précédente. */
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

  /** Mémorise le sens d’entrée dans le composant par tabulation. */
  rememberTabDirection(event: KeyboardEvent): void {
    if (event.key === 'Tab') this.enteringBackwards = event.shiftKey;
  }

  /** Place la sélection au premier ou au dernier point selon le sens d’entrée. */
  onCanvasFocus(): void {
    this.selectedIndex.set(this.enteringBackwards ? Math.max(0, this.items().length - 1) : 0);
    this.highlight();
  }

  /** Synchronise la sélection accessible avec l’instance Chart.js. */
  highlight(): void {
    this.rendered?.focusPoint(this.items().length ? this.selectedIndex() : null);
  }

  /** Déplace la sélection de manière circulaire avec les flèches. */
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

  /** Retire la mise en évidence lorsque le focus quitte le graphique. */
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
