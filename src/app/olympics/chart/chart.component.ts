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
    '[class.country-chart]': "type() === 'line'",
    '(focusout)': 'onFocusout($event)',
    '(document:keydown)': 'rememberTabDirection($event)',
  },
  styleUrl: './chart.component.scss',
})
export class OlympicChartComponent {
  /** Présentation en répartition (`pie`) ou en historique (`line`). */
  readonly type = input.required<OlympicChartData['type']>();
  /** Paires libellé/médailles dans l’ordre de sélection. */
  readonly items = input.required<readonly ChartItem[]>();
  /** ID d’une description existante dans la page, reliée au canvas par `aria-describedby`. */
  readonly dataDescriptionId = input.required<string>();
  /** Index dans `items` du secteur choisi ; la page porte la navigation. */
  readonly pointSelected = output<number>();
  /** Canvas disponible après le rendu du composant. */
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  /** Position courante de l’exploration au clavier. */
  readonly selectedIndex = signal(0);
  /** Valeurs textuelles de remplacement du dessin. */
  readonly textAlternative = computed(() =>
    this.items().length
      ? this.items()
          .map((item) => `${item.label}: ${item.value} medals.`)
          .join(' ')
      : 'No chart data',
  );
  /** Élément courant annoncé dans la région de statut. */
  readonly selection = computed(() => {
    const item = this.items()[this.selectedIndex()];
    return item ? `${item.label}: ${item.value} medals` : 'No chart data';
  });
  /** Instance graphique à libérer avant remplacement. */
  private rendered?: RenderedChart;
  /** Sens de la dernière tabulation pour choisir le point d’entrée. */
  private enteringBackwards = false;
  /** Limite du composant utilisée pour détecter la sortie du focus. */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Adaptateur de création et d’interaction Chart.js. */
  private readonly renderer = inject(ChartRenderer);

  /** Installe le rendu réactif et son nettoyage. */
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

  /** Retient le sens de Tab avant l’entrée dans le canvas. */
  rememberTabDirection(event: KeyboardEvent): void {
    if (event.key === 'Tab') this.enteringBackwards = event.shiftKey;
  }

  /** Commence au premier élément, ou au dernier après Maj+Tab. */
  onCanvasFocus(): void {
    this.selectedIndex.set(this.enteringBackwards ? Math.max(0, this.items().length - 1) : 0);
    this.highlight();
  }

  /** Synchronise la mise en évidence et l’infobulle avec la sélection. */
  highlight(): void {
    this.rendered?.focusPoint(this.items().length ? this.selectedIndex() : null);
  }

  /** Déplace la sélection circulairement d’un pas de `-1` ou `1`. */
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

  /** Efface la mise en évidence quand le focus quitte le composant. */
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
