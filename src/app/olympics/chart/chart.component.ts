import { afterRenderEffect, Component, type ElementRef, inject, input, output, viewChild } from '@angular/core';
import { ChartRenderer, type OlympicChartData } from './chart-renderer.service';

@Component({
  selector: 'app-olympic-chart',
  template: '<canvas #canvas></canvas>',
  styles: ':host { display: block; }',
})
export class OlympicChartComponent {
  readonly type = input.required<OlympicChartData['type']>();
  readonly labels = input.required<readonly (string | number)[]>();
  readonly values = input.required<readonly number[]>();
  readonly countrySelected = output<string>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly renderer = inject(ChartRenderer);

  constructor() {
    afterRenderEffect((onCleanup) => {
      const chart = this.renderer.create(this.canvas().nativeElement, {
        type: this.type(),
        labels: this.labels(),
        values: this.values(),
      }, (country) => this.countrySelected.emit(country));
      onCleanup(() => chart.destroy());
    });
  }
}
