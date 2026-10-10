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
import { filter, map, skip, tap } from 'rxjs';
import { SeoService } from './seo.service';

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
    '[class.app-shell--return-home]': 'returnHomeLayout()',
  },
  imports: [RouterLink, RouterOutlet],
})
export class AppComponent implements OnInit {
  /** Titre historique conservé par le shell Angular. */
  title = 'olympic-games-starter';
  /** Routeur utilisé pour lire la route affichée et ses changements. */
  private readonly router = inject(Router);
  /** Emplacement initial utilisé lorsque le routeur n’a pas encore émis d’événement. */
  private readonly location = inject(Location);
  /** Service qui synchronise les métadonnées avec la route courante. */
  private readonly seo = inject(SeoService);
  /** URL après redirection, exposée réactivement aux classes de mise en page. */
  private readonly routeUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.location.path() || '/' },
  );
  /** Indique que la page courante est l’accueil. */
  readonly homeLayout = computed(
    () => !this.router.parseUrl(this.routeUrl()).root.children['primary']?.segments.length,
  );
  /** Indique que la page courante affiche le détail d’un pays. */
  readonly countryLayout = computed(
    () =>
      this.router.parseUrl(this.routeUrl()).root.children['primary']?.segments[0]?.path ===
      'country',
  );
  /** Active la variante qui permet de revenir à l’accueil. */
  readonly returnHomeLayout = computed(() => !this.homeLayout());
  /** Nettoie l’écoute de destruction du shell. */
  private readonly destroyRef = inject(DestroyRef);
  /** Injecteur fourni aux effets exécutés après le rendu. */
  private readonly injector = inject(Injector);
  /** Conteneur principal dont le titre peut recevoir le focus après navigation. */
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('mainContent');
  /** Référence de l’effet de focus en attente, si une navigation est en cours. */
  private pendingFocus?: AfterRenderRef;

  /** Met à jour les métadonnées et le focus après chaque navigation complète. */
  ngOnInit() {
    this.destroyRef.onDestroy(() => this.pendingFocus?.destroy());
    this.seo.update(this.routeUrl(), this.isNoIndexRoute());
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        tap((event) => this.seo.update(event.urlAfterRedirects, this.isNoIndexRoute())),
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

  /** Indique si la route courante doit être exclue des moteurs de recherche. */
  private isNoIndexRoute(): boolean {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    return route.routeConfig?.data?.['noindex'] === true;
  }
}
