// src/pages/admin/Orders.jsx
// FIXES: Corrected column names to match actual DB schema:
//   total_amount    → total
//   discount_amount → discount

import { useEffect, useState, useCallback } from 'react'
import { Link }                              from 'react-router-dom'
import { motion, AnimatePresence }           from 'framer-motion'
import {
  Search, ChevronDown, Check, X,
  Package, Eye, Truck,
  ShoppingCart, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast        from 'react-hot-toast'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_META = {
  pending:    { label: 'Pending',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20'       },
  confirmed:  { label: 'Confirmed',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'          },
  processing: { label: 'Processing', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20'    },
  shipped:    { label: 'Shipped',    cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20'              },
  delivered:  { label: 'Delivered',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-500/10 text-red-400 border-red-500/20'             },
}

const NEXT_STATUS = {
  pending: 'confirmed', confirmed: 'processing',
  processing: 'shipped', shipped: 'delivered',
}

const PAGE_SIZE = 20

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, cls: 'bg-tz-border/30 text-tz-muted border-tz-border' }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${meta.cls}`}>
      {meta.label}
    </span>
  )
}

function StatusDropdown({ orderId, currentStatus, onUpdate }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const isFinal = currentStatus === 'delivered' || currentStatus === 'cancelled'

  const handleChange = async (newStatus) => {
    if (newStatus === currentStatus) { setOpen(false); return }
    setLoading(true); setOpen(false)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    setLoading(false)
    if (error) toast.error('Failed to update status')
    else { toast.success(`Marked as ${newStatus}`); onUpdate(orderId, newStatus) }
  }

  return (
    <div className="relative">
      <button
        onClick={() => !isFinal && setOpen(o => !o)}
        disabled={loading || isFinal}
        className="flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-default"
      >
        <StatusBadge status={currentStatus} />
        {!isFinal && !loading && <ChevronDown size={12} className="text-tz-muted" />}
        {loading && (
          <motion.div
            className="w-3.5 h-3.5 border border-tz-muted border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full mt-1 z-20 bg-tz-dark border border-tz-border rounded-xl overflow-hidden shadow-xl min-w-[150px]"
            >
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => handleChange(s)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-tz-black/40 transition-colors capitalize ${
                    s === currentStatus ? 'text-tz-gold' : 'text-tz-muted hover:text-tz-white'
                  }`}
                >
                  {s}{s === currentStatus && <Check size={11} />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function QuickAdvance({ orderId, currentStatus, onUpdate }) {
  const next      = NEXT_STATUS[currentStatus]
  const [loading, setLoading] = useState(false)
  if (!next) return null

  const handle = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('orders')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    setLoading(false)
    if (error) toast.error('Failed')
    else { toast.success(`Marked as ${next}`); onUpdate(orderId, next) }
  }

  const IconMap = { confirmed: Check, processing: Package, shipped: Truck, delivered: Check }
  const Icon = IconMap[next] ?? Check

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-tz-gold/10 hover:bg-tz-gold/20 text-tz-gold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading
        ? <motion.div className="w-3 h-3 border border-tz-gold border-t-transparent rounded-full"
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} />
        : <Icon size={11} />
      }
      Mark {next}
    </button>
  )
}

export default function AdminOrders() {
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [totalCount,   setTotalCount]   = useState(0)
  const [page,         setPage]         = useState(0)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('orders')
      .select(
        'id, order_number, created_at, status, total, discount, address_snapshot',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (statusFilter) query = query.eq('status', statusFilter)
    if (search.trim()) {
      query = query.ilike('order_number', `%${search.trim()}%`)
    }

    const { data, count, error } = await query
    if (error) { console.error('[AdminOrders] fetch error:', error); setLoading(false); return }

    setOrders(data ?? [])
    setTotalCount(count ?? 0)
    setLoading(false)
  }, [page, statusFilter, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [statusFilter, search])

  const handleStatusUpdate = (orderId, newStatus) =>
    setOrders(os => os.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-tz-white mb-1">Orders</h1>
          <p className="text-tz-muted text-sm">{totalCount} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted" />
          <input
            type="text"
            className="input-base pl-9 py-2 text-sm w-full"
            placeholder="Search by order number or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-muted hover:text-tz-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              !statusFilter
                ? 'bg-tz-gold/10 border-tz-gold/30 text-tz-gold'
                : 'border-tz-border text-tz-muted hover:text-tz-white'
            }`}
          >
            All
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(f => f === s ? '' : s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all capitalize ${
                statusFilter === s
                  ? STATUS_META[s].cls
                  : 'border-tz-border text-tz-muted hover:text-tz-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-tz-black/40 border border-tz-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-tz-border/40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-28 h-4 bg-tz-border/30 rounded" />
                <div className="flex-1 h-4 bg-tz-border/20 rounded" />
                <div className="w-20 h-4 bg-tz-border/30 rounded" />
                <div className="w-24 h-6 bg-tz-border/20 rounded-full" />
                <div className="w-20 h-4 bg-tz-border/20 rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={40} className="mx-auto mb-4 text-tz-muted opacity-20" />
            <p className="text-tz-muted">No orders found</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1.5fr_1.5fr_44px] gap-4 px-5 py-3 border-b border-tz-border bg-tz-black/30">
              {['Order', 'Customer', 'Amount', 'Status', 'Quick Action', ''].map(h => (
                <p key={h} className="text-tz-muted text-xs uppercase tracking-wider font-medium">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-tz-border/30">
              {orders.map(order => (
                <motion.div
                  key={order.id}
                  layout
                  className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_1.5fr_1.5fr_44px] gap-4 px-5 py-4 items-center hover:bg-tz-black/20 transition-colors"
                >
                  <div>
                    <p className="text-tz-white text-sm font-mono font-medium">
                      #{order.order_number ?? order.id.split('-')[0].toUpperCase()}
                    </p>
                    <p className="text-tz-muted text-xs mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-tz-white text-sm truncate">
                      {order.address_snapshot?.full_name ?? 'Unknown'}
                    </p>
                    <p className="text-tz-muted text-xs truncate font-mono">
                      {order.address_snapshot?.phone ?? ''}
                    </p>
                  </div>
                  <div>
                    {/* ← correct column: total (not total_amount) */}
                    <p className="text-tz-white text-sm font-semibold">
                      ₹{order.total?.toLocaleString('en-IN') ?? '—'}
                    </p>
                    {order.discount > 0 && (
                      <p className="text-emerald-400 text-xs">
                        −₹{order.discount?.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <StatusDropdown
                    orderId={order.id}
                    currentStatus={order.status}
                    onUpdate={handleStatusUpdate}
                  />
                  <QuickAdvance
                    orderId={order.id}
                    currentStatus={order.status}
                    onUpdate={handleStatusUpdate}
                  />
                  <div className="text-right">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-tz-muted hover:text-tz-gold transition-colors"
                      title="View order"
                    >
                      <Eye size={15} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-tz-muted text-sm">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-8 h-8 rounded-lg border border-tz-border flex items-center justify-center text-tz-muted hover:text-tz-white disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-tz-muted text-sm px-1">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-8 h-8 rounded-lg border border-tz-border flex items-center justify-center text-tz-muted hover:text-tz-white disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}