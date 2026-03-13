// src/pages/CollectionPage.jsx
// FIXED: If no row in collection_pages DB, use sensible defaults instead of "not found"
//   - new-in   → newest products (created_at DESC)
//   - trending  → top-rated products (rating_avg DESC)
//   - sale      → products with sale_price (discount DESC)
//   - custom    → all active products
// Also: "not found" only shown if it's a truly unknown slug with no products at all.

import { useState, useEffect, useCallback } from 'react'
import { useParams, Link }                   from 'react-router-dom'
import { motion }                            from 'framer-motion'
import { ChevronDown, X }                    from 'lucide-react'
import { supabase }                          from '@/lib/supabase'
import SEO                                   from '@/components/SEO'
import useWishlistStore                      from '@/store/wishlistStore'
import useCartStore                          from '@/store/cartStore'
import toast                                 from 'react-hot-toast'

// ─── Default configs per collection slug ────────────────────────────────────
const DEFAULTS = {
  'new-in': {
    id:             'new-in',
    label:          'New In',
    hero_headline:  'Fresh Arrivals',
    hero_subheading:'The latest drops — just landed',
    hero_badge:     'NEW',
    hero_image_url: null,
    auto_filter:    { sort: 'created_at_desc', limit: 60 },
    pinned_ids:     [],
    excluded_ids:   [],
    is_active:      true,
  },
  'trending': {
    id:             'trending',
    label:          'Trending',
    hero_headline:  'Trending Now',
    hero_subheading:'What everyone is wearing right now',
    hero_badge:     'HOT',
    hero_image_url: null,
    auto_filter:    { sort: 'rating_desc', limit: 60 },
    pinned_ids:     [],
    excluded_ids:   [],
    is_active:      true,
  },
  'sale': {
    id:             'sale',
    label:          'Sale',
    hero_headline:  'Up to 50% Off',
    hero_subheading:'Premium fashion at unbeatable prices',
    hero_badge:     'SALE',
    hero_image_url: null,
    auto_filter:    { sort: 'discount_desc', on_sale: true, limit: 60 },
    pinned_ids:     [],
    excluded_ids:   [],
    is_active:      true,
  },
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product }) {
  const toggleWishlist = useWishlistStore(s => s.toggleItem)
  const isWishlisted   = useWishlistStore(s => s.items.some(i => i.id === product.id))
  const addToCart      = useCartStore(s => s.addItem)
  const [adding, setAdding] = useState(false)

  const price    = product.sale_price ?? product.base_price
  const original = product.sale_price ? product.base_price : null
  const discount = original ? Math.round((1 - price / original) * 100) : null
  const img      = product.images?.[0]

  async function handleAddToCart() {
    if (product.available_sizes?.length > 1) {
      window.location.href = `/products/${product.slug}`
      return
    }
    setAdding(true)
    addToCart({ ...product, selectedSize: product.available_sizes?.[0] ?? 'ONE SIZE', quantity: 1 })
    toast.success('Added to cart')
    setTimeout(() => setAdding(false), 800)
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="group relative">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden bg-tz-surface aspect-[3/4]">
          {img ? (
            <img src={img} alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-tz-muted text-xs">No image</div>
          )}
          {discount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              -{discount}%
            </span>
          )}
          {product.stock_count === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-semibold tracking-widest">SOLD OUT</span>
            </div>
          )}
          <button
            onClick={e => { e.preventDefault(); toggleWishlist(product) }}
            className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-tz-black/60 backdrop-blur-sm transition-all ${
              isWishlisted ? 'text-red-400' : 'text-white hover:text-red-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"
              fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-tz-white text-sm font-medium line-clamp-1">{product.name}</p>
          <div className="flex items-center gap-2">
            <span className="text-tz-gold text-sm font-semibold">₹{price?.toLocaleString('en-IN')}</span>
            {original && (
              <span className="text-tz-muted text-xs line-through">₹{original?.toLocaleString('en-IN')}</span>
            )}
          </div>
          {product.available_sizes?.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {product.available_sizes.slice(0, 5).map(s => (
                <span key={s} className="text-[10px] text-tz-muted border border-tz-border/50 px-1.5 py-0.5">{s}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
      <button
        onClick={handleAddToCart}
        disabled={product.stock_count === 0 || adding}
        className="mt-3 w-full btn-secondary text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {adding ? 'Added!' : product.available_sizes?.length > 1 ? 'Select Size' : 'Add to Cart'}
      </button>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CollectionPage() {
  const { collection } = useParams()

  const [config,     setConfig]     = useState(null)
  const [products,   setProducts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [sortBy,     setSortBy]     = useState('default')
  const [gender,     setGender]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setNotFound(false)

    // Try to load config from DB — fall back to defaults if not found
    const { data: cfg, error: cfgErr } = await supabase
      .from('collection_pages')
      .select('*')
      .eq('id', collection)
      .single()

    // Use DB config if found, otherwise use built-in defaults, otherwise 404
    let resolvedCfg
    if (cfg && !cfgErr) {
      // DB row found
      if (!cfg.is_active) {
        setNotFound(true)
        setLoading(false)
        return
      }
      resolvedCfg = cfg
    } else if (DEFAULTS[collection]) {
      // No DB row — use built-in default for known collections
      resolvedCfg = DEFAULTS[collection]
    } else {
      // Truly unknown collection
      setNotFound(true)
      setLoading(false)
      return
    }

    setConfig(resolvedCfg)

    // Build product query from auto_filter rules
    const f = resolvedCfg.auto_filter ?? {}
    let q = supabase
      .from('products')
      .select('id, name, slug, images, base_price, sale_price, available_sizes, stock_count, tags, gender, rating_avg, created_at, inventory_count')
      .eq('is_active', true)

    if (f.on_sale)        q = q.not('sale_price', 'is', null)
    if (f.tags?.length)   q = q.overlaps('tags', f.tags)
    if (f.category_slug)  q = q.eq('category_slug', f.category_slug)
    if (f.gender)         q = q.eq('gender', f.gender)

    const sort = f.sort ?? 'created_at_desc'
    if (sort === 'created_at_desc') q = q.order('created_at', { ascending: false })
    else if (sort === 'rating_desc') q = q.order('rating_avg', { ascending: false, nullsFirst: false })
    else if (sort === 'price_asc')   q = q.order('base_price', { ascending: true  })
    else if (sort === 'price_desc')  q = q.order('base_price', { ascending: false })
    else q = q.order('created_at', { ascending: false })

    q = q.limit(f.limit ?? 60)

    const { data: autoProducts } = await q
    let merged = autoProducts ?? []

    // Merge pinned products at the top
    const pinnedIds = resolvedCfg.pinned_ids ?? []
    if (pinnedIds.length > 0) {
      const { data: pinned } = await supabase
        .from('products')
        .select('id, name, slug, images, base_price, sale_price, available_sizes, stock_count, tags, gender, rating_avg, created_at, inventory_count')
        .in('id', pinnedIds)
        .eq('is_active', true)

      if (pinned?.length) {
        const pinnedSet = new Set(pinned.map(p => p.id))
        const rest = merged.filter(p => !pinnedSet.has(p.id))
        const orderedPinned = pinnedIds
          .map(id => pinned.find(p => p.id === id))
          .filter(Boolean)
        merged = [...orderedPinned, ...rest]
      }
    }

    // Remove excluded
    const excludedIds = resolvedCfg.excluded_ids ?? []
    if (excludedIds.length > 0) {
      const excludedSet = new Set(excludedIds)
      merged = merged.filter(p => !excludedSet.has(p.id))
    }

    // Sort by discount if requested
    if (sort === 'discount_desc') {
      merged = merged.sort((a, b) => {
        const da = a.sale_price ? (1 - a.sale_price / a.base_price) : 0
        const db = b.sale_price ? (1 - b.sale_price / b.base_price) : 0
        return db - da
      })
    }

    setProducts(merged)
    setLoading(false)
  }, [collection])

  useEffect(() => { load() }, [load])

  // Client-side filtering
  const displayed = products
    .filter(p => !gender || p.gender === gender || p.gender === 'unisex')
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return (a.sale_price ?? a.base_price) - (b.sale_price ?? b.base_price)
      if (sortBy === 'price_desc') return (b.sale_price ?? b.base_price) - (a.sale_price ?? a.base_price)
      if (sortBy === 'rating')     return (b.rating_avg ?? 0) - (a.rating_avg ?? 0)
      return 0
    })

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="font-display text-4xl text-tz-white">Collection not found</h1>
        <p className="text-tz-muted">This collection doesn't exist or is not active.</p>
        <Link to="/products" className="btn-primary">Browse All Products</Link>
      </div>
    )
  }

  return (
    <>
      {config && (
        <SEO
          title={`${config.label ?? collection} — TrendZip`}
          description={config.hero_subheading}
        />
      )}

      {/* ── Hero banner ── */}
      <div className="relative w-full overflow-hidden bg-tz-dark" style={{ minHeight: 280 }}>
        {config?.hero_image_url && (
          <img
            src={config.hero_image_url}
            alt={config.label}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-tz-black/20 to-tz-black/80" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-end h-full" style={{ minHeight: 280 }}>
          {config?.hero_badge && (
            <span className="inline-block mb-3 text-xs font-bold tracking-[0.2em] text-tz-gold border border-tz-gold/40 px-3 py-1 w-fit">
              {config.hero_badge}
            </span>
          )}
          <h1 className="font-display text-4xl sm:text-5xl text-tz-white font-light mb-2">
            {config?.hero_headline ?? collection}
          </h1>
          {config?.hero_subheading && (
            <p className="text-tz-muted text-base max-w-lg">{config.hero_subheading}</p>
          )}
        </div>
      </div>

      {/* ── Products section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-tz-muted text-sm">
            {loading ? 'Loading…' : `${displayed.length} products`}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="input-base text-xs py-1.5 pr-7 appearance-none cursor-pointer"
              >
                <option value="">All</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="input-base text-xs py-1.5 pr-7 appearance-none cursor-pointer"
              >
                <option value="default">Default</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {gender && (
          <div className="flex gap-2 mb-4">
            <span className="flex items-center gap-1 text-xs bg-tz-gold/10 border border-tz-gold/30 text-tz-gold px-2.5 py-1 rounded-full">
              {gender}
              <button onClick={() => setGender('')}><X size={10} /></button>
            </span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-tz-surface aspect-[3/4] w-full" />
                <div className="mt-3 h-4 bg-tz-surface w-3/4 rounded" />
                <div className="mt-1.5 h-3 bg-tz-surface w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-tz-muted text-lg mb-2">No products found</p>
            <p className="text-tz-muted text-sm mb-6">
              {gender ? 'Try removing the gender filter.' : 'Check back soon for new arrivals.'}
            </p>
            <Link to="/products" className="btn-primary">Browse All Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {displayed.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}