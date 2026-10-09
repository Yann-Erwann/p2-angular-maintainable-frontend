import { provideHttpClient } from '@angular/common/http';
import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';

/** Le hash permet l’accès direct aux fiches sur un hébergement statique. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
  ],
};
