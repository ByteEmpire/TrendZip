// src/hooks/useRecentlyViewed.js
// Stores up to 8 recently viewed product slugs in localStorage.
// Usage:
//   const { addSlug, getSlugs } = useRecentlyViewed()
//   addSlug(product.slug)   ← call on ProductDetail mount
//   getSlugs()              ← returns array of slugs, newest first

const KEY      = 'tz_recently_viewed'
const MAX      = 8

export default function useRecentlyViewed() {
  function getSlugs() {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') }
    catch { return [] }
  }

  function addSlug(slug) {
    if (!slug) return
    try {
      const current = getSlugs().filter(s => s !== slug)   // remove dupe
      const updated = [slug, ...current].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(updated))
    } catch { /* silently ignore storage errors */ }
  }

  function clearAll() {
    try { localStorage.removeItem(KEY) } catch {}
  }

  return { getSlugs, addSlug, clearAll }
}