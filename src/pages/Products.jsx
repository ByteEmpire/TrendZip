import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SlidersHorizontal, X, ChevronDown, ChevronUp,
  Package, Heart, Star, Search, Check
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import useWishlistStore from '@/store/wishlistStore'   // ✅ FIXED: default import
import useAuthStore from '@/store/authStore'           // ✅ FIXED: default import
import SEO from '@/components/SEO'

// ─── Constants ────────────────────────────────────────────────────────────────
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '26', '28', '30', '32', '34', '36']
const PRICE_RANGES = [
  { label: 'Under ₹500',      min: 0,    max: 500   },
  { label: '₹500 – ₹1,000',   min: 500,  max: 1000  },
  { label: '₹1,000 – ₹2,500', min: 1000, max: 2500  },
  { label: '₹2,500 – ₹5,000', min: 2500, max: 5000  },
  { label: 'Above ₹5,000',    min: 5000, max: Infinity },
]
const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First'         },
  { value: 'price_asc',  label: 'Price: Low to High'   },
  { value: 'price_desc', label: 'Price: High to Low'   },
  { value: 'rating',     label: 'Top Rated'            },
]

// ─── FilterSection (accordion) ───────────────────────────────────────────────
function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-tz-border/50 py-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-tz-white text-sm font-semibold"
      >
        {title}
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-tz-muted" />
          : <ChevronDown className="w-3.5 h-3.5 text-tz-muted" />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product }) {
  const { items: wishlist, addItem, removeItem } = useWishlistStore()
  const user = useAuthStore(s => s.user)
  const isWishlisted = wishlist.some(w => w.product_id === product.id || w.id === product.id)

  // ✅ FIXED: use sale_price ?? base_price — not a non-existent 'price' column
  const displayPrice   = product.sale_price ?? product.base_price
  // ✅ FIXED: compare price is base_price (shown when sale_price is lower)
  const comparePrice   = product.sale_price && product.sale_price < product.base_price
    ? product.base_price
    : null

  const toggleWishlist = (e) => {
    e.preventDefault()
    if (!user) return
    if (isWishlisted) removeItem(product.id)
    else addItem({
      id:         product.id,
      product_id: product.id,
      name:       product.name,
      price:      displayPrice,
      image:      product.images?.[0],
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      {/* ✅ FIXED: Link uses product.slug not product.id */}
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-tz-black mb-3">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-tz-muted">
              <Package className="w-10 h-10 opacity-20" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {comparePrice && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">SALE</span>
            )}
            {/* ✅ FIXED: removed product.is_new (not in schema) */}
            {product.inventory_count <= 5 && product.inventory_count > 0 && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                Only {product.inventory_count} left
              </span>
            )}
          </div>

          {/* Wishlist */}
          {user && (
            <button
              onClick={toggleWishlist}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
          )}
        </div>

        <p className="text-tz-white text-sm font-medium truncate">{product.name}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          {/* ✅ FIXED: use displayPrice */}
          <span className="text-tz-gold font-semibold">₹{displayPrice?.toLocaleString('en-IN')}</span>
          {comparePrice && (
            <span className="text-tz-muted text-xs line-through">
              ₹{comparePrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Main Products page ───────────────────────────────────────────────────────
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [totalCount,  setTotalCount]  = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ✅ FIXED: all URL params correctly named
  const selectedCategory = searchParams.get('category') || ''
  const selectedSizes    = useMemo(() => searchParams.getAll('size'), [searchParams])
  const selectedPriceKey = searchParams.get('price') || ''
  const sort             = searchParams.get('sort') || 'newest'
  const search           = searchParams.get('q') || ''

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const toggleSize = (size) => {
    const next    = new URLSearchParams(searchParams)
    const current = next.getAll('size')
    if (current.includes(size)) {
      next.delete('size')
      current.filter(s => s !== size).forEach(s => next.append('size', s))
    } else {
      next.append('size', size)
    }
    setSearchParams(next)
  }

  const clearAll = () => setSearchParams({})

  const priceRange = useMemo(
    () => PRICE_RANGES.find(p => p.label === selectedPriceKey),
    [selectedPriceKey]
  )

  const activeCount =
    (selectedCategory ? 1 : 0) +
    selectedSizes.length +
    (selectedPriceKey ? 1 : 0) +
    (search ? 1 : 0)

  // ── Fetch categories ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('products')
      // ✅ FIXED: use category_slug column
      .select('category_slug')
      .not('category_slug', 'is', null)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map(p => p.category_slug).filter(Boolean))].sort()
          setCategories(unique)
        }
      })
  }, [])

  // ── Fetch products ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)

      // ✅ FIXED: select correct columns only (no non-existent 'price', 'sizes', 'compare_price', 'is_new')
      let query = supabase
        .from('products')
        .select(
          'id, name, slug, images, base_price, sale_price, category_slug, inventory_count, rating_avg, is_featured',
          { count: 'exact' }
        )
        .eq('is_active', true)

      // ✅ FIXED: category_slug column
      if (selectedCategory) query = query.eq('category_slug', selectedCategory)

      // ✅ FIXED: filter on sale_price (falls back logic handled in JS)
      // Price filter: use base_price as the comparison base
      if (priceRange) {
        query = query.gte('base_price', priceRange.min)
        if (priceRange.max !== Infinity) query = query.lte('base_price', priceRange.max)
      }

      // ✅ FIXED: available_sizes column (not 'sizes')
      if (selectedSizes.length) {
        query = query.overlaps('available_sizes', selectedSizes)
      }

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      // ✅ FIXED: sort uses correct column names
      switch (sort) {
        case 'price_asc':  query = query.order('base_price', { ascending: true });  break
        case 'price_desc': query = query.order('base_price', { ascending: false }); break
        // ✅ FIXED: rating_avg not avg_rating
        case 'rating':     query = query.order('rating_avg', { ascending: false, nullsFirst: false }); break
        default:           query = query.order('created_at', { ascending: false }); break
      }

      const { data, count, error } = await query
      if (!error) {
        setProducts(data ?? [])
        setTotalCount(count ?? 0)
      }
      setLoading(false)
    }

    fetchProducts()
  }, [selectedCategory, selectedSizes.join(','), selectedPriceKey, sort, search])

  // ── Active filter tags ────────────────────────────────────────────────────
  const activeTags = [
    selectedCategory && { label: selectedCategory,  clear: () => setParam('category', '') },
    selectedPriceKey && { label: selectedPriceKey,  clear: () => setParam('price', '')    },
    ...selectedSizes.map(s => ({ label: `Size: ${s}`, clear: () => toggleSize(s) })),
    search && { label: `"${search}"`,               clear: () => setParam('q', '')        },
  ].filter(Boolean)

  // ── Sidebar content ───────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="space-y-0">
      <div className="flex items-center justify-between pb-4 border-b border-tz-border/50">
        <p className="text-tz-white font-semibold">Filters</p>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-tz-gold text-xs hover:underline">
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* ✅ FIXED: category_slug used throughout */}
      <FilterSection title="Category">
        <div className="space-y-1.5">
          <button
            onClick={() => setParam('category', '')}
            className={`w-full text-left text-sm py-1 px-2 rounded-lg transition-colors ${
              !selectedCategory ? 'text-tz-gold bg-tz-gold/5' : 'text-tz-muted hover:text-tz-white'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setParam('category', cat)}
              className={`w-full text-left text-sm py-1 px-2 rounded-lg transition-colors capitalize flex items-center justify-between ${
                selectedCategory === cat ? 'text-tz-gold bg-tz-gold/5' : 'text-tz-muted hover:text-tz-white'
              }`}
            >
              {cat}
              {selectedCategory === cat && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="space-y-1.5">
          {PRICE_RANGES.map(range => (
            <button
              key={range.label}
              onClick={() => setParam('price', selectedPriceKey === range.label ? '' : range.label)}
              className={`w-full text-left text-sm py-1 px-2 rounded-lg transition-colors flex items-center justify-between ${
                selectedPriceKey === range.label ? 'text-tz-gold bg-tz-gold/5' : 'text-tz-muted hover:text-tz-white'
              }`}
            >
              {range.label}
              {selectedPriceKey === range.label && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map(size => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedSizes.includes(size)
                  ? 'border-tz-gold bg-tz-gold/10 text-tz-gold'
                  : 'border-tz-border text-tz-muted hover:border-tz-muted hover:text-tz-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  )

  return (
    <>
      <SEO
        title="All Products"
        description="Browse our full collection of premium fashion — clothing, footwear and accessories."
      />

      <div className="min-h-screen bg-tz-dark">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-tz-white">
                {selectedCategory
                  ? <span className="capitalize">{selectedCategory}</span>
                  : 'All Products'
                }
              </h1>
              {!loading && (
                <p className="text-tz-muted text-sm mt-0.5">{totalCount} products</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tz-muted" />
                <input
                  type="text"
                  className="input-base pl-9 py-2 text-sm w-44 md:w-56"
                  placeholder="Search products…"
                  value={search}
                  onChange={e => setParam('q', e.target.value || '')}
                />
              </div>

              {/* Sort */}
              <select
                className="input-base py-2 text-sm"
                value={sort}
                onChange={e => setParam('sort', e.target.value)}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="lg:hidden btn-secondary flex items-center gap-2 px-3 py-2 text-sm rounded-xl"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-tz-gold text-tz-black text-xs font-bold flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active filter tags */}
          {activeTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeTags.map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 bg-tz-gold/10 text-tz-gold border border-tz-gold/20 text-xs px-3 py-1 rounded-full"
                >
                  {tag.label}
                  <button onClick={tag.clear} className="hover:text-tz-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-8">
            {/* ── Desktop Sidebar ──────────────────────────────────────── */}
            <aside className="hidden lg:block w-52 shrink-0">
              <div className="sticky top-24">
                <SidebarContent />
              </div>
            </aside>

            {/* ── Mobile Sidebar drawer ─────────────────────────────────── */}
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSidebarOpen(false)}
                  />
                  <motion.aside
                    className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-tz-dark border-r border-tz-border p-6 overflow-y-auto lg:hidden"
                    initial={{ x: -280 }}
                    animate={{ x: 0 }}
                    exit={{ x: -280 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-tz-white font-semibold text-lg">Filters</p>
                      <button onClick={() => setSidebarOpen(false)} className="text-tz-muted hover:text-tz-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <SidebarContent />
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* ── Product Grid ──────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] rounded-xl bg-tz-black/60 mb-3" />
                      <div className="h-4 bg-tz-black/60 rounded mb-1.5 w-3/4" />
                      <div className="h-4 bg-tz-black/60 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Package className="w-16 h-16 text-tz-muted opacity-20 mb-4" />
                  <p className="text-tz-white font-medium mb-1">No products found</p>
                  <p className="text-tz-muted text-sm mb-4">Try adjusting your filters</p>
                  <button onClick={clearAll} className="btn-secondary px-4 py-2 text-sm rounded-xl">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}