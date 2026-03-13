
import { useState, useEffect, useCallback } from 'react'
import { Link }                              from 'react-router-dom'
import {
  Search, X, ChevronRight, User, Mail,
  MapPin, ShoppingBag, Calendar, Shield, Ban,
  CheckCircle, AlertCircle, Loader2, Package,
  Home, Briefcase, MoreHorizontal, ExternalLink,
  RefreshCw, Crown, TrendingUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase }                from '@/lib/supabase'
import toast                       from 'react-hot-toast'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return (name || '').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtCurrency(n) {
  return '₹' + Number(n ?? 0).toLocaleString('en-IN')
}

const STATUS_COLORS = {
  active:   'text-green-400 bg-green-400/10 border-green-400/30',
  inactive: 'text-tz-muted bg-tz-border/30 border-tz-border',
  banned:   'text-red-400 bg-red-400/10 border-red-400/30',
}

const ORDER_STATUS_COLORS = {
  pending:    'text-yellow-400 bg-yellow-400/10',
  confirmed:  'text-blue-400 bg-blue-400/10',
  processing: 'text-blue-400 bg-blue-400/10',
  shipped:    'text-purple-400 bg-purple-400/10',
  delivered:  'text-green-400 bg-green-400/10',
  cancelled:  'text-red-400 bg-red-400/10',
  returned:   'text-orange-400 bg-orange-400/10',
}

const TYPE_ICONS = { home: Home, work: Briefcase, other: MoreHorizontal }

// ─── UserAvatar ───────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 40 }) {
  const initials = getInitials(user.full_name || user.email)
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url} alt={user.full_name || user.email}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-tz-gold/10 border border-tz-gold/20 flex items-center justify-center flex-shrink-0"
    >
      <span className="text-tz-gold font-bold font-display" style={{ fontSize: size * 0.35 }}>
        {initials}
      </span>
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function UserDetailPanel({ userId, onClose, onUserUpdated }) {
  const [user,       setUser]       = useState(null)
  const [addresses,  setAddresses]  = useState([])
  const [orders,     setOrders]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [tab,        setTab]        = useState('profile')
  const [editRole,   setEditRole]   = useState('')
  const [editStatus, setEditStatus] = useState('')

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setTab('profile')
      try {
        // Fetch full user profile from users table
        const { data: u, error: uErr } = await supabase
          .from('users').select('*').eq('id', userId).single()
        if (uErr) throw new Error('User: ' + uErr.message)
        if (cancelled) return

        setUser(u)
        setEditRole(u?.role ?? 'customer')
        setEditStatus(u?.status ?? 'active')

        // Fetch addresses
        const { data: a, error: aErr } = await supabase
          .from('addresses').select('*').eq('user_id', userId)
          .order('is_default', { ascending: false })
        if (aErr) console.error('Addresses error:', aErr.message)
        if (!cancelled) setAddresses(a ?? [])

        // Fetch orders via SECURITY DEFINER RPC (bypasses RLS)
        const { data: rpcData, error: rpcErr } = await supabase
          .rpc('admin_get_user_orders', { p_user_id: userId })

        if (rpcErr) {
          console.error('admin_get_user_orders error:', rpcErr.message)
          // Fallback to direct query
          const { data: fallback } = await supabase
            .from('orders')
            .select('id, order_number, status, total, created_at, coupon_code, payment_method')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
          if (!cancelled) setOrders((fallback ?? []).map(o => ({ ...o, total_amount: o.total ?? 0 })))
        } else {
          const raw = rpcData?.orders ?? []
          if (!cancelled) setOrders(raw.map(o => ({ ...o, total_amount: o.total_amount ?? o.total ?? 0 })))
        }
      } catch (err) {
        console.error('UserDetailPanel load error:', err)
        if (!cancelled) toast.error(err.message ?? 'Failed to load user details')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  async function handleSaveRole() {
    if (!user) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role: editRole, status: editStatus })
        .eq('id', user.id)
        .select('*').single()
      if (error) throw error
      setUser(data)
      onUserUpdated({ ...data, total_orders: orders.length })
      toast.success('User updated')
    } catch (err) {
      toast.error(err.message ?? 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const totalSpend = orders
    .filter(o => !['cancelled', 'returned'].includes(o.status))
    .reduce((s, o) => s + Number(o.total_amount ?? 0), 0)

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.25 }}
      className="fixed top-0 right-0 h-full w-full max-w-xl bg-tz-dark border-l border-tz-border z-50 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-tz-border flex-shrink-0">
        <h2 className="font-body text-sm font-semibold text-tz-white">User Details</h2>
        <button onClick={onClose} className="text-tz-muted hover:text-tz-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-tz-gold" />
        </div>
      ) : !user ? (
        <div className="flex-1 flex items-center justify-center text-tz-muted text-sm font-body">
          User not found
        </div>
      ) : (
        <>
          {/* User hero */}
          <div className="px-6 py-5 border-b border-tz-border flex-shrink-0">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} size={56} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-body font-semibold text-base text-tz-white truncate">
                    {user.full_name || 'No name'}
                  </p>
                  {user.role === 'admin' && (
                    <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 bg-tz-gold/10 border border-tz-gold/30 text-tz-gold">
                      <Crown size={8} /> Admin
                    </span>
                  )}
                  <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 border ${STATUS_COLORS[user.status] ?? STATUS_COLORS.active}`}>
                    {user.status}
                  </span>
                </div>
                <p className="text-xs text-tz-muted font-body mt-0.5 truncate">{user.email}</p>
                <p className="text-[10px] text-tz-muted font-body mt-1">Member since {fmt(user.created_at)}</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Orders',     val: orders.length },
                { label: 'Addresses',  val: addresses.length },
                { label: 'Total Spend', val: fmtCurrency(totalSpend) },
              ].map(({ label, val }) => (
                <div key={label} className="bg-tz-surface/30 border border-tz-border p-3 text-center">
                  <p className="font-body font-bold text-sm text-tz-white">{val}</p>
                  <p className="font-body text-[10px] text-tz-muted mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-tz-border flex-shrink-0">
            {['profile', 'addresses', 'orders'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs font-body capitalize transition-all border-b-2 -mb-px ${
                  tab === t ? 'border-tz-gold text-tz-gold' : 'border-transparent text-tz-muted hover:text-tz-text'
                }`}>
                {t}
                {t === 'addresses' && addresses.length > 0 && (
                  <span className="ml-1 text-[9px] bg-tz-border px-1 py-0.5">{addresses.length}</span>
                )}
                {t === 'orders' && orders.length > 0 && (
                  <span className="ml-1 text-[9px] bg-tz-border px-1 py-0.5">{orders.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Profile tab ── */}
            {tab === 'profile' && (
              <div className="p-6 space-y-5">
                <div className="space-y-3">
                  {[
                    { icon: Mail,     label: 'Email',   val: user.email },
                    { icon: User,     label: 'Name',    val: user.full_name || '—' },
                    { icon: Calendar, label: 'Joined',  val: fmt(user.created_at) },
                    { icon: Shield,   label: 'User ID', val: user.id.split('-')[0] + '…', mono: true },
                  ].map(({ icon: Icon, label, val, mono }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon size={14} className="text-tz-muted mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-tz-muted font-body">{label}</p>
                        <p className={`text-xs text-tz-white font-body truncate ${mono ? 'font-mono' : ''}`}>{val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-tz-border pt-5 space-y-4">
                  <p className="text-xs font-semibold text-tz-white font-body">Edit Role & Status</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label-base">Role</label>
                      <select value={editRole} onChange={e => setEditRole(e.target.value)} className="input-base w-full text-sm">
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="label-base">Status</label>
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="input-base w-full text-sm">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="banned">Banned</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveRole}
                    disabled={saving || (editRole === user.role && editStatus === user.status)}
                    className="flex items-center gap-2 text-xs font-body bg-tz-gold text-tz-black px-4 py-2 hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    {saving ? <><Loader2 size={12} className="animate-spin" />Saving…</> : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Addresses tab ── */}
            {tab === 'addresses' && (
              <div className="p-6 space-y-3">
                {addresses.length === 0 ? (
                  <div className="py-12 text-center">
                    <MapPin size={28} className="text-tz-muted mx-auto mb-3" />
                    <p className="text-sm text-tz-muted font-body">No saved addresses</p>
                  </div>
                ) : (
                  addresses.map(addr => {
                    const Icon = TYPE_ICONS[addr.type ?? 'home'] ?? Home
                    return (
                      <div key={addr.id}
                        className={`p-4 border flex gap-3 ${addr.is_default ? 'border-tz-gold/40' : 'border-tz-border'}`}>
                        <div className="w-8 h-8 bg-tz-gold/10 border border-tz-gold/20 flex items-center justify-center flex-shrink-0">
                          <Icon size={13} className="text-tz-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-xs font-semibold text-tz-white font-body">{addr.full_name}</p>
                            <span className="text-[9px] capitalize text-tz-muted border border-tz-border px-1 py-0.5 font-body">{addr.type}</span>
                            {addr.is_default && (
                              <span className="text-[9px] text-tz-gold border border-tz-gold/30 bg-tz-gold/10 px-1 py-0.5 font-body font-bold">DEFAULT</span>
                            )}
                          </div>
                          <p className="text-xs text-tz-muted font-body">{addr.phone}</p>
                          <p className="text-xs text-tz-muted font-body mt-0.5">
                            {[addr.address_line, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* ── Orders tab ── */}
            {tab === 'orders' && (
              <div className="p-6 space-y-3">
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingBag size={28} className="text-tz-muted mx-auto mb-3" />
                    <p className="text-sm text-tz-muted font-body">No orders yet</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <Link
                      key={order.id}
                      to={`/admin/orders/${order.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-4 border border-tz-border hover:border-tz-border-2 hover:bg-white/3 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-tz-surface/50 border border-tz-border flex items-center justify-center flex-shrink-0">
                        <Package size={15} className="text-tz-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-tz-white font-body">
                            #{(order.order_number ?? order.id.split('-')[0]).toUpperCase()}
                          </p>
                          <span className={`text-[9px] px-1.5 py-0.5 font-body capitalize font-medium ${ORDER_STATUS_COLORS[order.status] ?? 'text-tz-muted bg-tz-border/30'}`}>
                            {order.status}
                          </span>
                          {order.coupon_code && (
                            <span className="text-[9px] text-tz-gold font-body">🏷 {order.coupon_code}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-tz-muted font-body mt-0.5">{fmt(order.created_at)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-tz-white font-body">{fmtCurrency(order.total_amount)}</p>
                        <ExternalLink size={10} className="text-tz-muted mt-1 ml-auto group-hover:text-tz-gold transition-colors" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}

// ─── Main Users Page ──────────────────────────────────────────────────────────
// CHANGED: fetchUsers now queries `admin_users_with_orders` VIEW
// which returns all user columns PLUS: total_orders, total_spent, last_order_date
export default function AdminUsers() {
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [page,       setPage]       = useState(1)
  const PER_PAGE = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      // ── Query the VIEW instead of the plain users table ──────────
      // admin_users_with_orders aggregates total_orders, total_spent,
      // last_order_date via a LEFT JOIN on orders. Run batch37_fixes.sql
      // first to create this view.
      let q = supabase
        .from('admin_users_with_orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (roleFilter !== 'all') q = q.eq('role', roleFilter)
      if (search.trim()) {
        q = q.or(`email.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%`)
      }

      const { data, error } = await q.range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
      if (error) throw error
      setUsers(data ?? [])
    } catch (err) {
      console.error('[AdminUsers] fetchUsers error:', err)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { setPage(1) }, [search, roleFilter])

  function handleUserUpdated(updated) {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u))
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl text-tz-white font-light">Users</h1>
          <p className="text-xs text-tz-muted font-body mt-0.5">Manage customer accounts</p>
        </div>
        <button onClick={fetchUsers} disabled={loading}
          className="flex items-center gap-2 text-xs text-tz-muted hover:text-tz-white font-body transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="input-base w-full pl-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-muted hover:text-tz-white">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {['all', 'customer', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 text-xs font-body capitalize border transition-all ${
                roleFilter === r
                  ? 'border-tz-gold bg-tz-gold/10 text-tz-gold'
                  : 'border-tz-border text-tz-muted hover:border-tz-border-2'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-tz-dark border border-tz-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-tz-gold" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <User size={28} className="text-tz-muted mx-auto mb-3" />
            <p className="text-sm text-tz-muted font-body">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-tz-border bg-tz-surface/20">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-tz-muted uppercase tracking-wider font-body">User</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-tz-muted uppercase tracking-wider font-body hidden md:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-tz-muted uppercase tracking-wider font-body">Role</th>
                  {/* ── NEW COLUMNS ── */}
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-tz-muted uppercase tracking-wider font-body hidden lg:table-cell">Orders</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-tz-muted uppercase tracking-wider font-body hidden lg:table-cell">Total Spent</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-tz-muted uppercase tracking-wider font-body hidden xl:table-cell">Last Order</th>
                  {/* ── END NEW COLUMNS ── */}
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-tz-muted uppercase tracking-wider font-body hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tz-border">
                {users.map(user => (
                  <tr key={user.id}
                    onClick={() => setSelectedId(user.id)}
                    className="hover:bg-white/3 cursor-pointer transition-colors group"
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size={36} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-tz-white font-body truncate max-w-[180px]">
                            {user.full_name || <span className="text-tz-muted italic">No name</span>}
                          </p>
                          <p className="text-[10px] text-tz-muted font-body truncate max-w-[180px]">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-tz-muted font-body">{fmt(user.created_at)}</span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 border font-body ${
                        user.role === 'admin'
                          ? 'border-tz-gold/30 bg-tz-gold/10 text-tz-gold'
                          : 'border-tz-border text-tz-muted'
                      }`}>
                        {user.role ?? 'customer'}
                      </span>
                    </td>

                    {/* Orders count — from VIEW */}
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className={`text-xs font-semibold font-body ${
                        Number(user.total_orders) > 0 ? 'text-tz-white' : 'text-tz-muted'
                      }`}>
                        {user.total_orders ?? 0}
                      </span>
                    </td>

                    {/* Total spent — from VIEW */}
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className={`text-xs font-semibold font-body ${
                        Number(user.total_spent) > 0 ? 'text-tz-gold' : 'text-tz-muted'
                      }`}>
                        {Number(user.total_spent) > 0 ? fmtCurrency(user.total_spent) : '—'}
                      </span>
                    </td>

                    {/* Last order date — from VIEW */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-[10px] text-tz-muted font-body">{fmt(user.last_order_date)}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 border font-body ${STATUS_COLORS[user.status] ?? STATUS_COLORS.active}`}>
                        {user.status ?? 'active'}
                      </span>
                    </td>

                    {/* Arrow */}
                    <td className="px-4 py-3 text-right">
                      <ChevronRight size={14} className="text-tz-muted group-hover:text-tz-gold transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && users.length === PER_PAGE && (
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-xs font-body border border-tz-border text-tz-muted hover:border-tz-border-2 disabled:opacity-40 transition-all"
          >
            ← Previous
          </button>
          <span className="text-xs text-tz-muted font-body">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={users.length < PER_PAGE}
            className="px-4 py-2 text-xs font-body border border-tz-border text-tz-muted hover:border-tz-border-2 disabled:opacity-40 transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setSelectedId(null)}
            />
            <UserDetailPanel
              userId={selectedId}
              onClose={() => setSelectedId(null)}
              onUserUpdated={handleUserUpdated}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}