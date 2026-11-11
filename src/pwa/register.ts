export function registerServiceWorker() {
  if (typeof window === 'undefined') return
  if (location.protocol === 'file:') return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* offline shell is optional; the page still runs */
    })
  })
}
