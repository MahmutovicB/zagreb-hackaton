/**
 * Module-level flag — persists across soft navigations (client-side routing)
 * but resets on hard refresh / first load, which is exactly what we want.
 */
export let preloaderDone = false

export function markPreloaderDone() {
  preloaderDone = true
}
