import { useState, useEffect }  from 'react'
import { motion }                from 'framer-motion'
import {
  TrendingUp, Users, ShoppingBag, Package,
  ArrowUpRight, MapPin, RefreshCw
} from 'lucide-react'
import { supabase }              from '@/lib/supabase'
import { formatPrice }           from '@/lib/utils'

function MiniBarChart({ data, color = '#c9a96e', height = 80 }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((val, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(val / max) * 100}%` }}
          transition={{ delay: i * 0.03, duration: 0.5, ease: 'easeOut' }}
          className="flex-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          style={{ backgroundColor: color, minHeight: 2 }}
          title={String(val)}
        />
      ))}
    </div>
  )
}

export default function AdminAnalytics() {
  const [loading,        setLoading]        = useState(true)
  const [kpis,           setKpis]           = useState(null)
  const [revenueByMonth, setRevenueByMonth] = useState(Array(12).fill(0))
  const [ordersByMonth,  setOrdersByMonth]  = useState(Array(12).fill(0))
  const [topCities,      setTopCities]      = useState([])
  const [topCategories,  setTopCategories]  = useState([])

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const CAT_COLORS = ['#c9a96e','#38bdf8','#a78bfa','#4ade80','#fb923c','#f472b6']

  async function loadAnalytics() {
    setLoading(true)

    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const [
      { data: allOrders    },
      { data: orderItems   },
      { count: totalUsers  },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('total, status, created_at, address_snapshot')
        .gte('created_at', oneYearAgo.toISOString()),
      supabase
        .from('order_items')
        .select('quantity, price, products(category_slug)')
        .limit(2000),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true }),
    ])

    const orders = allOrders ?? []

    // ─── KPIs ────────────────────────────────────────────────
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((s, o) => s + (o.total ?? 0), 0)

    const totalOrders  = orders.length
    const avgOrderValue = totalOrders > 0
      ? Math.round(orders.reduce((s, o) => s + (o.total ?? 0), 0) / totalOrders)
      : 0

    // Repeat customers: users who have > 1 order
    const { data: repeatData } = await supabase.rpc('get_repeat_customers').maybeSingle().catch(() => ({ data: null }))
    // Fallback: just show total users
    const repeatRate = null // can be wired with a Supabase RPC later

    // ─── Monthly breakdown ───────────────────────────────────
    const revByMonth = Array(12).fill(0)
    const ordByMonth = Array(12).fill(0)
    orders.forEach(o => {
      const m = new Date(o.created_at).getMonth()
      ordByMonth[m]++
      if (o.status === 'delivered') revByMonth[m] += o.total ?? 0
    })

    // ─── Top cities from address snapshots ───────────────────
    const cityMap = {}
    orders.forEach(o => {
      const city = o.address_snapshot?.city
      if (!city) return
      if (!cityMap[city]) cityMap[city] = { orders: 0, revenue: 0 }
      cityMap[city].orders++
      if (o.status === 'delivered') cityMap[city].revenue += o.total ?? 0
    })
    const topCityList = Object.entries(cityMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 6)
      .map(([city, data]) => ({ city, ...data }))

    const maxCityRevenue = Math.max(...topCityList.map(c => c.revenue), 1)
    const topCityListWithPct = topCityList.map(c => ({
      ...c,
      pct: Math.round((c.revenue / maxCityRevenue) * 100),
    }))

    // ─── Top categories ───────────────────────────────────────
    const catMap = {}
    ;(orderItems ?? []).forEach(item => {
      const cat = item.products?.category_slug ?? 'other'
      if (!catMap[cat]) catMap[cat] = { sales: 0 }
      catMap[cat].sales += item.quantity ?? 0
    })
    const catList = Object.entries(catMap)
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, 6)
      .map(([name, data]) => ({ name, ...data }))

    const maxCatSales = Math.max(...catList.map(c => c.sales), 1)
    const catListWithPct = catList.map(c => ({
      ...c,
      pct: Math.round((c.sales / maxCatSales) * 100),
    }))

    setKpis({ totalRevenue, totalOrders, totalUsers, avgOrderValue })
    setRevenueByMonth(revByMonth)
    setOrdersByMonth(ordByMonth)
    setTopCities(topCityListWithPct)
    setTopCategories(catListWithPct)
    setLoading(false)
  }

  useEffect(() => { loadAnalytics() }, [])

  const KPI_CARDS = [
    {
      label: 'Total Revenue',    value: kpis ? formatPrice(kpis.totalRevenue)   : '—',
      icon: TrendingUp, color: 'text-tz-gold',
    },
    {
      label: 'Total Orders',     value: kpis ? kpis.totalOrders?.toLocaleString('en-IN') : '—',
      icon: ShoppingBag, color: 'text-sky-400',
    },
    {
      label: 'Avg Order Value',  value: kpis ? formatPrice(kpis.avgOrderValue)  : '—',
      icon: Package, color: 'text-purple-400',
    },
    {
      label: 'Total Customers',  value: kpis ? kpis.totalUsers?.toLocaleString('en-IN') : '—',
      icon: Users, color: 'text-emerald-400',
    },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-tz-white font-light">Analytics</h1>
          <p className="text-xs text-tz-muted font-body">Live data — last 12 months</p>
        </div>
        <button onClick={loadAnalytics} className="btn-icon" title="Refresh">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-tz-dark border border-tz-border p-5"
          >
            <Icon size={16} className={`${color} mb-3`} />
            {loading
              ? <div className="skeleton h-8 w-28 mb-1" />
              : <p className="font-display text-2xl text-tz-white font-light">{value}</p>
            }
            <p className="text-xs text-tz-muted font-body mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-tz-dark border border-tz-border p-5"
        >
          <p className="font-body text-xs font-semibold text-tz-white tracking-wider uppercase mb-1">
            Monthly Revenue
          </p>
          <p className="font-display text-xl text-tz-gold font-light mb-4">
            {loading ? <span className="skeleton inline-block w-24 h-6" /> : formatPrice(kpis?.totalRevenue ?? 0)}
          </p>
          <MiniBarChart data={revenueByMonth} color="#c9a96e" height={80} />
          <div className="flex justify-between mt-2">
            {months.map(m => <span key={m} className="text-[9px] text-tz-muted font-body">{m}</span>)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-tz-dark border border-tz-border p-5"
        >
          <p className="font-body text-xs font-semibold text-tz-white tracking-wider uppercase mb-1">
            Monthly Orders
          </p>
          <p className="font-display text-xl text-sky-400 font-light mb-4">
            {loading ? <span className="skeleton inline-block w-16 h-6" /> : kpis?.totalOrders?.toLocaleString('en-IN')} orders
          </p>
          <MiniBarChart data={ordersByMonth} color="#38bdf8" height={80} />
          <div className="flex justify-between mt-2">
            {months.map(m => <span key={m} className="text-[9px] text-tz-muted font-body">{m}</span>)}
          </div>
        </motion.div>
      </div>

      {/* Cities + Categories */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Top cities */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-tz-dark border border-tz-border p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={15} className="text-tz-gold" />
            <p className="font-body text-xs font-semibold text-tz-white tracking-wider uppercase">
              Top Cities
            </p>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8" />)}
            </div>
          ) : topCities.length === 0 ? (
            <p className="text-sm text-tz-muted font-body">No city data yet.</p>
          ) : (
            <div className="space-y-4">
              {topCities.map(({ city, orders, revenue, pct }, i) => (
                <motion.div
                  key={city}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-tz-text font-body capitalize">{city}</span>
                    <span className="text-xs text-tz-gold font-body font-semibold">
                      {formatPrice(revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-tz-surface overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }}
                      className="h-full bg-tz-gold"
                    />
                  </div>
                  <p className="text-[10px] text-tz-muted mt-1 font-body">{orders} orders</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-tz-dark border border-tz-border p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <Package size={15} className="text-tz-gold" />
            <p className="font-body text-xs font-semibold text-tz-white tracking-wider uppercase">
              Sales by Category
            </p>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8" />)}
            </div>
          ) : topCategories.length === 0 ? (
            <p className="text-sm text-tz-muted font-body">No sales data yet. Add products and place orders to see data here.</p>
          ) : (
            <div className="space-y-4">
              {topCategories.map(({ name, sales, pct }, i) => {
                const color = CAT_COLORS[i % CAT_COLORS.length]
                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-tz-text font-body capitalize">{name}</span>
                      <span className="text-xs font-body font-semibold" style={{ color }}>
                        {sales} sold
                      </span>
                    </div>
                    <div className="h-1.5 bg-tz-surface overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.55 + i * 0.05, duration: 0.6 }}
                        className="h-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}