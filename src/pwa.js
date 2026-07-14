// Service-worker registration + forced update checks.
//
// The plugin's default auto-injected script registers the SW once on
// `load` and never looks again. That's fine on desktop, but iOS Safari
// resumes a backgrounded tab/home-screen PWA from a frozen bfcache
// snapshot — no real navigation happens, so the browser's normal
// "re-fetch sw.js and diff it" check never fires on its own. A scorekeeper
// who opened the app once before an event-day deploy would be stuck on
// the old build until they force-quit, no matter how many times they pull
// to refresh.
//
// So we check for updates ourselves on every point the app could plausibly
// have gone stale (page becomes visible again, regains focus, on an
// interval) — the browser only needs a genuine network fetch of sw.js
// (server-side it's already `Cache-Control: no-cache`) for the standard
// install → activate pipeline to kick in. registerType: 'autoUpdate' in
// vite.config.js already bakes skipWaiting + clientsClaim into the worker,
// so once a new one installs it takes over immediately — we just reload
// onto it so nobody is left running stale JS against fresh data.
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => registration.update().catch(() => {})
    window.addEventListener('pageshow', check) // fires on iOS bfcache resume, unlike 'load'
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
    setInterval(check, 60_000)
  },
  onNeedRefresh() {
    updateSW(true)
  },
})

let reloaded = false
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (reloaded) return
  reloaded = true
  window.location.reload()
})
