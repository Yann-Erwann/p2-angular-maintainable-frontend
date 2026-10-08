import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, type Observable, throwError } from 'rxjs';

import type { Olympic } from '../models/olympic';
import { toDataLoadError } from './data-load-error';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly olympicUrl = './assets/mock/olympic.json';

  getOlympics(): Observable<readonly Olympic[]> {
    return this.http.get<readonly Olympic[]>(this.olympicUrl).pipe(
      catchError((error: unknown) => throwError(() => toDataLoadError(error))),
    );
  }
}
