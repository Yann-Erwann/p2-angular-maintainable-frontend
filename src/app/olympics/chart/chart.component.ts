import { afterRenderEffect, Component, type ElementRef, inject, input, output, viewChild } from '@angular/core';
import { ChartRenderer, type OlympicChartData } from './chart-renderer.service';

@Component({
  selector: 'app-olympic-chart',
  template: `<canvas #canvas role="img"
    [attr.aria-label]="type() === 'pie' ? 'Total medals by country chart' : 'Medals by Olympic year chart'"
    [attr.aria-describedby]="dataDescriptionId()"></canvas>`,
  styleUrl: './chart.component.scss',
})
export class OlympicChartComponent {
  readonly type = input.required<OlympicChartData['type']>();
  readonly labels = input.required<readonly (string | number)[]>();
  readonly values = input.required<readonly number[]>();
  readonly dataDescriptionId = input.required<string>();
  readonly pointSelected = output<number>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly renderer = inject(ChartRenderer);

  constructor() {
    afterRenderEffect((onCleanup) => {
      const chart = this.renderer.create(this.canvas().nativeElement, {
        type: this.type(),
        labels: this.labels(),
        values: this.values(),
      }, (index) => this.pointSelected.emit(index));
      onCleanup(() => chart.destroy());
    });
  }
}
