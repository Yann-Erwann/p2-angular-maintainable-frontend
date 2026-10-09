import { type Routes } from '@angular/router';

import { HomeComponent } from '../pages/home/home.component';

export const OLYMPICS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
    title: 'Medals by country | Olympic Games',
  },
  {
    path: 'country/:id',
    loadComponent: () =>
      import('../pages/country/country.component').then((module) => module.CountryComponent),
  },
];
