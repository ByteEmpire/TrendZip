// src/lib/analytics.js
// Google Analytics 4 — ecommerce event helpers
// ─────────────────────────────────────────────
// SETUP:
//   1. After deployment, get your GA4 Measurement ID (G-XXXXXXXXXX)
//   2. Set VITE_GA_ID=G-XXXXXXXXXX in your .env file
//   3. Add the <script> tags from GA4_index_html_PATCH.txt to index.html
//   Until the ID is set, all tracking calls are silently ignored (no errors).

const GA_ID = import.meta.env.VITE_GA_ID || ''

// Safe gtag wrapper — no errors if GA not loaded
function gtag(...args) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  window.gtag(...args)
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// Called once on app mount from App.jsx
export function initGA() {
  if (!GA_ID) return
  window.dataLayer = window.dataLayer || []
  window.gtag = function () { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    send_page_view: false,  // We send manually via trackPageView
    currency: 'INR',
  })
}

// ─── Page Views ───────────────────────────────────────────────────────────────
// Call in App.jsx whenever location changes
export function trackPageView(path, title) {
  if (!GA_ID) return
  gtag('event', 'page_view', {
    page_path:  path,
    page_title: title || document.title,
    send_to:    GA_ID,
  })
}

// ─── Product View ─────────────────────────────────────────────────────────────
// Call in ProductDetail when product loads
// product: { id, name, base_price, sale_price, category_slug }
export function trackViewItem(product) {
  if (!GA_ID || !product) return
  gtag('event', 'view_item', {
    currency: 'INR',
    value: product.sale_price ?? product.base_price ?? 0,
    items: [{
      item_id:       product.id,
      item_name:     product.name,
      item_category: product.category_slug ?? product.category ?? '',
      price:         product.sale_price ?? product.base_price ?? 0,
      quantity:      1,
    }],
  })
}

// ─── Add to Cart ──────────────────────────────────────────────────────────────
// Call in cartStore.addItem or ProductDetail after successful add
// item: { id/product_id, name, price, quantity, size, category_slug }
export function trackAddToCart(item) {
  if (!GA_ID || !item) return
  gtag('event', 'add_to_cart', {
    currency: 'INR',
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [{
      item_id:       item.product_id ?? item.id,
      item_name:     item.name,
      item_variant:  item.size ?? '',
      item_category: item.category_slug ?? '',
      price:         item.price ?? 0,
      quantity:      item.quantity ?? 1,
    }],
  })
}

// ─── Begin Checkout ───────────────────────────────────────────────────────────
// Call in Checkout.jsx on mount / when user reaches checkout
// cartItems: array of cart items, total: number
export function trackBeginCheckout(cartItems = [], total = 0) {
  if (!GA_ID) return
  gtag('event', 'begin_checkout', {
    currency: 'INR',
    value:    total,
    items: cartItems.map(item => ({
      item_id:   item.product_id ?? item.id,
      item_name: item.name,
      price:     item.price ?? 0,
      quantity:  item.quantity ?? 1,
    })),
  })
}

// ─── Purchase ─────────────────────────────────────────────────────────────────
// Call in Checkout.jsx after successful payment + order creation
// order: { id, total_amount, coupon_code, discount_amount }
// items: array of cart items
export function trackPurchase(order, items = []) {
  if (!GA_ID || !order) return
  gtag('event', 'purchase', {
    currency:      'INR',
    transaction_id: order.id,
    value:          order.total_amount ?? 0,
    coupon:         order.coupon_code  ?? '',
    discount:       order.discount_amount ?? 0,
    items: items.map(item => ({
      item_id:   item.product_id ?? item.id,
      item_name: item.name,
      price:     item.price ?? 0,
      quantity:  item.quantity ?? 1,
    })),
  })
}

// ─── Search ───────────────────────────────────────────────────────────────────
// Call when user submits search
export function trackSearch(query) {
  if (!GA_ID || !query) return
  gtag('event', 'search', { search_term: query })
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export function trackAddToWishlist(product) {
  if (!GA_ID || !product) return
  gtag('event', 'add_to_wishlist', {
    currency: 'INR',
    value:    product.sale_price ?? product.base_price ?? 0,
    items: [{
      item_id:   product.id,
      item_name: product.name,
      price:     product.sale_price ?? product.base_price ?? 0,
    }],
  })
}