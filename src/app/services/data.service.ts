import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { Olympic } from '../models/olympic';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly olympicUrl = './assets/mock/olympic.json';

  getOlympics(): Observable<readonly Olympic[]> {
    return this.http.get<readonly Olympic[]>(this.olympicUrl);
  }
}
