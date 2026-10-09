import { HttpErrorResponse } from '@angular/common/http';
import { OlympicDataValidationError } from './olympic-data.validator';

/** Erreur affichable dont la cause technique reste disponible via `Error.cause`. */
export class DataLoadError extends Error {
  /** Catégorie stable des erreurs de présentation. */
  override readonly name = 'DataLoadError';
}

/**
 * Traduit la cause en message affichable, sans détail serveur.
 * Une {@link DataLoadError} existante est conservée avec sa cause.
 */
export function toDataLoadError(cause: unknown): DataLoadError {
  if (cause instanceof DataLoadError) {
    return cause;
  }

  let message = 'Unable to load Olympic data. Please try again.';
  if (cause instanceof OlympicDataValidationError) {
    message = 'Olympic data is invalid. Please try again later.';
  } else if (cause instanceof HttpErrorResponse) {
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
