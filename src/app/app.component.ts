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
    class: 'app-shell',
    '[class.app-shell--dashboard]': 'dashboardLayout()',
    '[class.app-shell--country]': 'countryLayout()',
  },
  imports: [RouterLink, RouterOutlet],
})
export class AppComponent implements OnInit {
  /** Nom technique de l’application. */
  title = 'olympic-games-starter';
  /** Navigation entre les pages par identifiant. */
  private readonly router = inject(Router);
  /** URL initiale avant la première navigation terminée. */
  private readonly location = inject(Location);
  /** Dernière URL résolue, redirections comprises. */
  private readonly routeUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.location.path() || '/' },
  );
  /** Variante visuelle de la route racine. */
  readonly homeLayout = computed(
    () => !this.router.parseUrl(this.routeUrl()).root.children['primary']?.segments.length,
  );
  /** Variante visuelle des routes de détail pays. */
  readonly countryLayout = computed(
    () =>
      this.router.parseUrl(this.routeUrl()).root.children['primary']?.segments[0]?.path ===
      'country',
  );
  /** Shell statistique commun à l’accueil et au détail. */
  readonly dashboardLayout = computed(() => this.homeLayout() || this.countryLayout());
  /** Durée de vie des abonnements et rendus en attente. */
  private readonly destroyRef = inject(DestroyRef);
  /** Contexte Angular des callbacks de rendu différé. */
  private readonly injector = inject(Injector);
  /** Conteneur dans lequel rechercher le titre après navigation. */
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('mainContent');
  /** Rendu de focus annulable lors d’une navigation suivante. */
  private pendingFocus?: AfterRenderRef;

  /** Suit les navigations ultérieures et programme le focus après rendu. */
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
            this.main().nativeElement.querySelector<HTMLElement>('h1')?.focus();
          },
          { injector: this.injector },
        );
      });
  }
}
