// src/pages/admin/Dashboard.jsx
// FIX: Changed all `profiles` table references → `users`
// (authStore fetches from `users`, not `profiles`)

import { useEffect, useState, useMemo } from 'react'
import { Link }                          from 'react-router-dom'
import { motion }                        from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, ShoppingCart, Users, Package, AlertTriangle,
  RotateCcw, UserCheck, UserX, ChevronRight, DollarSign,
  Mail, RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  gold:   '#c9a96e',
  green:  '#10b981',
  red:    '#ef4444',
  blue:   '#3b82f6',
  purple: '#8b5cf6',
  amber:  '#f59e0b',
  sky:    '#0ea5e9',
  muted:  '#6b7280',
}

const PERIODS = [
  { label: '7D',  days: 7   },
  { label: '30D', days: 30  },
  { label: '90D', days: 90  },
  { label: '1Y',  days: 365 },
]

const STATUS_ORDER  = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
const STATUS_COLORS = {
  pending: C.amber, confirmed: C.blue, processing: C.purple,
  shipped: C.sky,   delivered: C.green,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtINR = n => `₹${Number(n ?? 0).toLocaleString('en-IN')}`
const fmtK   = n => {
  n = Number(n ?? 0)
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`
  return fmtINR(n)
}
const fmtNum  = n => Number(n ?? 0).toLocaleString('en-IN')
const fmtDate = dt => new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
const fmtFull = dt => new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

function getStart(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function fillDays(valueMap, days, valueKey = 'value') {
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const k = d.toISOString().slice(0, 10)
    result.push({ date: k, [valueKey]: valueMap[k] ?? 0 })
  }
  return result
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTip({ active, payload, label, isCount }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-tz-dark border border-tz-border rounded-xl px-3 py-2.5 shadow-2xl">
      <p className="text-tz-muted text-xs mb-1">{fmtDate(label)}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color ?? C.gold }}>
          {isCount ? fmtNum(p.value) : fmtK(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ icon: Icon, label, value, color = C.gold, loading, sub }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + '1a', border: `1px solid ${color}30` }}>
          <Icon size={17} style={{ color }} />
        </div>
        {sub && <span className="text-[11px] text-tz-muted">{sub}</span>}
      </div>
      {loading
        ? <div className="h-7 w-20 bg-tz-border/30 rounded animate-pulse mb-1" />
        : <p className="text-2xl font-bold text-tz-white font-display leading-none mb-1">{value}</p>
      }
      <p className="text-tz-muted text-xs">{label}</p>
    </motion.div>
  )
}

function Section({ title, icon: Icon, action, children }) {
  return (
    <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-tz-gold" />}
          <h2 className="text-tz-white font-semibold text-sm">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function StatRow({ label, value, color = C.gold }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-tz-border/30 last:border-0">
      <p className="text-tz-muted text-sm">{label}</p>
      <p className="font-semibold text-sm" style={{ color }}>{value}</p>
    </div>
  )
}

// ─── Orders Funnel ────────────────────────────────────────────────────────────
function Funnel({ orders, loading }) {
  const counts = useMemo(() => {
    const m = {}
    orders.forEach(o => { m[o.status] = (m[o.status] || 0) + 1 })
    return m
  }, [orders])

  const total = STATUS_ORDER.reduce((s, k) => s + (counts[k] || 0), 0) || 1

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 bg-tz-border/20 rounded animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="space-y-3">
      {STATUS_ORDER.map((step, i) => {
        const count    = counts[step] || 0
        const pct      = Math.round((count / total) * 100)
        const prev     = i > 0 ? counts[STATUS_ORDER[i - 1]] : null
        const dropOff  = prev && prev > 0 && count > 0
          ? Math.round(((prev - count) / prev) * 100) : null
        return (
          <div key={step}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold capitalize" style={{ color: STATUS_COLORS[step] }}>
                {step}
              </span>
              <span className="text-xs text-tz-muted">{fmtNum(count)} · {pct}%</span>
            </div>
            <div className="h-2.5 bg-tz-border/30 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ backgroundColor: STATUS_COLORS[step] }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, count > 0 ? 1.5 : 0)}%` }}
                transition={{ delay: i * 0.08, duration: 0.7, ease: 'easeOut' }} />
            </div>
            {dropOff !== null && dropOff > 0 && (
              <p className="text-right text-[10px] text-red-400/70 mt-0.5">−{dropOff}% from previous</p>
            )}
          </div>
        )
      })}
      {counts['cancelled'] > 0 && (
        <div className="flex justify-between text-xs pt-2 border-t border-tz-border/30 mt-1">
          <span className="text-red-400">Cancelled</span>
          <span className="text-tz-muted">{fmtNum(counts['cancelled'])}</span>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [period,    setPeriod]    = useState(30)
  const [loading,   setLoading]   = useState(true)
  const [refreshKey,setRefreshKey]= useState(0)
  const [data,      setData]      = useState(null)
  const [chartMode, setChartMode] = useState('revenue')

  useEffect(() => { load() }, [period, refreshKey])  // eslint-disable-line

  async function load() {
    setLoading(true)
    const start = getStart(period)
    const ago30 = getStart(30)

    try {
      const [
        { data: orders },
        { data: allOrders },
        { data: abandonment },
        { data: users },        // ✅ FIXED: was 'profiles', your store uses 'users'
        { data: returns },
        { data: lowStock },
      ] = await Promise.all([
        supabase.from('orders')
          .select('id, total_amount, status, created_at, user_id')
          .gte('created_at', start)
          .order('created_at'),

        supabase.from('orders')
          .select('user_id')
          .neq('status', 'cancelled'),

        supabase.from('cart_abandonment')
          .select('id, converted_at, cart_total, created_at, email_1_sent_at')
          .order('created_at', { ascending: false })
          .limit(2000),

        // ✅ FIXED: 'users' table (not 'profiles') — confirmed from authStore._loadProfile
        supabase.from('users')
          .select('id, full_name, email, created_at')
          .order('created_at', { ascending: false })
          .limit(3000),

        supabase.from('return_requests')
          .select('id, status, refund_amount, created_at')
          .gte('created_at', start),

        supabase.from('products')
          .select('id, name, images, inventory_count, stock_count')
          .eq('is_active', true)
          .lte('inventory_count', 10)
          .order('inventory_count')
          .limit(8),
      ])

      // Top products by revenue
      const validOrderIds = (orders || [])
        .filter(o => o.status !== 'cancelled')
        .map(o => o.id)
        .slice(0, 400)

      let items = []
      if (validOrderIds.length > 0) {
        const { data: raw } = await supabase
          .from('order_items')
          .select('product_id, quantity, price, products(id, name, images, inventory_count)')
          .in('order_id', validOrderIds)
        items = raw || []
      }

      const pMap = {}
      items.forEach(item => {
        const pid = item.product_id
        if (!pMap[pid]) pMap[pid] = {
          id:      pid,
          name:    item.products?.name ?? 'Unknown',
          image:   item.products?.images?.[0] ?? null,
          stock:   item.products?.inventory_count ?? 0,
          units:   0,
          revenue: 0,
        }
        pMap[pid].units   += item.quantity
        pMap[pid].revenue += item.price * item.quantity
      })
      const topProducts = Object.values(pMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)

      // Dormant: registered 30+ days ago AND never ordered
      const activeIds = new Set((allOrders || []).map(o => o.user_id).filter(Boolean))
      const dormant   = (users || [])
        .filter(u => u.created_at < ago30 && !activeIds.has(u.id))
        .slice(0, 30)

      // New users in selected period
      const newUsers = (users || []).filter(u => u.created_at >= start)

      setData({
        orders:      orders      || [],
        allOrders:   allOrders   || [],
        abandonment: abandonment || [],
        users:       users       || [],
        returns:     returns     || [],
        lowStock:    lowStock    || [],
        topProducts,
        dormant,
        newUsers,
      })
    } catch (err) {
      console.error('Dashboard load error:', err)
    }
    setLoading(false)
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!data) return {}
    const valid    = data.orders.filter(o => o.status !== 'cancelled')
    const revenue  = valid.reduce((s, o) => s + (o.total_amount || 0), 0)
    const orders   = valid.length
    const aov      = orders > 0 ? revenue / orders : 0

    const allBuyers    = new Set(data.allOrders.map(o => o.user_id))
    const periodBuyers = new Set(valid.map(o => o.user_id))
    const returning    = [...periodBuyers].filter(id => allBuyers.has(id)).length

    const abandoned      = data.abandonment.filter(a => !a.converted_at)
    const converted      = data.abandonment.filter(a =>  a.converted_at)
    const recoveryRate   = data.abandonment.length > 0
      ? Math.round((converted.length / data.abandonment.length) * 100) : 0
    const abandonedValue = abandoned.reduce((s, a) => s + (a.cart_total || 0), 0)
    const emailsSent     = data.abandonment.filter(a => a.email_1_sent_at).length

    return {
      revenue, orders, aov,
      newUsers:     data.newUsers.length,
      returning,
      recoveryRate, abandonedValue, emailsSent,
      totalUsers:   data.users.length,
      dormantCount: data.dormant.length,
    }
  }, [data])

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!data) return []
    const valid  = data.orders.filter(o => o.status !== 'cancelled')
    const revMap = {}
    const ordMap = {}
    valid.forEach(o => {
      const k = o.created_at?.slice(0, 10) ?? ''
      if (!k) return
      revMap[k] = (revMap[k] || 0) + (o.total_amount || 0)
      ordMap[k] = (ordMap[k] || 0) + 1
    })
    return fillDays(revMap, period, 'revenue').map(d => ({
      ...d,
      orders: ordMap[d.date] ?? 0,
    }))
  }, [data, period])

  const newUsersChart = useMemo(() => {
    if (!data) return []
    const days = Math.min(period, 30)
    const map  = {}
    data.newUsers.forEach(u => {
      const k = u.created_at?.slice(0, 10)
      if (k) map[k] = (map[k] || 0) + 1
    })
    return fillDays(map, days, 'users')
  }, [data, period])

  const pLabel = PERIODS.find(p => p.days === period)?.label ?? '30D'

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-tz-white">Analytics</h1>
          <p className="text-tz-muted text-sm mt-0.5">Real-time store insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setRefreshKey(k => k + 1)} disabled={loading}
            className="w-9 h-9 rounded-xl border border-tz-border flex items-center justify-center text-tz-muted hover:text-tz-white hover:border-tz-muted transition-all disabled:opacity-40">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-1 bg-tz-black/40 border border-tz-border rounded-xl p-1">
            {PERIODS.map(p => (
              <button key={p.days} onClick={() => setPeriod(p.days)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  period === p.days ? 'bg-tz-gold text-tz-black' : 'text-tz-muted hover:text-tz-white'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={TrendingUp}   label={`Revenue (${pLabel})`}     value={fmtK(kpis.revenue)}   loading={loading} color={C.gold}   />
        <KPI icon={ShoppingCart} label={`Orders (${pLabel})`}      value={fmtNum(kpis.orders)}  loading={loading} color={C.blue}   />
        <KPI icon={DollarSign}   label="Avg. Order Value"           value={fmtK(kpis.aov)}       loading={loading} color={C.green}  />
        <KPI icon={Users}        label={`New Users (${pLabel})`}    value={fmtNum(kpis.newUsers)}loading={loading} color={C.purple} />
      </div>

      {/* Revenue Chart */}
      <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-tz-gold" />
            <h2 className="text-tz-white font-semibold text-sm">Revenue Trend</h2>
          </div>
          <div className="flex gap-1 bg-tz-dark border border-tz-border rounded-lg p-1">
            {[['revenue', 'Revenue'], ['orders', 'Orders']].map(([key, lbl]) => (
              <button key={key} onClick={() => setChartMode(key)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  chartMode === key ? 'bg-tz-gold text-tz-black font-semibold' : 'text-tz-muted hover:text-tz-white'
                }`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        {loading
          ? <div className="h-52 bg-tz-border/10 rounded-xl animate-pulse" />
          : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.gold} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.gold} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }}
                  tickFormatter={fmtDate}
                  interval={Math.max(0, Math.floor(chartData.length / 7) - 1)} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }}
                  tickFormatter={v => chartMode === 'revenue' ? fmtK(v) : v} />
                <Tooltip content={<ChartTip isCount={chartMode === 'orders'} />} />
                <Area type="monotone" dataKey={chartMode} stroke={C.gold} strokeWidth={2}
                  fill="url(#grad1)" dot={false} activeDot={{ r: 4, fill: C.gold }} />
              </AreaChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Funnel + Top Products */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Orders Funnel" icon={ShoppingCart}
          action={<Link to="/admin/orders" className="text-tz-gold text-xs hover:underline flex items-center gap-1">View all <ChevronRight size={11} /></Link>}>
          <Funnel orders={data?.orders ?? []} loading={loading} />
        </Section>

        <Section title="Top Selling Products" icon={Package}
          action={<Link to="/admin/products" className="text-tz-gold text-xs hover:underline flex items-center gap-1">All products <ChevronRight size={11} /></Link>}>
          {loading
            ? <div className="space-y-3">{Array.from({length:6}).map((_,i) => <div key={i} className="h-10 bg-tz-border/20 rounded animate-pulse" />)}</div>
            : data?.topProducts?.length ? (
              <div className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-tz-muted text-xs w-4 shrink-0 text-right">{i + 1}</span>
                    <div className="w-8 h-10 rounded-lg overflow-hidden bg-tz-dark border border-tz-border shrink-0">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package size={11} className="text-tz-muted opacity-30" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-tz-white text-xs font-medium truncate">{p.name}</p>
                      <p className="text-tz-muted text-[11px]">{p.units} units sold</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-tz-white text-xs font-semibold">{fmtK(p.revenue)}</p>
                      <p className={`text-[11px] font-medium ${
                        p.stock === 0 ? 'text-red-400' : p.stock <= 5 ? 'text-red-400' : p.stock <= 10 ? 'text-amber-400' : 'text-tz-muted'
                      }`}>
                        {p.stock === 0 ? '⚠ Out of stock' : p.stock <= 10 ? `⚠ ${p.stock} left` : `${p.stock} in stock`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-tz-muted text-sm text-center py-8">No sales data for this period</p>
          }
        </Section>
      </div>

      {/* Low Stock Alert */}
      {!loading && (data?.lowStock?.length ?? 0) > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
            <h2 className="text-amber-400 font-semibold text-sm">Low Stock Alert</h2>
            <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/20">
              {data.lowStock.length} product{data.lowStock.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.lowStock.map(p => {
              const stock = p.inventory_count ?? p.stock_count ?? 0
              return (
                <Link key={p.id} to={`/admin/products/${p.id}`}
                  className="flex items-center gap-3 bg-tz-black/40 border border-tz-border rounded-xl p-3 hover:border-amber-500/30 transition-colors">
                  <div className="w-8 h-10 rounded-lg overflow-hidden bg-tz-dark border border-tz-border shrink-0">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package size={11} className="text-tz-muted opacity-30" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-tz-white text-xs font-medium truncate">{p.name}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${stock === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                      {stock === 0 ? 'Out of stock' : `${stock} left`}
                    </p>
                  </div>
                  <ChevronRight size={13} className="text-tz-muted shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Cart Abandonment + Returns */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Cart Abandonment" icon={ShoppingCart}>
          {loading
            ? <div className="space-y-2">{Array.from({length:5}).map((_,i) => <div key={i} className="h-9 bg-tz-border/20 rounded animate-pulse" />)}</div>
            : <>
                <StatRow label="Abandoned Carts"         value={fmtNum(data?.abandonment?.filter(a => !a.converted_at).length ?? 0)} color={C.red}    />
                <StatRow label="Recovered (Converted)"   value={fmtNum(data?.abandonment?.filter(a =>  a.converted_at).length ?? 0)} color={C.green}  />
                <StatRow label="Recovery Rate"           value={`${kpis.recoveryRate ?? 0}%`}                                        color={C.gold}   />
                <StatRow label="Abandoned Cart Value"    value={fmtK(kpis.abandonedValue ?? 0)}                                      color={C.purple} />
                <StatRow label="Recovery Emails Sent"    value={fmtNum(kpis.emailsSent ?? 0)}                                        color={C.blue}   />
              </>
          }
        </Section>

        <Section title="Returns & Refunds" icon={RotateCcw}
          action={<Link to="/admin/returns" className="text-tz-gold text-xs hover:underline flex items-center gap-1">Manage <ChevronRight size={11} /></Link>}>
          {loading
            ? <div className="space-y-2">{Array.from({length:5}).map((_,i) => <div key={i} className="h-9 bg-tz-border/20 rounded animate-pulse" />)}</div>
            : <>
                <StatRow label={`Total Requests (${pLabel})`} value={fmtNum(data?.returns?.length ?? 0)}                                                                     color={C.gold}   />
                <StatRow label="Pending Review"               value={fmtNum(data?.returns?.filter(r => r.status === 'pending').length  ?? 0)}                               color={C.amber}  />
                <StatRow label="Approved"                     value={fmtNum(data?.returns?.filter(r => r.status === 'approved').length ?? 0)}                               color={C.green}  />
                <StatRow label="Rejected"                     value={fmtNum(data?.returns?.filter(r => r.status === 'rejected').length ?? 0)}                               color={C.red}    />
                <StatRow label="Total Refunds Issued"         value={fmtK(data?.returns?.filter(r => r.status === 'completed').reduce((s,r) => s+(r.refund_amount||0),0))} color={C.blue}   />
              </>
          }
        </Section>
      </div>

      {/* Customer Insights */}
      <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Users size={16} className="text-tz-gold" />
          <h2 className="text-tz-white font-semibold text-sm">Customer Insights</h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <p className="text-tz-muted text-xs mb-3">New Registrations — last {Math.min(period, 30)} days</p>
            {loading
              ? <div className="h-40 bg-tz-border/10 rounded-xl animate-pulse" />
              : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={newUsersChart} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 10 }}
                      tickFormatter={fmtDate}
                      interval={Math.max(0, Math.floor(newUsersChart.length / 5) - 1)} />
                    <YAxis tick={{ fill: C.muted, fontSize: 10 }} allowDecimals={false} />
                    <Tooltip content={<ChartTip isCount />} />
                    <Bar dataKey="users" fill={C.purple} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
          <div className="flex flex-col justify-center space-y-1">
            {[
              { label: `New Signups (${pLabel})`,         value: fmtNum(kpis.newUsers),     color: C.purple },
              { label: 'Total Registered Users',          value: fmtNum(kpis.totalUsers),   color: C.gold   },
              { label: `Returning Buyers (${pLabel})`,    value: fmtNum(kpis.returning),    color: C.green  },
              { label: 'Dormant (30d+ no orders)',        value: fmtNum(kpis.dormantCount), color: C.red    },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-tz-border/30 last:border-0">
                <p className="text-tz-muted text-sm">{row.label}</p>
                <p className="font-semibold text-sm" style={{ color: row.color }}>
                  {loading ? '…' : row.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Users Table */}
      <div className="bg-tz-black/40 border border-tz-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tz-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck size={15} className="text-emerald-400" />
            <h2 className="text-tz-white font-semibold text-sm">
              New Users This Period
              {!loading && <span className="ml-2 text-tz-muted font-normal">({data?.newUsers?.length ?? 0})</span>}
            </h2>
          </div>
          <Link to="/admin/users" className="text-tz-gold text-xs hover:underline flex items-center gap-1">
            Manage users <ChevronRight size={11} />
          </Link>
        </div>
        {loading
          ? <div className="divide-y divide-tz-border/30">{Array.from({length:5}).map((_,i) => <div key={i} className="px-5 py-3 animate-pulse"><div className="h-8 bg-tz-border/20 rounded" /></div>)}</div>
          : data?.newUsers?.length ? (
            <>
              <div className="hidden sm:grid grid-cols-[2fr_2fr_1.2fr] px-5 py-2.5 border-b border-tz-border bg-tz-black/20">
                {['Name', 'Email', 'Joined'].map(h => <p key={h} className="text-tz-muted text-xs uppercase tracking-wider">{h}</p>)}
              </div>
              <div className="divide-y divide-tz-border/30 max-h-80 overflow-y-auto">
                {data.newUsers.slice(0, 25).map(u => (
                  <div key={u.id} className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1.2fr] px-5 py-3 items-center hover:bg-tz-black/20 transition-colors gap-1 sm:gap-4">
                    <p className="text-tz-white text-sm truncate">{u.full_name || <span className="text-tz-muted">—</span>}</p>
                    <p className="text-tz-muted text-xs truncate">{u.email}</p>
                    <p className="text-tz-muted text-xs">{fmtFull(u.created_at)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-tz-muted text-sm text-center py-10">No new users in this period</p>
        }
      </div>

      {/* Dormant Users Table */}
      <div className="bg-tz-black/40 border border-tz-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tz-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserX size={15} className="text-red-400" />
            <h2 className="text-tz-white font-semibold text-sm">Dormant Users</h2>
            <span className="text-tz-muted text-xs font-normal hidden sm:inline">— registered 30+ days ago, never ordered</span>
          </div>
          {!loading && (data?.dormant?.length ?? 0) > 0 && (
            <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full border border-red-500/20">
              {data.dormant.length} users
            </span>
          )}
        </div>
        {loading
          ? <div className="divide-y divide-tz-border/30">{Array.from({length:5}).map((_,i) => <div key={i} className="px-5 py-3 animate-pulse"><div className="h-8 bg-tz-border/20 rounded" /></div>)}</div>
          : data?.dormant?.length ? (
            <>
              <div className="hidden sm:grid grid-cols-[2fr_2fr_1.2fr] px-5 py-2.5 border-b border-tz-border bg-tz-black/20">
                {['Name', 'Email', 'Joined'].map(h => <p key={h} className="text-tz-muted text-xs uppercase tracking-wider">{h}</p>)}
              </div>
              <div className="divide-y divide-tz-border/30 max-h-80 overflow-y-auto">
                {data.dormant.map(u => (
                  <div key={u.id} className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1.2fr] px-5 py-3 items-center hover:bg-tz-black/20 transition-colors gap-1 sm:gap-4">
                    <p className="text-tz-white text-sm truncate">{u.full_name || <span className="text-tz-muted">—</span>}</p>
                    <p className="text-tz-muted text-xs truncate">{u.email}</p>
                    <p className="text-tz-muted text-xs">{fmtFull(u.created_at)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <UserCheck size={36} className="mx-auto mb-3 text-emerald-400 opacity-40" />
              <p className="text-tz-white text-sm font-medium">No dormant users</p>
              <p className="text-tz-muted text-xs mt-1">All registered users have placed at least one order</p>
            </div>
          )
        }
      </div>

    </div>
  )
}


// OLD CODE-

// import { useEffect, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { motion } from 'framer-motion'
// import {
//   TrendingUp, ShoppingCart, Users, Package,
//   ArrowUpRight, ArrowDownRight, Clock, Star
// } from 'lucide-react'
// import {
//   AreaChart, Area, XAxis, YAxis, CartesianGrid,
//   Tooltip, ResponsiveContainer, BarChart, Bar
// } from 'recharts'
// import { supabase } from '@/lib/supabase'
// import AdminLayout from '@/components/admin/AdminLayout'

// // ─── Custom chart tooltip ─────────────────────────────────────────────────────
// function ChartTooltip({ active, payload, label }) {
//   if (!active || !payload?.length) return null
//   return (
//     <div className="bg-tz-dark border border-tz-border rounded-xl px-3 py-2 text-xs">
//       <p className="text-tz-muted mb-1">{label}</p>
//       {payload.map(p => (
//         <p key={p.dataKey} className="text-tz-white font-medium">
//           {p.name}: {p.name === 'Revenue' ? `₹${p.value?.toLocaleString('en-IN')}` : p.value}
//         </p>
//       ))}
//     </div>
//   )
// }

// // ─── Stat Card ────────────────────────────────────────────────────────────────
// function StatCard({ icon: Icon, label, value, change, changeLabel, color, loading }) {
//   const isPositive = change >= 0
//   return (
//     <motion.div
//       className="bg-tz-black/40 border border-tz-border rounded-2xl p-5"
//       initial={{ opacity: 0, y: 12 }}
//       animate={{ opacity: 1, y: 0 }}
//     >
//       <div className="flex items-start justify-between mb-4">
//         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
//           <Icon className="w-5 h-5 text-current" />
//         </div>
//         {change !== undefined && !loading && (
//           <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
//             {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
//             {Math.abs(change)}%
//           </span>
//         )}
//       </div>

//       {loading ? (
//         <div className="space-y-2">
//           <div className="h-7 w-24 bg-tz-border/40 rounded animate-pulse" />
//           <div className="h-4 w-32 bg-tz-border/30 rounded animate-pulse" />
//         </div>
//       ) : (
//         <>
//           <p className="text-tz-white font-display text-2xl font-bold">{value}</p>
//           <p className="text-tz-muted text-sm mt-0.5">{label}</p>
//           {changeLabel && (
//             <p className="text-tz-muted text-xs mt-1">{changeLabel}</p>
//           )}
//         </>
//       )}
//     </motion.div>
//   )
// }

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function getLast7Days() {
//   return Array.from({ length: 7 }, (_, i) => {
//     const d = new Date()
//     d.setDate(d.getDate() - (6 - i))
//     return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
//   })
// }

// function getLast6Months() {
//   return Array.from({ length: 6 }, (_, i) => {
//     const d = new Date()
//     d.setMonth(d.getMonth() - (5 - i))
//     return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
//   })
// }

// // ─── Main ─────────────────────────────────────────────────────────────────────
// export default function AdminDashboard() {
//   const [stats,         setStats]         = useState(null)
//   const [revenueData,   setRevenueData]   = useState([])
//   const [ordersData,    setOrdersData]    = useState([])
//   const [recentOrders,  setRecentOrders]  = useState([])
//   const [topProducts,   setTopProducts]   = useState([])
//   const [loading,       setLoading]       = useState(true)

//   useEffect(() => {
//     const load = async () => {
//       setLoading(true)

//       // ── All stats in parallel ────────────────────────────────────────
//       const [
//         totalRevenueRes,
//         ordersCountRes,
//         usersCountRes,
//         productsCountRes,
//         pendingOrdersRes,
//         avgRatingRes,
//         recentOrdersRes,
//         topProductsRes,
//         last7DaysRes,
//         last6MonthsRes,
//       ] = await Promise.all([
//         // Total revenue (completed orders)
//         supabase
//           .from('orders')
//           .select('total_amount')
//           .in('status', ['delivered', 'shipped', 'processing', 'confirmed']),

//         // Total orders
//         supabase.from('orders').select('*', { count: 'exact', head: true }),

//         // Total users
//         supabase.from('profiles').select('*', { count: 'exact', head: true }),

//         // Total products
//         supabase.from('products').select('*', { count: 'exact', head: true }),

//         // Pending orders
//         supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),

//         // Avg rating
//         supabase.from('reviews').select('rating').eq('is_approved', true),

//         // Recent orders (last 5)
//         supabase
//           .from('orders')
//           .select('id, created_at, status, total_amount, profiles(full_name)')
//           .order('created_at', { ascending: false })
//           .limit(5),

//         // Top products by order count
//         supabase
//           .from('order_items')
//           .select('product_id, quantity, products(name, images)')
//           .limit(100),

//         // Orders by day — last 7 days
//         supabase
//           .from('orders')
//           .select('created_at, total_amount')
//           .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
//           .in('status', ['delivered', 'shipped', 'processing', 'confirmed']),

//         // Orders by month — last 6 months
//         supabase
//           .from('orders')
//           .select('created_at, total_amount')
//           .gte('created_at', new Date(Date.now() - 180 * 86400000).toISOString())
//           .in('status', ['delivered', 'shipped', 'processing', 'confirmed']),
//       ])

//       // ── Compute stats ────────────────────────────────────────────────
//       const totalRevenue = totalRevenueRes.data?.reduce((s, o) => s + (o.total_amount ?? 0), 0) ?? 0
//       const totalOrders  = ordersCountRes.count ?? 0
//       const totalUsers   = usersCountRes.count ?? 0
//       const totalProds   = productsCountRes.count ?? 0
//       const pendingCount = pendingOrdersRes.count ?? 0

//       const ratings = avgRatingRes.data?.map(r => r.rating) ?? []
//       const avgRating = ratings.length
//         ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
//         : null

//       setStats({ totalRevenue, totalOrders, totalUsers, totalProds, pendingCount, avgRating })

//       // ── Recent orders ────────────────────────────────────────────────
//       if (recentOrdersRes.data) setRecentOrders(recentOrdersRes.data)

//       // ── Top products ─────────────────────────────────────────────────
//       if (topProductsRes.data) {
//         const agg = {}
//         topProductsRes.data.forEach(item => {
//           if (!item.product_id) return
//           if (!agg[item.product_id]) {
//             agg[item.product_id] = {
//               product_id: item.product_id,
//               name: item.products?.name ?? 'Unknown',
//               image: item.products?.images?.[0],
//               qty: 0,
//             }
//           }
//           agg[item.product_id].qty += item.quantity ?? 0
//         })
//         setTopProducts(
//           Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, 5)
//         )
//       }

//       // ── Revenue chart — last 7 days ───────────────────────────────────
//       const days = getLast7Days()
//       const dayMap = {}
//       days.forEach(d => { dayMap[d] = { day: d, Revenue: 0, Orders: 0 } })
//       last7DaysRes.data?.forEach(o => {
//         const d = new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
//         if (dayMap[d]) {
//           dayMap[d].Revenue += o.total_amount ?? 0
//           dayMap[d].Orders  += 1
//         }
//       })
//       setRevenueData(Object.values(dayMap))

//       // ── Monthly chart — last 6 months ─────────────────────────────────
//       const months = getLast6Months()
//       const monthMap = {}
//       months.forEach(m => { monthMap[m] = { month: m, Revenue: 0, Orders: 0 } })
//       last6MonthsRes.data?.forEach(o => {
//         const m = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
//         if (monthMap[m]) {
//           monthMap[m].Revenue += o.total_amount ?? 0
//           monthMap[m].Orders  += 1
//         }
//       })
//       setOrdersData(Object.values(monthMap))

//       setLoading(false)
//     }

//     load()
//   }, [])

//   const STATUS_COLORS = {
//     pending:    'bg-amber-500/10 text-amber-400',
//     confirmed:  'bg-blue-500/10 text-blue-400',
//     processing: 'bg-purple-500/10 text-purple-400',
//     shipped:    'bg-sky-500/10 text-sky-400',
//     delivered:  'bg-emerald-500/10 text-emerald-400',
//     cancelled:  'bg-red-500/10 text-red-400',
//   }

//   return (
//     <AdminLayout>
//       <div className="p-6 max-w-6xl mx-auto">

//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="font-display text-2xl font-bold text-tz-white mb-1">Dashboard</h1>
//           <p className="text-tz-muted text-sm">Welcome back. Here's what's happening.</p>
//         </div>

//         {/* ── Stat Cards ──────────────────────────────────────────────── */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//           <StatCard
//             icon={TrendingUp}
//             label="Total Revenue"
//             value={stats ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '—'}
//             color="bg-tz-gold/10 text-tz-gold"
//             loading={loading}
//           />
//           <StatCard
//             icon={ShoppingCart}
//             label="Total Orders"
//             value={stats?.totalOrders ?? '—'}
//             changeLabel={stats ? `${stats.pendingCount} pending` : undefined}
//             color="bg-blue-500/10 text-blue-400"
//             loading={loading}
//           />
//           <StatCard
//             icon={Users}
//             label="Customers"
//             value={stats?.totalUsers ?? '—'}
//             color="bg-purple-500/10 text-purple-400"
//             loading={loading}
//           />
//           <StatCard
//             icon={Package}
//             label="Products"
//             value={stats?.totalProds ?? '—'}
//             changeLabel={stats?.avgRating ? `★ ${stats.avgRating} avg rating` : undefined}
//             color="bg-emerald-500/10 text-emerald-400"
//             loading={loading}
//           />
//         </div>

//         {/* ── Charts ──────────────────────────────────────────────────── */}
//         <div className="grid lg:grid-cols-2 gap-6 mb-8">

//           {/* Revenue — 7 days */}
//           <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
//             <p className="text-tz-white font-semibold mb-5">Revenue — Last 7 Days</p>
//             <ResponsiveContainer width="100%" height={200}>
//               <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
//                 <defs>
//                   <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.3} />
//                     <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}   />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
//                 <XAxis dataKey="day"   tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
//                 <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} width={48}
//                   tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
//                 <Tooltip content={<ChartTooltip />} />
//                 <Area
//                   type="monotone" dataKey="Revenue" stroke="#C9A84C"
//                   fill="url(#revenueGrad)" strokeWidth={2} dot={false}
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Orders — 6 months */}
//           <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
//             <p className="text-tz-white font-semibold mb-5">Orders — Last 6 Months</p>
//             <ResponsiveContainer width="100%" height={200}>
//               <BarChart data={ordersData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
//                 <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
//                 <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
//                 <Tooltip content={<ChartTooltip />} />
//                 <Bar dataKey="Orders" fill="#C9A84C" opacity={0.8} radius={[4, 4, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* ── Recent Orders + Top Products ────────────────────────────── */}
//         <div className="grid lg:grid-cols-2 gap-6">

//           {/* Recent Orders */}
//           <div className="bg-tz-black/40 border border-tz-border rounded-2xl overflow-hidden">
//             <div className="flex items-center justify-between px-5 py-4 border-b border-tz-border">
//               <p className="text-tz-white font-semibold">Recent Orders</p>
//               <Link to="/admin/orders" className="text-tz-gold text-xs hover:underline">
//                 View all
//               </Link>
//             </div>
//             <div className="divide-y divide-tz-border/40">
//               {loading ? (
//                 Array.from({ length: 5 }).map((_, i) => (
//                   <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
//                     <div className="w-8 h-8 rounded-full bg-tz-border/30" />
//                     <div className="flex-1 space-y-1.5">
//                       <div className="h-3.5 w-28 bg-tz-border/30 rounded" />
//                       <div className="h-3 w-20 bg-tz-border/20 rounded" />
//                     </div>
//                     <div className="h-3.5 w-14 bg-tz-border/30 rounded" />
//                   </div>
//                 ))
//               ) : recentOrders.length === 0 ? (
//                 <p className="text-tz-muted text-sm px-5 py-6 text-center">No orders yet</p>
//               ) : (
//                 recentOrders.map(order => (
//                   <Link
//                     key={order.id}
//                     to={`/admin/orders/${order.id}`}
//                     className="flex items-center gap-3 px-5 py-3 hover:bg-tz-black/30 transition-colors"
//                   >
//                     <div className="w-8 h-8 rounded-full bg-tz-gold/10 flex items-center justify-center text-tz-gold text-xs font-bold shrink-0">
//                       {(order.profiles?.full_name ?? '?')[0]?.toUpperCase()}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-tz-white text-sm font-medium truncate">
//                         {order.profiles?.full_name ?? 'Customer'}
//                       </p>
//                       <p className="text-tz-muted text-xs">
//                         #{order.id.split('-')[0].toUpperCase()}
//                       </p>
//                     </div>
//                     <div className="text-right shrink-0">
//                       <p className="text-tz-white text-sm font-medium">
//                         ₹{order.total_amount?.toLocaleString('en-IN')}
//                       </p>
//                       <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-tz-border/30 text-tz-muted'}`}>
//                         {order.status}
//                       </span>
//                     </div>
//                   </Link>
//                 ))
//               )}
//             </div>
//           </div>

//           {/* Top Products */}
//           <div className="bg-tz-black/40 border border-tz-border rounded-2xl overflow-hidden">
//             <div className="flex items-center justify-between px-5 py-4 border-b border-tz-border">
//               <p className="text-tz-white font-semibold">Top Products</p>
//               <Link to="/admin/products" className="text-tz-gold text-xs hover:underline">
//                 View all
//               </Link>
//             </div>
//             <div className="divide-y divide-tz-border/40">
//               {loading ? (
//                 Array.from({ length: 5 }).map((_, i) => (
//                   <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
//                     <div className="w-10 h-10 rounded-lg bg-tz-border/30" />
//                     <div className="flex-1 space-y-1.5">
//                       <div className="h-3.5 w-32 bg-tz-border/30 rounded" />
//                       <div className="h-3 w-16 bg-tz-border/20 rounded" />
//                     </div>
//                   </div>
//                 ))
//               ) : topProducts.length === 0 ? (
//                 <p className="text-tz-muted text-sm px-5 py-6 text-center">No sales data yet</p>
//               ) : (
//                 topProducts.map((p, i) => (
//                   <Link
//                     key={p.product_id}
//                     to={`/admin/products/${p.product_id}`}
//                     className="flex items-center gap-3 px-5 py-3 hover:bg-tz-black/30 transition-colors"
//                   >
//                     <span className="text-tz-muted text-xs w-4 shrink-0">{i + 1}</span>
//                     <div className="w-10 h-12 rounded-lg overflow-hidden bg-tz-dark shrink-0">
//                       {p.image ? (
//                         <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
//                       ) : (
//                         <div className="w-full h-full flex items-center justify-center">
//                           <Package className="w-4 h-4 text-tz-muted opacity-30" />
//                         </div>
//                       )}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-tz-white text-sm font-medium truncate">{p.name}</p>
//                       <p className="text-tz-muted text-xs">{p.qty} units sold</p>
//                     </div>
//                   </Link>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </AdminLayout>
//   )
// }