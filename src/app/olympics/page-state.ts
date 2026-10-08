export type PageState<T = void> =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'empty'; readonly data?: T }
  | { readonly status: 'not-found' }
  | { readonly status: 'error'; readonly message: string };
