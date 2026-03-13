import { useState, useEffect }         from 'react'
import { useSearchParams, Link }        from 'react-router-dom'
import { motion, AnimatePresence }      from 'framer-motion'
import {
  SlidersHorizontal, Grid3X3, List,
  ChevronLeft, ChevronRight, Search,
  X, ArrowUpDown
} from 'lucide-react'

import ProductGrid    from '@/components/product/ProductGrid'
import ProductFilters from '@/components/product/ProductFilters'
import { useProducts, useActiveFilters } from '@/hooks/useProducts'
import { SORT_OPTIONS } from '@/lib/constants'

// ─── Active filter chips ──────────────────────────────────────
function FilterChips({ filters, onRemove }) {
  const entries = Object.entries(filters).filter(([k]) => k !== 'sort')
  if (!entries.length) return null

  function label(key, value) {
    if (key === 'category') return `Category: ${value}`
    if (key === 'gender')   return `Gender: ${value}`
    if (key === 'q')        return `"${value}"`
    if (key === 'minPrice') return `Min ₹${value}`
    if (key === 'maxPrice') return `Max ₹${value}`
    if (key.startsWith('tag:'))  return `#${value}`
    if (key.startsWith('size:')) return `Size: ${value}`
    return value
  }

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {entries.map(([key, value]) => (
        <motion.button
          key={key}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={() => onRemove(key)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-tz-gold/10 border border-tz-gold/30 text-tz-gold text-xs font-body hover:bg-tz-gold/20 transition-colors"
        >
          {label(key, value)}
          <X size={11} />
        </motion.button>
      ))}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  function getPages() {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i)
      else if (pages[pages.length - 1] !== '…') pages.push('…')
    }
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-12">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center border border-tz-border text-tz-muted hover:text-tz-text hover:border-tz-border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft size={15} />
      </button>

      {getPages().map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-tz-muted text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={`w-9 h-9 text-sm border transition-all font-body ${
              p === page
                ? 'bg-tz-gold text-tz-black border-tz-gold font-semibold'
                : 'border-tz-border text-tz-muted hover:border-tz-border-2 hover:text-tz-text'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 flex items-center justify-center border border-tz-border text-tz-muted hover:text-tz-text hover:border-tz-border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [view,        setView]          = useState('grid')
  const [drawerOpen,  setDrawerOpen]    = useState(false)

  const { products, total, totalPages, isLoading, error, page } = useProducts()
  const activeFilters = useActiveFilters()

  const hasFilters   = Object.keys(activeFilters).filter(k => k !== 'sort').length > 0
  const currentSort  = searchParams.get('sort') || 'created_at_desc'
  const currentQ     = searchParams.get('q')    || ''

  // Body scroll lock when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  function setParam(key, value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else       next.delete(key)
      next.set('page', '1')
      return next
    })
  }

  function removeFilter(key) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (key.startsWith('tag:'))       next.delete('tag',  key.slice(4))
      else if (key.startsWith('size:')) next.delete('size', key.slice(5))
      else                              next.delete(key)
      next.set('page', '1')
      return next
    })
  }

  function handlePageChange(p) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearAll() { setSearchParams({ page: '1' }) }

  // Dynamic heading
  const category = searchParams.get('category') || ''
  const gender   = searchParams.get('gender')   || ''
  const q        = searchParams.get('q')        || ''
  const pageTitle =
    q        ? `Search: "${q}"` :
    category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Collection` :
    gender   ? `${gender.charAt(0).toUpperCase() + gender.slice(1)}'s Collection` :
    'All Products'

  return (
    <div className="min-h-screen bg-tz-black">
      {/* Header */}
      <div className="border-b border-tz-border bg-tz-dark">
        <div className="page-container py-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="eyebrow mb-2">Catalog</p>
            <h1 className="heading-md">{pageTitle}</h1>
          </motion.div>
        </div>
      </div>

      <div className="page-container py-8">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
            <input
              type="search"
              defaultValue={currentQ}
              placeholder="Search products…"
              className="input-base pl-9 h-9 text-xs w-full"
              aria-label="Search products"
              onKeyDown={e => { if (e.key === 'Enter') setParam('q', e.target.value.trim() || null) }}
              onBlur={e   => { setParam('q', e.target.value.trim() || null) }}
            />
          </div>

          <div className="flex items-center gap-3 sm:ml-auto flex-wrap">
            {/* Count */}
            <span className="text-xs text-tz-muted font-body hidden sm:block">
              {isLoading ? '…' : `${total} product${total !== 1 ? 's' : ''}`}
            </span>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
              <select
                value={currentSort}
                onChange={e => setParam('sort', e.target.value)}
                className="bg-tz-dark border border-tz-border text-tz-text text-xs font-body pl-8 pr-3 h-9 appearance-none cursor-pointer hover:border-tz-border-2 outline-none transition-colors focus:border-tz-gold"
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* View toggle */}
            <div className="flex border border-tz-border">
              <button
                onClick={() => setView('grid')}
                className={`w-9 h-9 flex items-center justify-center transition-colors ${view === 'grid' ? 'bg-tz-gold text-tz-black' : 'text-tz-muted hover:text-tz-text'}`}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`w-9 h-9 flex items-center justify-center border-l border-tz-border transition-colors ${view === 'list' ? 'bg-tz-gold text-tz-black' : 'text-tz-muted hover:text-tz-text'}`}
                aria-label="List view"
                aria-pressed={view === 'list'}
              >
                <List size={14} />
              </button>
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center gap-2 border border-tz-border text-tz-muted hover:text-tz-text hover:border-tz-border-2 px-3 h-9 text-xs font-body transition-all"
              aria-expanded={drawerOpen}
            >
              <SlidersHorizontal size={14} />
              Filters
              {hasFilters && (
                <span className="w-4 h-4 bg-tz-gold text-tz-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {Object.keys(activeFilters).filter(k => k !== 'sort').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 flex-wrap mb-5"
            >
              <FilterChips filters={activeFilters} onRemove={removeFilter} />
              <button
                onClick={clearAll}
                className="text-xs text-tz-muted hover:text-tz-accent transition-colors font-body underline underline-offset-2"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop layout */}
        <div className="flex gap-8">
          <aside className="hidden lg:block w-56 shrink-0" aria-label="Product filters">
            <div className="sticky top-24">
              <ProductFilters
                searchParams={searchParams}
                setParam={setParam}
                setSearchParams={setSearchParams}
              />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {error ? (
              <div className="flex flex-col items-center py-16 text-center gap-4">
                <p className="text-tz-accent text-sm font-body">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <ProductGrid
                  products={products}
                  isLoading={isLoading}
                  view={view}
                  emptyMessage={hasFilters ? 'No products match these filters.' : 'No products found.'}
                />
                <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-drawer lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-tz-dark border-r border-tz-border z-drawer overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-tz-border sticky top-0 bg-tz-dark z-10">
                <p className="font-body font-semibold text-tz-white text-sm">Filters</p>
                <button onClick={() => setDrawerOpen(false)} className="btn-icon" aria-label="Close filters">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5">
                <ProductFilters
                  searchParams={searchParams}
                  setParam={setParam}
                  setSearchParams={setSearchParams}
                />
              </div>
              <div className="sticky bottom-0 bg-tz-dark border-t border-tz-border p-4">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="btn-primary-lg w-full justify-center"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}