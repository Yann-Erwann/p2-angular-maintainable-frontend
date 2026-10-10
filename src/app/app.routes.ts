import { type Routes } from '@angular/router';

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
    loadChildren: () =>
      import('./olympics/routing/olympics.routes').then((module) => module.default),
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page not found | Olympic Games',
    data: { noindex: true },
  },
];
