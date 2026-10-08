import { type Routes } from '@angular/router';

import { CountryComponent } from './pages/country/country.component';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
  },
  {
    path: 'country/:countryName',
    component: CountryComponent,
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
