import { ChangeDetectionStrategy, afterRenderEffect, Component, computed, signal, untracked, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { ChartRenderer, type RenderedChart, type OlympicChartData } from './chart-renderer.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-olympic-chart',
  template: `<p class="visually-hidden" [id]="dataDescriptionId() + '-keys'">Use Tab or arrow keys to explore each chart item, Shift+Tab to move backwards, and Home or End to jump to the first or last item. Tab after the last item leaves the chart. {{ type() === 'pie' ? 'Press Enter or Space to open the selected country.' : '' }}</p>
    <div class="chart-drawing"><canvas #canvas role="img" tabindex="0"
      [attr.aria-label]="type() === 'pie' ? 'Total medals by country chart' : 'Medals by Olympic year chart'"
      [attr.aria-describedby]="dataDescriptionId() + ' ' + dataDescriptionId() + '-keys'"
      (focus)="onCanvasFocus()" (keydown)="onKeydown($event)">{{ textAlternative() }}</canvas></div>
    <p class="visually-hidden chart-selection" role="status" aria-live="polite" aria-atomic="true">{{ selection() }}</p>`,
  host: { '(focusout)': 'onFocusout($event)', '(document:keydown)': 'rememberTabDirection($event)' },
  styleUrl: './chart.component.scss',
})
export class OlympicChartComponent {
  readonly type = input.required<OlympicChartData['type']>();
  readonly labels = input.required<readonly (string | number)[]>();
  readonly values = input.required<readonly number[]>();
  readonly dataDescriptionId = input.required<string>();
  readonly pointSelected = output<number>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  readonly selectedIndex = signal(0);
  readonly textAlternative = computed(() => this.labels().length
    ? this.labels().map((label, index) => `${label}: ${this.values()[index]} medals.`).join(' ')
    : 'No chart data');
  readonly selection = computed(() => this.labels().length ? `${this.labels()[this.selectedIndex()]}: ${this.values()[this.selectedIndex()]} medals` : 'No chart data');
  private rendered?: RenderedChart;
  private enteringBackwards = false;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(ChartRenderer);

  constructor() {
    afterRenderEffect((onCleanup) => {
      const chart = this.renderer.create(this.canvas().nativeElement, {
        type: this.type(),
        labels: this.labels(),
        values: this.values(),
      }, (index) => this.pointSelected.emit(index));
      this.rendered = chart;
      untracked(() => {
        this.selectedIndex.set(Math.min(this.selectedIndex(), Math.max(0, this.labels().length - 1)));
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
    this.selectedIndex.set(this.enteringBackwards ? Math.max(0, this.labels().length - 1) : 0);
    this.highlight();
  }

  highlight(): void {
    this.rendered?.focusPoint(this.labels().length ? this.selectedIndex() : null);
  }

  move(direction: number): void {
    const count = this.labels().length;
    if (!count) return;
    this.selectedIndex.set((this.selectedIndex() + direction + count) % count);
    this.highlight();
  }

  openCountry(): void {
    if (this.type() === 'pie' && this.labels().length) this.pointSelected.emit(this.selectedIndex());
  }

  onFocusout(event: FocusEvent): void {
    if (!(event.relatedTarget instanceof Node) || !this.host.nativeElement.contains(event.relatedTarget)) this.rendered?.focusPoint(null);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case 'Tab': {
        const next = this.selectedIndex() + (event.shiftKey ? -1 : 1);
        if (next < 0 || next >= this.labels().length) return;
        this.selectedIndex.set(next);
        this.highlight();
        break;
      }
      case 'ArrowLeft': case 'ArrowUp': this.move(-1); break;
      case 'ArrowRight': case 'ArrowDown': this.move(1); break;
      case 'Home': this.selectedIndex.set(0); this.highlight(); break;
      case 'End': this.selectedIndex.set(Math.max(0, this.labels().length - 1)); this.highlight(); break;
      case 'Enter': case ' ': if (this.type() !== 'pie') return; this.openCountry(); break;
      case 'Escape': this.rendered?.focusPoint(null); break;
      default: return;
    }
    event.preventDefault();
  }
}
