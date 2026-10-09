import { type ComponentFixture, DeferBlockState } from '@angular/core/testing';

export async function renderDeferredBlocks(fixture: ComponentFixture<unknown>): Promise<void> {
  const blocks = await fixture.getDeferBlocks();
  await Promise.all(blocks.map((block) => block.render(DeferBlockState.Complete)));
  fixture.detectChanges();
}
