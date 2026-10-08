import { type ComponentFixture, DeferBlockState } from '@angular/core/testing';

export async function renderCharts(fixture: ComponentFixture<unknown>): Promise<void> {
  const blocks = await fixture.getDeferBlocks();
  for (const block of blocks) {
    await block.render(DeferBlockState.Complete);
  }
  fixture.detectChanges();
}
