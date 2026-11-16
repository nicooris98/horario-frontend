import { DestroyRef, signal, WritableSignal } from '@angular/core';

const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

export function createIsMobileSignal(destroyRef: DestroyRef): WritableSignal<boolean> {
  const isBrowser = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const isMobile = signal(isBrowser ? window.matchMedia(MOBILE_MEDIA_QUERY).matches : false);

  if (isBrowser) {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const listener = (event: MediaQueryListEvent) => isMobile.set(event.matches);
    mediaQuery.addEventListener('change', listener);
    destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', listener));
  }

  return isMobile;
}
