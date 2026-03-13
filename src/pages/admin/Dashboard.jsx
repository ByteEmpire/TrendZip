import { useState, useEffect }      from 'react'
import { Link }                      from 'react-router-dom'
import { motion }                    from 'framer-motion'
import {
  TrendingUp, ShoppingBag, Users, Package,
  ArrowUpRight, ArrowDownRight, Activity,
  ChevronRight, Star, RefreshCw
} from 'lucide-react'
import { supabase }                  from '@/lib/supabase'
import { formatPrice }               from '@/lib/utils'

const STATUS_STYLES = {
  pending:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  confirmed:  'text-blue-400   bg-blue-400/10   border-blue-400/20',
  processing: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  shipped:    'text-sky-400    bg-sky-400/10    border-sky-400/20',
  delivered:  'text-green-400  bg-green-400/10  border-green-400/20',
  cancelled:  'text-red-400    bg-red-400/10    border-red-400/20',
}

function MiniBarChart({ data, color = '#c9a96e' }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((val, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(val / max) * 100}%` }}
          transition={{ delay: i * 0.04, duration: 0.5, ease: 'easeOut' }}
          className="flex-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity cursor-default"
          style={{ backgroundColor: color, minHeight: 2 }}
          title={`${val}`}
        />
      ))}
    </div>
  )
}

function StatCard({ label, value, change, up, icon: Icon, color, bg, sub, loading }) {
  return (
    <div className="bg-tz-dark border border-tz-border p-5 hover:border-tz-border-2 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 border flex items-center justify-center ${bg}`}>
          <Icon size={18} className={color} />
        </div>
        {change !== null && (
          <span className={`flex items-center gap-1 text-xs font-body font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
            {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {change}
          </span>
        )}
      </div>
      {loading
        ? <div className="skeleton h-8 w-28 mb-1" />
        : <p className="font-display text-2xl text-tz-white font-light mb-1">{value}</p>
      }
      <p className="text-xs text-tz-muted font-body">{label}</p>
      {sub && <p className="text-[10px] text-tz-muted/60 font-body mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats,          setStats]          = useState(null)
  const [recentOrders,   setRecentOrders]   = useState([])
  const [topProducts,    setTopProducts]    = useState([])
  const [revenueByMonth, setRevenueByMonth] = useState(Array(12).fill(0))
  const [ordersByMonth,  setOrdersByMonth]  = useState(Array(12).fill(0))
  const [loading,        setLoading]        = useState(true)

  async function loadAll() {
    setLoading(true)

    const [
      { count: totalOrders },
      { count: totalUsers  },
      { count: totalProducts },
      { data: deliveredOrders },
      { data: recentRaw },
      { data: topRaw },
      { data: allOrders },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*',  { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('total, created_at').eq('status', 'delivered'),
      // Recent 6 orders with user info
      supabase.from('orders')
        .select('id, order_number, total, status, created_at, payment_method, users(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(6),
      // Top products by order item count
      supabase.from('order_items')
        .select('product_id, quantity, products(id, name, images, avg_rating)')
        .limit(100),
      // All orders for chart (last 12 months)
      supabase.from('orders')
        .select('total, status, created_at')
        .gte('created_at', new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString()),
    ])

    // Total revenue
    const totalRevenue = (deliveredOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0)

    // Monthly breakdown
    const revByMonth   = Array(12).fill(0)
    const ordByMonth   = Array(12).fill(0)
    ;(allOrders ?? []).forEach(o => {
      const m = new Date(o.created_at).getMonth()
      ordByMonth[m]++
      if (o.status === 'delivered') revByMonth[m] += o.total ?? 0
    })

    // Aggregate top products
    const productMap = {}
    ;(topRaw ?? []).forEach(item => {
      const pid = item.product_id
      if (!productMap[pid]) {
        productMap[pid] = {
          name:   item.products?.name   ?? '—',
          image:  item.products?.images?.[0] ?? '',
          rating: item.products?.avg_rating  ?? 0,
          sales:  0,
          revenue: 0,
        }
      }
      productMap[pid].sales += item.quantity ?? 0
    })
    const topList = Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    setStats({ totalOrders, totalUsers, totalProducts, totalRevenue })
    setRecentOrders(recentRaw ?? [])
    setTopProducts(topList)
    setRevenueByMonth(revByMonth)
    setOrdersByMonth(ordByMonth)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const STAT_CARDS = [
    {
      label: 'Total Revenue', sub: 'from delivered orders',
      value: stats ? formatPrice(stats.totalRevenue) : '—',
      icon: TrendingUp, color: 'text-tz-gold',   bg: 'bg-tz-gold/10 border-tz-gold/20',
      change: null, up: true,
    },
    {
      label: 'Total Orders', sub: 'all time',
      value: stats ? stats.totalOrders?.toLocaleString('en-IN') : '—',
      icon: ShoppingBag, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20',
      change: null, up: true,
    },
    {
      label: 'Customers', sub: 'registered accounts',
      value: stats ? stats.totalUsers?.toLocaleString('en-IN') : '—',
      icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20',
      change: null, up: true,
    },
    {
      label: 'Active Products', sub: 'live in store',
      value: stats ? stats.totalProducts?.toLocaleString('en-IN') : '—',
      icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20',
      change: null, up: true,
    },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-tz-white font-light mb-0.5">Dashboard</h1>
          <p className="text-xs text-tz-muted font-body">Live data from your store.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAll} className="btn-icon" title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-2 text-xs text-tz-muted font-body bg-tz-surface border border-tz-border px-3 py-2">
            <Activity size={13} className="text-tz-gold" />
            Live
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <StatCard {...s} loading={loading} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-tz-dark border border-tz-border p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-tz-muted font-body uppercase tracking-wider mb-1">Revenue (12 months)</p>
              <p className="font-display text-xl text-tz-white font-light">
                {loading ? <span className="skeleton inline-block w-24 h-6" /> : formatPrice(stats?.totalRevenue ?? 0)}
              </p>
            </div>
          </div>
          <MiniBarChart data={revenueByMonth} color="#c9a96e" />
          <div className="flex justify-between mt-2">
            {months.map(m => <span key={m} className="text-[9px] text-tz-muted font-body">{m}</span>)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-tz-dark border border-tz-border p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-tz-muted font-body uppercase tracking-wider mb-1">Orders (12 months)</p>
              <p className="font-display text-xl text-tz-white font-light">
                {loading ? <span className="skeleton inline-block w-16 h-6" /> : stats?.totalOrders?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <MiniBarChart data={ordersByMonth} color="#38bdf8" />
          <div className="flex justify-between mt-2">
            {months.map(m => <span key={m} className="text-[9px] text-tz-muted font-body">{m}</span>)}
          </div>
        </motion.div>
      </div>

      {/* Recent orders + top products */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">

        {/* Recent orders */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-tz-dark border border-tz-border"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-tz-border">
            <h2 className="font-body text-sm font-semibold text-tz-white">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-tz-gold hover:text-tz-gold-light flex items-center gap-1 font-body">
              View All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10" />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="p-6 text-sm text-tz-muted font-body text-center">No orders yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-tz-border">
                    {['Order','Customer','Amount','Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] text-tz-muted font-body font-semibold tracking-wider uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-tz-border/50">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-tz-surface/40 transition-colors">
                      <td className="px-4 py-3 text-xs font-body text-tz-gold font-medium whitespace-nowrap">
                        #{order.order_number ?? order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-tz-text font-body whitespace-nowrap">
                          {order.users?.full_name ?? order.users?.email ?? 'Guest'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-tz-white font-body whitespace-nowrap">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge border text-[9px] ${STATUS_STYLES[order.status] ?? ''}`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Top products */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-tz-dark border border-tz-border"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-tz-border">
            <h2 className="font-body text-sm font-semibold text-tz-white">Top Products</h2>
            <Link to="/admin/products" className="text-xs text-tz-gold hover:text-tz-gold-light flex items-center gap-1 font-body">
              View All <ChevronRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14" />)}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="p-6 text-sm text-tz-muted font-body text-center">No sales data yet.</p>
          ) : (
            <div className="divide-y divide-tz-border/50">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-tz-surface/40 transition-colors">
                  <div className="w-10 h-12 bg-tz-surface overflow-hidden shrink-0 border border-tz-border/50">
                    {p.image
                      ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center"><Package size={12} className="text-tz-muted" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-tz-text font-body line-clamp-1">{p.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={9} className="text-tz-gold fill-tz-gold" />
                      <span className="text-[10px] text-tz-muted font-body">
                        {p.rating > 0 ? p.rating.toFixed(1) : 'No reviews'}
                      </span>
                    </div>
                    <p className="text-[10px] text-tz-muted font-body">{p.sales} units sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}