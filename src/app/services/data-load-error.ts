import { HttpErrorResponse } from '@angular/common/http';

export class DataLoadError extends Error {
  override readonly name = 'DataLoadError';
}

export function toDataLoadError(cause: unknown): DataLoadError {
  if (cause instanceof DataLoadError) {
    return cause;
  }

  let message = 'Unable to load Olympic data. Please try again.';
  if (cause instanceof HttpErrorResponse) {
    if (cause.status === 0) {
      message = 'Unable to connect. Check your connection and try again.';
    } else if (cause.status === 404) {
      message = 'Olympic data could not be found.';
    } else if (cause.status >= 500) {
      message = 'Olympic data is temporarily unavailable. Please try again later.';
    }
  }

  return new DataLoadError(message, { cause });
}
