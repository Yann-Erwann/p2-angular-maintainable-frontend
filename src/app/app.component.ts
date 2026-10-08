import { afterNextRender, type AfterRenderRef, Component, DestroyRef, type ElementRef, inject, Injector, type OnInit, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  title = 'olympic-games-starter';
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('mainContent');
  private pendingFocus?: AfterRenderRef;

  ngOnInit() {
    this.destroyRef.onDestroy(() => this.pendingFocus?.destroy());
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      skip(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      this.pendingFocus?.destroy();
      if (this.router.parseUrl(event.urlAfterRedirects).fragment) {
        return;
      }
      this.pendingFocus = afterNextRender(() => {
        this.main().nativeElement.querySelector<HTMLElement>('h1')?.focus();
      }, { injector: this.injector });
    });
  }
}
