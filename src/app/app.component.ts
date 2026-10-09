import {
  ChangeDetectionStrategy,
  afterNextRender,
  type AfterRenderRef,
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  inject,
  Injector,
  type OnInit,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, skip } from 'rxjs';

/**
 * Shell et focus après navigation. Le premier affichage et les liens vers un fragment
 * ne déplacent pas le focus.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'app-shell app-shell--dashboard',
    '[class.app-shell--country]': 'countryLayout()',
  },
  imports: [RouterLink, RouterOutlet],
})
export class AppComponent implements OnInit {
  title = 'olympic-games-starter';
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly routeUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.location.path() || '/' },
  );
  readonly homeLayout = computed(
    () => !this.router.parseUrl(this.routeUrl()).root.children['primary']?.segments.length,
  );
  readonly countryLayout = computed(
    () =>
      this.router.parseUrl(this.routeUrl()).root.children['primary']?.segments[0]?.path ===
      'country',
  );
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('mainContent');
  private pendingFocus?: AfterRenderRef;

  ngOnInit() {
    this.destroyRef.onDestroy(() => this.pendingFocus?.destroy());
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.pendingFocus?.destroy();
        if (this.router.parseUrl(event.urlAfterRedirects).fragment) {
          return;
        }
        this.pendingFocus = afterNextRender(
          () => {
            const main = this.main().nativeElement;
            const heading =
              main.querySelector<HTMLElement>('[data-page-heading]') ??
              main.querySelector<HTMLElement>('h1');
            if (!heading?.hasAttribute('data-manual-focus')) heading?.focus();
          },
          { injector: this.injector },
        );
      });
  }
}
