import { catchError, map, type Observable, of, startWith } from 'rxjs';
import type { Olympic } from '../models/olympic';
import { toDataLoadError } from '../services/data-load-error';
import type { PageState } from './page-state';

export function olympicLoadState(
  source: Observable<readonly Olympic[]>,
): Observable<PageState<readonly Olympic[]>> {
  return source.pipe(
    map((data): PageState<readonly Olympic[]> => ({
      status: data.length > 0 ? 'success' : 'empty',
      data,
    })),
    catchError((error: unknown) => of<PageState<readonly Olympic[]>>({
      status: 'error',
      message: toDataLoadError(error).message,
    })),
    startWith({ status: 'loading' } as const),
  );
}
