import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, shareReplay, throwError } from 'rxjs';

import type { Olympic } from '../models/olympic.model';
import { toOlympicDataLoadError } from './olympic-data-load-error';
import { validateOlympicData } from './olympic-data.validator';

/**
 * Charge et valide la collection, avec un cache partagé en mémoire.
 *
 * Une réponse réussie est réutilisée ; une erreur permet une nouvelle tentative.
 * Le départ du dernier consommateur annule un chargement encore en cours.
 */
@Injectable({ providedIn: 'root' })
export class OlympicDataService {
  /** Client HTTP utilisé pour lire le fichier de données local. */
  private readonly http = inject(HttpClient);
  /** Chemin relatif conservant le préfixe du site déployé. */
  private readonly olympicUrl = './assets/mock/olympic.json';

  /** Réponse partagée et mémorisée tant qu’elle possède un consommateur. */
  private readonly olympics$ = this.http.get<unknown>(this.olympicUrl).pipe(
    map(validateOlympicData),
    catchError((error: unknown) => throwError(() => toOlympicDataLoadError(error))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Retourne les données validées, en réutilisant la requête réussie. */
  getOlympics(): Observable<readonly Olympic[]> {
    return this.olympics$;
  }
}
