import { type Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
    title: 'Medals by country | Olympic Games',
  },
  {
    path: 'country/:id',
    loadComponent: () => import('./pages/country/country.component').then((module) => module.CountryComponent),
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
    title: 'Page not found | Olympic Games',
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page not found | Olympic Games',
  },
];
