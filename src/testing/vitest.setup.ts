if (typeof globalThis.IntersectionObserver === 'undefined') {
  class NoopIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: readonly number[] = [];

    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
      void _callback;
      void _options;
    }

    disconnect(): void {
      void 0;
    }

    observe(_target: Element): void {
      void _target;
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }

    unobserve(_target: Element): void {
      void _target;
    }
  }

  globalThis.IntersectionObserver = NoopIntersectionObserver;
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  class NoopResizeObserver implements ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {
      void _callback;
    }

    disconnect(): void {
      void 0;
    }

    observe(_target: Element, _options?: ResizeObserverOptions): void {
      void _target;
      void _options;
    }

    unobserve(_target: Element): void {
      void _target;
    }
  }

  globalThis.ResizeObserver = NoopResizeObserver;
}
