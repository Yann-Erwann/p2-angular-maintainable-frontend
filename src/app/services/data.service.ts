import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, of, throwError } from 'rxjs';

import type { Olympic } from '../models/olympic';
import { toDataLoadError } from './data-load-error';
import { validateOlympicData } from './olympic-data.validator';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly olympicUrl = './assets/mock/olympic.json';

  getOlympics(): Observable<readonly Olympic[]> {
    return this.http.get<unknown>(this.olympicUrl).pipe(
      map(validateOlympicData),
      catchError((error: unknown) => throwError(() => toDataLoadError(error))),
    );
  }

  getCountryById(id: number): Observable<Olympic | undefined> {
    if (!Number.isSafeInteger(id) || id <= 0) {
      return of(undefined);
    }
    return this.getOlympics().pipe(
      map((countries) => countries.find((country) => country.id === id)),
    );
  }
}
