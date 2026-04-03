/**
 * Registers the service worker on mount.
 * Called once from main.tsx (not React hook — just a utility).
 */
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => { /* silent — SW not critical */ })
    })
  }
}
