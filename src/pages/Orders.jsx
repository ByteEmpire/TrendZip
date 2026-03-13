import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, ChevronRight, Search,
  Truck, Check, Clock, X, RefreshCw, ShoppingBag
} from 'lucide-react'

import useAuthStore from '@/store/authStore'
import { useMyOrders } from '@/hooks/useOrders'
import { formatPrice } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/lib/constants'
import SEO from '@/components/SEO'

const STATUS_CONFIG = {
  pending: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: Clock },
  confirmed: { color: 'text-blue-400   bg-blue-400/10   border-blue-400/20', icon: Check },
  processing: { color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: RefreshCw },
  shipped: { color: 'text-sky-400    bg-sky-400/10    border-sky-400/20', icon: Truck },
  delivered: { color: 'text-green-400  bg-green-400/10  border-green-400/20', icon: Check },
  cancelled: { color: 'text-red-400    bg-red-400/10    border-red-400/20', icon: X },
  refunded: { color: 'text-zinc-400   bg-zinc-400/10   border-zinc-400/20', icon: RefreshCw },
}

const FILTER_TABS = [
  { value: 'all', label: 'All Orders' },
  { value: 'active', label: 'Active' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

function OrderCard({ order, index }) {
  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
  const StatusIcon = config.icon

  // Support both Supabase shape (order_items) and mock shape (items)
  const items = order.order_items ?? order.items ?? []
  const firstItem = items[0]
  const extraCount = items.length - 1

  // Normalise date
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : order.date ?? ''

  const orderId = order.order_number ?? order.id

  if (!firstItem) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
    >
      <Link
        to={`/orders/${order.id}`}
        className="block bg-tz-dark border border-tz-border hover:border-tz-border-2 transition-all duration-200 group"
        aria-label={`View order ${orderId}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-tz-border/60 bg-tz-surface/30">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-[10px] text-tz-muted font-body uppercase tracking-wider">Order ID</p>
              <p className="text-xs font-semibold text-tz-gold font-body">#{orderId}</p>
            </div>
            <div className="hidden sm:block w-px h-6 bg-tz-border" />
            <div className="hidden sm:block">
              <p className="text-[10px] text-tz-muted font-body uppercase tracking-wider">Date</p>
              <p className="text-xs text-tz-text font-body">{dateStr}</p>
            </div>
            <div className="hidden sm:block w-px h-6 bg-tz-border" />
            <div className="hidden sm:block">
              <p className="text-[10px] text-tz-muted font-body uppercase tracking-wider">Payment</p>
              <p className="text-xs text-tz-text font-body capitalize">{order.payment_method}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 badge border text-[10px] ${config.color}`}>
              <StatusIcon size={10} />
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </span>
            <ChevronRight size={14} className="text-tz-muted group-hover:text-tz-gold group-hover:translate-x-0.5 transition-all duration-150" />
          </div>
        </div>

        {/* Items */}
        <div className="flex items-center gap-4 px-4 sm:px-5 py-4">
          <div className="flex items-center shrink-0">
            <div className="w-16 h-20 sm:w-20 sm:h-24 bg-tz-surface overflow-hidden border border-tz-border">
              <img
                src={firstItem.image}
                alt={firstItem.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {extraCount > 0 && (
              <div className="w-14 h-20 sm:w-16 sm:h-24 -ml-3 bg-tz-surface border border-tz-border flex items-center justify-center">
                <span className="text-xs font-body font-semibold text-tz-muted">+{extraCount}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-tz-text group-hover:text-tz-white transition-colors font-body line-clamp-1 mb-0.5">
              {firstItem.name}
            </p>
            {items.length > 1 && (
              <p className="text-xs text-tz-muted font-body mb-1">
                + {items.length - 1} more item{items.length - 1 > 1 ? 's' : ''}
              </p>
            )}
            <p className="text-xs text-tz-muted font-body">
              {firstItem.size ? `Size: ${firstItem.size} · ` : ''}Qty: {firstItem.quantity ?? firstItem.qty ?? 1}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-tz-muted font-body mb-0.5">Total</p>
            <p className="font-display text-lg text-tz-white font-light">{formatPrice(order.total)}</p>
          </div>
        </div>

        {/* Tracking banner */}
        {order.tracking_number && order.status === 'shipped' && (
          <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 border-t border-tz-border/60 bg-sky-400/5">
            <Truck size={12} className="text-sky-400 shrink-0" />
            <p className="text-xs text-sky-400 font-body">
              Tracking: <span className="font-semibold">{order.tracking_number}</span>
            </p>
          </div>
        )}
      </Link>
    </motion.div>
  )
}

export default function Orders() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const user = useAuthStore(s => s.user)
  const openAuth = useAuthStore(s => s.openAuth)

  const { orders, isLoading, error, refetch } = useMyOrders()

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-5 px-4">
        <div className="w-20 h-20 border border-tz-border flex items-center justify-center">
          <Package size={32} className="text-tz-muted" />
        </div>
        <div>
          <h2 className="font-display text-2xl text-tz-white font-light mb-2">Sign in to view orders</h2>
          <p className="text-sm text-tz-muted max-w-xs">Log in to see your order history and track deliveries.</p>
        </div>
        <button onClick={openAuth} className="btn-primary-lg">Sign In</button>
      </div>
    )
  }

  const filtered = orders.filter(order => {
    const items = order.order_items ?? order.items ?? []
    const matchSearch =
      (order.order_number ?? order.id ?? '').toLowerCase().includes(search.toLowerCase()) ||
      items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))

    const matchTab =
      activeTab === 'all' ? true :
        activeTab === 'active' ? ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status) :
          activeTab === 'delivered' ? order.status === 'delivered' :
            activeTab === 'cancelled' ? order.status === 'cancelled' :
              true

    return matchSearch && matchTab
  })

  return (
    <>
      <SEO title="My Orders" noIndex={true} />
      <div className="min-h-screen bg-tz-black">
        <div className="border-b border-tz-border bg-tz-dark">
          <div className="page-container py-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <p className="eyebrow mb-2">Account</p>
              <h1 className="heading-md">My Orders</h1>
            </motion.div>
          </div>
        </div>

        <div className="page-container py-8 lg:py-12">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search orders…"
                className="input-base pl-9 h-9 text-xs w-full"
                aria-label="Search orders"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap sm:ml-auto">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-2 text-xs font-body tracking-wide transition-all border ${activeTab === tab.value
                    ? 'bg-tz-gold text-tz-black border-tz-gold font-semibold'
                    : 'border-tz-border text-tz-muted hover:text-tz-text hover:border-tz-border-2'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32" />)}
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="text-center py-16">
              <p className="text-tz-accent text-sm mb-4 font-body">{error}</p>
              <button onClick={refetch} className="btn-secondary text-sm">Try Again</button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center gap-5"
            >
              <div className="w-20 h-20 border border-tz-border flex items-center justify-center">
                <ShoppingBag size={32} className="text-tz-muted" />
              </div>
              <div>
                <h2 className="font-display text-2xl text-tz-white font-light mb-2">No orders found</h2>
                <p className="text-sm text-tz-muted max-w-xs mx-auto">
                  {search ? 'No orders match your search.' : "You haven't placed any orders yet."}
                </p>
              </div>
              <Link to="/catalog" className="btn-primary-lg">Browse Products</Link>
            </motion.div>
          )}

          {/* Order list */}
          {!isLoading && !error && filtered.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-tz-muted font-body mb-4">
                {filtered.length} order{filtered.length !== 1 ? 's' : ''}
              </p>
              <AnimatePresence>
                {filtered.map((order, i) => (
                  <OrderCard key={order.id} order={order} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  )
}