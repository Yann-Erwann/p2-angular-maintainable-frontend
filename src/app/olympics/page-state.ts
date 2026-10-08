export type PageState =
  | { readonly status: 'loading' }
  | { readonly status: 'success' }
  | { readonly status: 'empty' }
  | { readonly status: 'not-found' }
  | { readonly status: 'error'; readonly message: string };
