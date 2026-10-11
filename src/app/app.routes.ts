import { type Routes } from '@angular/router';
import { OLYMPICS_ROUTES } from './olympics/routing/olympics.routes';
import { NotFoundComponent } from './pages/not-found/not-found.component';

/** Le titre d’une fiche est complété après chargement par {@link CountryComponent}. */
export const routes: Routes = [
  {
    path: 'not-found',
    component: NotFoundComponent,
    title: 'Page not found | Olympic Games',
    data: { noindex: true },
  },
  {
    path: '',
    children: OLYMPICS_ROUTES,
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page not found | Olympic Games',
    data: { noindex: true },
  },
];
