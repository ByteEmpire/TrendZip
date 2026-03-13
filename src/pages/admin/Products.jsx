import { useState, useEffect }     from 'react'
import { Link }                     from 'react-router-dom'
import { motion, AnimatePresence }  from 'framer-motion'
import {
  Plus, Search, Edit2, Trash2, Eye,
  ChevronUp, ChevronDown, Package,
  Check, X, AlertTriangle, RefreshCw
} from 'lucide-react'
import { supabase }                 from '@/lib/supabase'
import { formatPrice, calcDiscount } from '@/lib/utils'

// ─── Delete confirm modal ─────────────────────────────────────
function DeleteConfirmModal({ product, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setDeleting(true)
    await onConfirm()
    setDeleting(false)
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-tz-dark border border-tz-border p-6 max-w-sm w-full shadow-modal"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-tz-accent/10 border border-tz-accent/30 flex items-center justify-center">
            <AlertTriangle size={18} className="text-tz-accent" />
          </div>
          <h3 className="font-display text-lg text-tz-white font-light">Delete Product</h3>
        </div>
        <p className="text-sm text-tz-muted font-body mb-1">Are you sure you want to delete:</p>
        <p className="text-sm text-tz-white font-body font-medium mb-4">"{product.name}"</p>
        <p className="text-xs text-tz-muted font-body mb-6">
          This permanently removes the product from your store and database. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 bg-tz-accent text-white text-sm font-body py-2.5 hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
              : <><Trash2 size={13} />Delete</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Sort icon ────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <ChevronUp size={12} className="text-tz-muted/40" />
  return sortDir === 'asc'
    ? <ChevronUp  size={12} className="text-tz-gold" />
    : <ChevronDown size={12} className="text-tz-gold" />
}

// ─── Main Component ───────────────────────────────────────────
export default function AdminProducts() {
  const [products,       setProducts]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortKey,        setSortKey]        = useState('created_at')
  const [sortDir,        setSortDir]        = useState('desc')
  const [selected,       setSelected]       = useState([])
  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [page,           setPage]           = useState(1)
  const [togglingId,     setTogglingId]     = useState(null)
  const PER_PAGE = 10

  // ─── Load from Supabase ───────────────────────────────────
  async function loadProducts() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (err) { setError(err.message); setLoading(false); return }

    // Normalise to a flat shape the table expects
    setProducts((data ?? []).map(p => ({
      id:       p.id,
      name:     p.name,
      slug:     p.slug,
      category: p.category_slug ?? '—',
      price:    p.sale_price,
      original: p.base_price,
      stock:    p.stock_count,
      status:   p.is_active ? 'active' : 'draft',
      featured: p.is_featured,
      image:    p.images?.[0] ?? '',
      // Keep raw fields for updates
      _raw:     p,
    })))
    setLoading(false)
  }

  useEffect(() => { loadProducts() }, [])

  // ─── Filter + sort ────────────────────────────────────────
  const filtered = products
    .filter(p => {
      const q = search.toLowerCase()
      const matchSearch   = p.name.toLowerCase().includes(q) ||
                            p.category.toLowerCase().includes(q) ||
                            p.slug.toLowerCase().includes(q)
      const matchStatus   = statusFilter   === 'all' || p.status   === statusFilter
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
      return matchSearch && matchStatus && matchCategory
    })
    .sort((a, b) => {
      let va = a[sortKey] ?? '', vb = b[sortKey] ?? ''
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))]

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  // ─── Selection ────────────────────────────────────────────
  function toggleSelect(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }
  function toggleSelectAll() {
    setSelected(s => s.length === paginated.length ? [] : paginated.map(p => p.id))
  }

  // ─── Toggle active/draft ──────────────────────────────────
  async function handleToggleStatus(product) {
    setTogglingId(product.id)
    const newActive = product.status !== 'active'
    const { error: err } = await supabase
      .from('products')
      .update({ is_active: newActive })
      .eq('id', product.id)

    if (!err) {
      setProducts(ps => ps.map(p =>
        p.id === product.id ? { ...p, status: newActive ? 'active' : 'draft' } : p
      ))
    }
    setTogglingId(null)
  }

  // ─── Toggle featured ──────────────────────────────────────
  async function handleToggleFeatured(product) {
    const newFeatured = !product.featured
    const { error: err } = await supabase
      .from('products')
      .update({ is_featured: newFeatured })
      .eq('id', product.id)

    if (!err) {
      setProducts(ps => ps.map(p =>
        p.id === product.id ? { ...p, featured: newFeatured } : p
      ))
    }
  }

  // ─── Delete single ────────────────────────────────────────
  async function confirmDelete() {
    const { error: err } = await supabase
      .from('products')
      .delete()
      .eq('id', deleteTarget.id)

    if (!err) {
      setProducts(ps => ps.filter(p => p.id !== deleteTarget.id))
      setSelected(s => s.filter(id => id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  // ─── Bulk delete ──────────────────────────────────────────
  async function handleBulkDelete() {
    const { error: err } = await supabase
      .from('products')
      .delete()
      .in('id', selected)

    if (!err) {
      setProducts(ps => ps.filter(p => !selected.includes(p.id)))
      setSelected([])
    }
  }

  // ─── Summary counts ───────────────────────────────────────
  const totalActive   = products.filter(p => p.status === 'active').length
  const totalDraft    = products.filter(p => p.status === 'draft').length
  const totalLowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length
  const totalOOS      = products.filter(p => p.stock === 0).length

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-tz-white font-light">Products</h1>
          <p className="text-xs text-tz-muted font-body mt-0.5">
            {loading ? 'Loading…' : `${products.length} total products`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProducts}
            className="btn-icon"
            aria-label="Refresh"
            title="Refresh products"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/admin/products/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} />
            Add Product
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active',    value: totalActive,   color: 'text-green-400'  },
          { label: 'Draft',     value: totalDraft,    color: 'text-yellow-400' },
          { label: 'Low Stock', value: totalLowStock, color: 'text-orange-400' },
          { label: 'Out of Stock', value: totalOOS,   color: 'text-tz-accent'  },
        ].map(c => (
          <div key={c.label} className="bg-tz-dark border border-tz-border p-4">
            <p className="text-[10px] text-tz-muted font-body uppercase tracking-wider mb-1">{c.label}</p>
            <p className={`font-display text-2xl font-light ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-tz-accent/10 border border-tz-accent/30 text-sm text-tz-accent font-body flex items-center gap-3">
          <AlertTriangle size={14} className="shrink-0" />
          {error}
          <button onClick={loadProducts} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Filters toolbar */}
      <div className="bg-tz-dark border border-tz-border p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search products…"
            className="input-base pl-9 h-9 text-xs w-full"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-tz-surface border border-tz-border text-tz-text text-xs font-body px-3 h-9 appearance-none cursor-pointer hover:border-tz-border-2 outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
          className="bg-tz-surface border border-tz-border text-tz-text text-xs font-body px-3 h-9 appearance-none cursor-pointer hover:border-tz-border-2 outline-none"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>

        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-tz-gold font-body">{selected.length} selected</span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 text-xs font-body bg-tz-accent/10 border border-tz-accent/30 text-tz-accent hover:bg-tz-accent/20 px-3 py-1.5 transition-all"
            >
              <Trash2 size={11} />Delete Selected
            </button>
          </div>
        )}

        <span className="ml-auto text-xs text-tz-muted font-body">
          {loading ? '…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-tz-dark border border-tz-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Products table">
            <thead>
              <tr className="border-b border-tz-border bg-tz-surface/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.length === paginated.length && paginated.length > 0}
                    onChange={toggleSelectAll}
                    className="accent-tz-gold w-3.5 h-3.5 cursor-pointer"
                    aria-label="Select all"
                  />
                </th>
                {[
                  { label: 'Product',  key: 'name'     },
                  { label: 'Category', key: 'category' },
                  { label: 'Price',    key: 'price'    },
                  { label: 'Stock',    key: 'stock'    },
                  { label: 'Status',   key: 'status'   },
                  { label: 'Featured', key: 'featured' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-[10px] text-tz-muted font-body font-semibold tracking-wider uppercase cursor-pointer hover:text-tz-text whitespace-nowrap select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-[10px] text-tz-muted font-body font-semibold tracking-wider uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-tz-border/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="skeleton h-10" />
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Package size={28} className="text-tz-muted mx-auto mb-3" />
                    <p className="text-sm text-tz-muted font-body">
                      {search || statusFilter !== 'all' || categoryFilter !== 'all'
                        ? 'No products match your filters.'
                        : 'No products yet. Add your first product!'}
                    </p>
                    {!search && (
                      <Link to="/admin/products/new" className="inline-block mt-4 btn-primary text-xs">
                        Add First Product
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {paginated.map(product => {
                    const discount   = calcDiscount(product.original, product.price)
                    const isSelected = selected.includes(product.id)
                    const lowStock   = product.stock > 0 && product.stock <= 5

                    return (
                      <motion.tr
                        key={product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`hover:bg-tz-surface/30 transition-colors ${isSelected ? 'bg-tz-gold/5' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(product.id)}
                            className="accent-tz-gold w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>

                        {/* Product */}
                        <td className="px-4 py-3 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 bg-tz-surface overflow-hidden shrink-0 border border-tz-border/50">
                              {product.image
                                ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                                : <div className="w-full h-full flex items-center justify-center"><Package size={12} className="text-tz-muted" /></div>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-tz-text font-body line-clamp-1">{product.name}</p>
                              <p className="text-[10px] text-tz-muted font-body truncate max-w-[140px]">{product.slug}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-tz-muted font-body capitalize">{product.category}</span>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs font-semibold text-tz-white font-body">{formatPrice(product.price)}</p>
                          {discount > 0 && (
                            <p className="text-[10px] text-tz-muted line-through font-body">{formatPrice(product.original)}</p>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs font-body font-semibold ${
                            product.stock === 0  ? 'text-tz-accent'
                            : lowStock           ? 'text-yellow-400'
                            :                      'text-tz-text'
                          }`}>
                            {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
                          </span>
                          {lowStock && <p className="text-[10px] text-yellow-400/70 font-body">Low stock</p>}
                        </td>

                        {/* Status — clickable toggle */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleStatus(product)}
                            disabled={togglingId === product.id}
                            title="Click to toggle status"
                            className={`badge border text-[9px] cursor-pointer hover:opacity-80 transition-opacity ${
                              product.status === 'active'
                                ? 'text-green-400 bg-green-400/10 border-green-400/20'
                                : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                            }`}
                          >
                            {togglingId === product.id ? '…' : product.status === 'active' ? 'Active' : 'Draft'}
                          </button>
                        </td>

                        {/* Featured — clickable toggle */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleFeatured(product)}
                            title="Click to toggle featured"
                            className="hover:opacity-70 transition-opacity"
                          >
                            {product.featured
                              ? <Check size={14} className="text-tz-gold" />
                              : <X     size={14} className="text-tz-muted/30 hover:text-tz-muted" />
                            }
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* View on website */}
                            
                            <a
                              href={`/products/${product.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 flex items-center justify-center text-tz-muted hover:text-tz-text hover:bg-tz-surface transition-all"
                              aria-label="View on website"
                              title="View on website"
                            >
                              <Eye size={13} />
                            </a>
                            {/* Edit — matches App.jsx route /admin/products/:id */}
                            <Link
                              to={`/admin/products/${product.id}`}
                              className="w-7 h-7 flex items-center justify-center text-tz-muted hover:text-tz-gold hover:bg-tz-gold/10 transition-all"
                              aria-label="Edit product"
                              title="Edit product"
                            >
                              <Edit2 size={13} />
                            </Link>
                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(product)}
                              className="w-7 h-7 flex items-center justify-center text-tz-muted hover:text-tz-accent hover:bg-tz-accent/10 transition-all"
                              aria-label="Delete product"
                              title="Delete product"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-tz-border">
            <p className="text-xs text-tz-muted font-body">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-tz-border text-tz-muted hover:text-tz-text hover:border-tz-border-2 transition-all disabled:opacity-30 font-body"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-xs border transition-all font-body ${
                    p === page
                      ? 'bg-tz-gold text-tz-black border-tz-gold font-semibold'
                      : 'border-tz-border text-tz-muted hover:border-tz-border-2 hover:text-tz-text'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-tz-border text-tz-muted hover:text-tz-text hover:border-tz-border-2 transition-all disabled:opacity-30 font-body"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            product={deleteTarget}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}