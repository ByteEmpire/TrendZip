// src/pages/admin/ReturnRequests.jsx
// Lists all return requests across all orders with status management

import { useEffect, useState, useCallback } from 'react'
import { Link }                              from 'react-router-dom'
import { motion }                            from 'framer-motion'
import {
  RotateCcw, Search, X, Eye, CheckCircle2,
  XCircle, Check, ChevronLeft, ChevronRight,
  Loader2, Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast        from 'react-hot-toast'

const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'completed']

const STATUS_META = {
  pending:   { label: 'Pending Review', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20'      },
  approved:  { label: 'Approved',       cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected:  { label: 'Rejected',       cls: 'bg-red-500/10 text-red-400 border-red-500/20'            },
  completed: { label: 'Refunded',       cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'         },
}

const PAGE_SIZE = 20

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminReturnRequests() {
  const [requests,     setRequests]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [totalCount,   setTotalCount]   = useState(0)
  const [page,         setPage]         = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [search,       setSearch]       = useState('')
  const [updating,     setUpdating]     = useState(null) // id being updated

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('return_requests')
      .select(`
        id, order_id, reason, status, refund_amount, created_at, return_items,
        orders ( id, total_amount, profiles ( full_name, email ) )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (statusFilter) query = query.eq('status', statusFilter)

    const { data, count } = await query
    setRequests(data ?? [])
    setTotalCount(count ?? 0)
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [statusFilter, search])

  async function updateStatus(id, newStatus) {
    setUpdating(id)
    const { error } = await supabase
      .from('return_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
    setUpdating(null)
    if (error) { toast.error('Failed to update'); return }
    toast.success(`Marked as ${newStatus}`)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Client-side search filter
  const filtered = search.trim()
    ? requests.filter(r =>
        r.orders?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.orders?.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
        r.reason?.toLowerCase().includes(search.toLowerCase()) ||
        r.order_id?.startsWith(search.toLowerCase())
      )
    : requests

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-tz-white mb-1">Return Requests</h1>
          <p className="text-tz-muted text-sm">
            {totalCount} total
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-400 font-medium">· {pendingCount} pending review</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted" />
          <input
            type="text"
            className="input-base pl-9 py-2 text-sm w-full"
            placeholder="Search by customer, email, reason…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-muted hover:text-tz-white">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              !statusFilter ? 'bg-tz-gold/10 border-tz-gold/30 text-tz-gold' : 'border-tz-border text-tz-muted hover:text-tz-white'
            }`}
          >
            All
          </button>
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(f => f === s ? '' : s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all capitalize ${
                statusFilter === s ? STATUS_META[s].cls : 'border-tz-border text-tz-muted hover:text-tz-white'
              }`}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-tz-black/40 border border-tz-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-tz-border/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-28 h-4 bg-tz-border/30 rounded" />
                <div className="flex-1 h-4 bg-tz-border/20 rounded" />
                <div className="w-32 h-4 bg-tz-border/30 rounded" />
                <div className="w-24 h-6 bg-tz-border/20 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <RotateCcw size={40} className="mx-auto mb-4 text-tz-muted opacity-20" />
            <p className="text-tz-muted">No return requests found</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1fr_1.5fr_80px] gap-4 px-5 py-3 border-b border-tz-border bg-tz-black/30">
              {['Order', 'Customer', 'Reason', 'Refund', 'Status', ''].map(h => (
                <p key={h} className="text-tz-muted text-xs uppercase tracking-wider font-medium">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-tz-border/30">
              {filtered.map(req => {
                const meta = STATUS_META[req.status] ?? STATUS_META.pending
                const isUpdating = updating === req.id
                return (
                  <motion.div key={req.id} layout
                    className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1.5fr_1fr_1.5fr_80px] gap-4 px-5 py-4 items-center hover:bg-tz-black/20 transition-colors"
                  >
                    {/* Order */}
                    <div>
                      <p className="text-tz-white text-sm font-mono font-medium">
                        #{req.order_id?.split('-')[0].toUpperCase()}
                      </p>
                      <p className="text-tz-muted text-xs mt-0.5">{formatDate(req.created_at)}</p>
                    </div>

                    {/* Customer */}
                    <div className="min-w-0">
                      <p className="text-tz-white text-sm truncate">{req.orders?.profiles?.full_name ?? 'Unknown'}</p>
                      <p className="text-tz-muted text-xs truncate">{req.orders?.profiles?.email ?? ''}</p>
                    </div>

                    {/* Reason */}
                    <div className="min-w-0">
                      <p className="text-tz-white text-xs line-clamp-1">{req.reason}</p>
                      <p className="text-tz-muted text-xs mt-0.5">
                        {req.return_items?.length ?? 0} item{req.return_items?.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Refund amount */}
                    <div>
                      {req.refund_amount
                        ? <p className="text-emerald-400 text-sm font-semibold">₹{req.refund_amount.toLocaleString('en-IN')}</p>
                        : <p className="text-tz-muted text-xs">Not set</p>
                      }
                    </div>

                    {/* Status + quick actions */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${meta.cls}`}>
                        {meta.label}
                      </span>
                      {req.status === 'pending' && !isUpdating && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateStatus(req.id, 'approved')}
                            className="w-6 h-6 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            onClick={() => updateStatus(req.id, 'rejected')}
                            className="w-6 h-6 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                      {isUpdating && <Loader2 size={14} className="animate-spin text-tz-muted" />}
                    </div>

                    {/* View order */}
                    <div className="text-right">
                      <Link
                        to={`/admin/orders/${req.order_id}`}
                        className="text-tz-muted hover:text-tz-gold transition-colors"
                        title="View full order"
                      >
                        <Eye size={15} />
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
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
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="w-8 h-8 rounded-lg border border-tz-border flex items-center justify-center text-tz-muted hover:text-tz-white disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="text-tz-muted text-sm px-1">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="w-8 h-8 rounded-lg border border-tz-border flex items-center justify-center text-tz-muted hover:text-tz-white disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}