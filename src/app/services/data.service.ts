import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, shareReplay, throwError } from 'rxjs';

import type { Olympic } from '../models/olympic';
import { toDataLoadError } from './data-load-error';
import { validateOlympicData } from './olympic-data.validator';

/**
 * Charge et valide la collection, avec un cache partagé en mémoire.
 *
 * Une réponse réussie est réutilisée ; une erreur permet une nouvelle tentative.
 * Le départ du dernier consommateur annule un chargement encore en cours.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  /** Client HTTP de la ressource olympique. */
  private readonly http = inject(HttpClient);
  /** Chemin relatif conservant le préfixe du site déployé. */
  private readonly olympicUrl = './assets/mock/olympic.json';

  /** Réponse validée partagée ; les erreurs ne restent pas en cache. */
  private readonly olympics$ = this.http.get<unknown>(this.olympicUrl).pipe(
    map(validateOlympicData),
    catchError((error: unknown) => throwError(() => toDataLoadError(error))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** La souscription déclenche le chargement ou réutilise la réponse réussie. */
  getOlympics(): Observable<readonly Olympic[]> {
    return this.olympics$;
  }
}
