import { CURRENCY_SYMBOL } from './constants'

// ─── Currency Formatting ──────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupee price string.
 * e.g. 1999 → "₹1,999"
 */
export function formatPrice(amount) {
  if (amount === null || amount === undefined) return `${CURRENCY_SYMBOL}0`
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calculate discount percentage between original and sale price.
 * e.g. (2000, 1500) → 25
 */
export function calcDiscount(original, sale) {
  if (!original || !sale || original <= sale) return 0
  return Math.round(((original - sale) / original) * 100)
}

// ─── String Utilities ─────────────────────────────────────────────────────────

/**
 * Convert a string to a URL-safe slug.
 * e.g. "Men's T-Shirt (Blue)" → "mens-t-shirt-blue"
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Capitalise first letter of each word.
 * e.g. "men's fashion" → "Men's Fashion"
 */
export function titleCase(str) {
  if (!str) return ''
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1))
}

/**
 * Truncate a string to a max length, adding ellipsis.
 */
export function truncate(str, maxLength = 80) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Format a full name from first + last parts.
 */
export function fullName(first, last) {
  return [first, last].filter(Boolean).join(' ')
}

/**
 * Get initials from a full name.
 * e.g. "Arjun Sharma" → "AS"
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Format a date string in human-readable Indian format.
 * e.g. "2024-01-15" → "15 Jan 2024"
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  }).format(new Date(dateStr))
}

/**
 * Format a date with time.
 * e.g. → "15 Jan 2024, 3:45 PM"
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateStr))
}

/**
 * Get relative time string.
 * e.g. → "2 days ago"
 */
export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diff = (new Date(dateStr) - Date.now()) / 1000

  const thresholds = [
    { unit: 'year',   secs: 31536000 },
    { unit: 'month',  secs: 2592000  },
    { unit: 'week',   secs: 604800   },
    { unit: 'day',    secs: 86400    },
    { unit: 'hour',   secs: 3600     },
    { unit: 'minute', secs: 60       },
    { unit: 'second', secs: 1        },
  ]

  for (const { unit, secs } of thresholds) {
    if (Math.abs(diff) >= secs) {
      return rtf.format(Math.round(diff / secs), unit)
    }
  }
  return 'just now'
}

// ─── Array Utilities ──────────────────────────────────────────────────────────

/**
 * Chunk an array into sub-arrays of a given size.
 * e.g. ([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]
 */
export function chunk(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

/**
 * Remove duplicates from array of objects by key.
 */
export function uniqueBy(arr, key) {
  const seen = new Set()
  return arr.filter(item => {
    const val = item[key]
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

// ─── Object Utilities ─────────────────────────────────────────────────────────

/**
 * Remove undefined / null values from an object (used before API calls).
 */
export function cleanObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

/**
 * Deep clone a plain JSON-serialisable object.
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone) {
  // Indian mobile number: optional +91, then 10 digits starting with 6-9
  return /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))
}

export function isValidPincode(pincode) {
  return /^[1-9]\d{5}$/.test(pincode)
}

// ─── URL / Query String ───────────────────────────────────────────────────────

/**
 * Build a URL query string from an object, skipping null/empty values.
 * e.g. { page: 1, sort: 'price:asc', tag: null } → "page=1&sort=price%3Aasc"
 */
export function buildQueryString(params) {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      sp.set(key, String(value))
    }
  }
  const str = sp.toString()
  return str ? `?${str}` : ''
}

/**
 * Parse a query string into an object with typed values.
 */
export function parseQueryString(search) {
  const sp = new URLSearchParams(search)
  const result = {}
  for (const [key, value] of sp.entries()) {
    // Coerce numeric strings to numbers
    result[key] = isNaN(Number(value)) ? value : Number(value)
  }
  return result
}

// ─── Image Utilities ──────────────────────────────────────────────────────────

/**
 * Return a placeholder image URL (uses a local svg data URI — no external deps).
 */
export function placeholderImage(width = 400, height = 500) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><rect width='100%' height='100%' fill='%231a1a1a'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23666' dominant-baseline='middle' text-anchor='middle'>No Image</text></svg>`
  return `data:image/svg+xml,${svg}`
}

/**
 * Given a product images array, return the first valid URL or placeholder.
 */
export function getProductImage(images, index = 0) {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return placeholderImage()
  }
  return images[index] ?? images[0] ?? placeholderImage()
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

/**
 * Debounce — returns a function that delays invoking fn until after wait ms.
 */
export function debounce(fn, wait = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

/**
 * Generate a simple unique ID (not UUID — just for client-side keys).
 */
export function uid() {
  return Math.random().toString(36).slice(2, 11)
}

/**
 * Clamp a number between min and max.
 */
export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max)
}

/**
 * Check if we're in a browser environment.
 */
export const isBrowser = typeof window !== 'undefined'