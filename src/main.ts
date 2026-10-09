import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Keep previously shared hash routes usable with path-based routing.
function restoreLegacyRoute(): boolean {
  const legacyRoute = window.location.hash;
  if (legacyRoute.startsWith('#/') && !legacyRoute.startsWith('#//')) {
    const basePath = new URL(document.baseURI).pathname;
    window.history.replaceState(window.history.state, '', basePath + legacyRoute.slice(2));
    return true;
  }
  if (window.location.href.endsWith('#')) {
    window.history.replaceState(window.history.state, '', window.location.href.slice(0, -1));
    return true;
  }
  return false;
}
restoreLegacyRoute();
window.addEventListener('hashchange', () => {
  if (restoreLegacyRoute()) window.dispatchEvent(new PopStateEvent('popstate'));
});

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
