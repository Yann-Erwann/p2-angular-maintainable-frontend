/** Statut d’annonce sans données métier ; le message d’erreur doit être affichable. */
export type PageFeedbackState =
  | { readonly status: 'loading' }
  | { readonly status: 'success' }
  | { readonly status: 'empty' }
  | { readonly status: 'not-found' }
  | { readonly status: 'error'; readonly message: string };
