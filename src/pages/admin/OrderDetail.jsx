// src/pages/admin/OrderDetail.jsx
// FIXES:
//   - Corrected all column names to match actual DB schema:
//       total_amount     → total
//       discount_amount  → discount
//       shipping_address → address_snapshot
//       payment_id       → razorpay_payment_id
//   - Removed references to payment_status (not in schema)
//   - address_snapshot is JSONB with keys: full_name, phone, address, city, state, pincode
//   - Removed double AdminLayout wrapper

import { useEffect, useState }          from 'react'
import { useParams, Link, useNavigate }  from 'react-router-dom'
import { motion, AnimatePresence }       from 'framer-motion'
import {
  ArrowLeft, Check, Package, Truck, ShoppingBag,
  MapPin, AlertCircle, Tag, Hash, ChevronDown,
  Copy, CheckCheck, ExternalLink, Loader2,
  RotateCcw, CheckCircle2, XCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast        from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_META = {
  pending:    { label: 'Pending',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'     },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20'       },
  processing: { label: 'Processing', color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20'   },
  shipped:    { label: 'Shipped',    color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20'         },
  delivered:  { label: 'Delivered',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
}

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const RETURN_STATUS_META = {
  pending:   { label: 'Pending Review', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20'       },
  approved:  { label: 'Approved',       cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected:  { label: 'Rejected',       cls: 'bg-red-500/10 text-red-400 border-red-500/20'             },
  completed: { label: 'Completed',      cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'          },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Status Timeline ──────────────────────────────────────────────────────────
function Timeline({ status }) {
  const currentIdx  = STATUS_STEPS.indexOf(status)
  const isCancelled = status === 'cancelled'
  const icons = {
    pending: ShoppingBag, confirmed: Check,
    processing: Package, shipped: Truck, delivered: Check,
  }

  if (isCancelled) return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
      <div>
        <p className="text-red-400 font-semibold text-sm">Order Cancelled</p>
        <p className="text-tz-muted text-xs mt-0.5">This order was cancelled.</p>
      </div>
    </div>
  )

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-tz-border" />
      <div className="space-y-5">
        {STATUS_STEPS.map((step, i) => {
          const done   = i <= currentIdx
          const active = i === currentIdx
          const Icon   = icons[step]
          return (
            <div key={step} className="relative flex items-start gap-4">
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done
                  ? active
                    ? 'border-tz-gold bg-tz-gold/20 text-tz-gold'
                    : 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-tz-border bg-tz-black text-tz-muted'
              }`}>
                <Icon className="w-3.5 h-3.5" />
                {active && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-tz-gold"
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </div>
              <div className="pt-1 min-w-0">
                <p className={`text-sm font-medium capitalize ${
                  done ? active ? 'text-tz-gold' : 'text-tz-white' : 'text-tz-muted'
                }`}>{step}</p>
                {active && <p className="text-tz-muted text-xs mt-0.5">Current status</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Status Select ────────────────────────────────────────────────────────────
function StatusSelect({ orderId, currentStatus, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)
  const meta = STATUS_META[currentStatus] ?? STATUS_META.pending

  const handleChange = async (newStatus) => {
    if (newStatus === currentStatus) { setOpen(false); return }
    setLoading(true); setOpen(false)
    const { error } = await supabase.from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    setLoading(false)
    if (error) toast.error('Could not update status')
    else { toast.success(`Status → ${newStatus}`); onUpdate(newStatus) }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${meta.bg} ${meta.color}`}
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <span className="capitalize">{meta.label}</span>
        }
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full mt-2 z-20 bg-tz-dark border border-tz-border rounded-xl overflow-hidden shadow-2xl min-w-[160px]"
            >
              {STATUSES.map(s => (
                <button key={s} onClick={() => handleChange(s)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-tz-black/40 transition-colors capitalize ${
                    s === currentStatus
                      ? (STATUS_META[s]?.color ?? 'text-tz-gold') + ' font-medium'
                      : 'text-tz-muted hover:text-tz-white'
                  }`}
                >
                  {s}{s === currentStatus && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tracking Editor ──────────────────────────────────────────────────────────
function TrackingEditor({ orderId, initialNumber, initialCourier, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [number,  setNumber]  = useState(initialNumber  ?? '')
  const [courier, setCourier] = useState(initialCourier ?? '')
  const [saving,  setSaving]  = useState(false)

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('orders')
      .update({
        tracking_number: number.trim()  || null,
        courier_name:    courier.trim() || null,
      })
      .eq('id', orderId)
    setSaving(false)
    if (error) toast.error('Could not save tracking info')
    else {
      toast.success('Tracking info saved')
      setEditing(false)
      onSaved?.(number.trim(), courier.trim())
    }
  }

  if (!editing) return (
    <div className="flex items-center justify-between">
      <div>
        {initialNumber ? (
          <>
            <p className="text-tz-white text-sm font-medium font-mono">{initialNumber}</p>
            {initialCourier && <p className="text-tz-muted text-xs mt-0.5">{initialCourier}</p>}
          </>
        ) : (
          <p className="text-tz-muted text-sm">No tracking info yet</p>
        )}
      </div>
      <button onClick={() => setEditing(true)} className="text-tz-gold text-xs hover:underline">
        {initialNumber ? 'Edit' : 'Add tracking'}
      </button>
    </div>
  )

  return (
    <div className="space-y-3">
      <div>
        <label className="label-base text-xs">Courier Name</label>
        <input className="input-base w-full text-sm" placeholder="e.g. Delhivery, Bluedart, Ekart"
          value={courier} onChange={e => setCourier(e.target.value)} />
      </div>
      <div>
        <label className="label-base text-xs">Tracking Number</label>
        <input className="input-base w-full text-sm font-mono" placeholder="e.g. DL1234567890"
          value={number} onChange={e => setNumber(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()} />
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 bg-tz-gold text-tz-black text-xs font-semibold px-4 py-2 hover:brightness-110 disabled:opacity-60 transition-all rounded-lg"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save
        </button>
        <button onClick={() => setEditing(false)}
          className="text-tz-muted text-xs hover:text-tz-white px-3 py-2 border border-tz-border transition-colors rounded-lg">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-tz-muted hover:text-tz-gold transition-colors ml-1.5" title="Copy">
      {copied
        ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
        : <Copy className="w-3.5 h-3.5" />
      }
    </button>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Card({ title, children, icon: Icon }) {
  return (
    <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
      {title && (
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-tz-border/50">
          {Icon && <Icon className="w-4 h-4 text-tz-gold" />}
          <h3 className="text-tz-white text-sm font-semibold">{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Return Request Panel ─────────────────────────────────────────────────────
function ReturnRequestPanel({ orderId }) {
  const [req,        setReq]        = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const [refundAmt,  setRefundAmt]  = useState('')
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    supabase.from('return_requests').select('*').eq('order_id', orderId).maybeSingle()
      .then(({ data }) => {
        setReq(data)
        setAdminNotes(data?.admin_notes ?? '')
        setRefundAmt(data?.refund_amount ?? '')
        setLoading(false)
      })
  }, [orderId])

  async function updateStatus(newStatus) {
    setSaving(true)
    const { data, error } = await supabase.from('return_requests')
      .update({
        status:        newStatus,
        admin_notes:   adminNotes.trim() || null,
        refund_amount: refundAmt ? Number(refundAmt) : null,
        resolved_at:   ['approved', 'rejected', 'completed'].includes(newStatus)
                         ? new Date().toISOString() : null,
        updated_at:    new Date().toISOString(),
      })
      .eq('id', req.id)
      .select().single()
    setSaving(false)
    if (error) toast.error('Failed to update')
    else { toast.success(`Return request ${newStatus}`); setReq(data) }
  }

  if (loading) return (
    <Card title="Return Request" icon={RotateCcw}>
      <div className="h-8 bg-tz-border/20 rounded animate-pulse" />
    </Card>
  )

  if (!req) return (
    <Card title="Return Request" icon={RotateCcw}>
      <p className="text-tz-muted text-xs">No return request for this order.</p>
    </Card>
  )

  const meta = RETURN_STATUS_META[req.status] ?? RETURN_STATUS_META.pending

  return (
    <Card title="Return Request" icon={RotateCcw}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${meta.cls}`}>
            {meta.label}
          </span>
          <span className="text-xs text-tz-muted">{formatDate(req.created_at)}</span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex gap-2">
            <span className="text-tz-muted shrink-0">Reason:</span>
            <span className="text-tz-white">{req.reason}</span>
          </div>
          {req.description && (
            <div className="flex gap-2">
              <span className="text-tz-muted shrink-0">Details:</span>
              <span className="text-tz-white">{req.description}</span>
            </div>
          )}
        </div>

        {req.return_items?.length > 0 && (
          <div>
            <p className="text-xs text-tz-muted mb-1.5">Items:</p>
            <div className="space-y-1">
              {req.return_items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-tz-black/40 border border-tz-border rounded-lg px-2.5 py-1.5">
                  <span className="text-tz-white line-clamp-1">{item.product_name}</span>
                  <span className="text-tz-muted shrink-0 ml-2">
                    {item.size && `${item.size} · `}Qty {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(req.status === 'pending' || req.status === 'approved') && (
          <div className="pt-3 border-t border-tz-border space-y-3">
            <div>
              <label className="label-base text-xs">Refund Amount (₹)</label>
              <input type="number" className="input-base w-full text-sm" placeholder="0"
                value={refundAmt} onChange={e => setRefundAmt(e.target.value)} />
            </div>
            <div>
              <label className="label-base text-xs">Note to customer</label>
              <textarea className="input-base w-full text-xs resize-none" rows={2}
                placeholder="Instructions for return shipping, reason for rejection, etc."
                value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {req.status === 'pending' && (
                <button onClick={() => updateStatus('approved')} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={12} /> Approve
                </button>
              )}
              {req.status === 'pending' && (
                <button onClick={() => updateStatus('rejected')} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <XCircle size={12} /> Reject
                </button>
              )}
              {req.status === 'approved' && (
                <button onClick={() => updateStatus('completed')} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                >
                  <Check size={12} /> Mark Refunded
                </button>
              )}
              {saving && <Loader2 size={14} className="animate-spin text-tz-muted self-center" />}
            </div>
          </div>
        )}

        {(req.status === 'rejected' || req.status === 'completed') && req.admin_notes && (
          <div className="pt-3 border-t border-tz-border text-xs">
            <p className="text-tz-muted mb-1">Your note:</p>
            <p className="text-tz-white">{req.admin_notes}</p>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminOrderDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('orders')
      .select(`
        id,
        created_at,
        updated_at,
        status,
        total,
        subtotal,
        discount,
        delivery_charge,
        payment_method,
        razorpay_payment_id,
        address_snapshot,
        tracking_number,
        courier_name,
        order_number,
        order_items (
          id, quantity, price, subtotal, size, color, name,
          products ( id, name, images, slug )
        )
      `)
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error('[OrderDetail] fetch failed:', error)
          navigate('/admin/orders')
          return
        }
        setOrder(data)
        setLoading(false)
      })
  }, [id, navigate])

  const handleStatusUpdate  = (newStatus) => setOrder(o => ({ ...o, status: newStatus }))
  const handleTrackingSaved = (number, courier) =>
    setOrder(o => ({ ...o, tracking_number: number || null, courier_name: courier || null }))

  if (loading) return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-tz-border/30 rounded-xl" />
        <div className="grid md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-tz-border/20 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )

  if (!order) return null

  // ── Derived values — all from correct column names ──────────────────────────
  const subtotal = order.subtotal
    ?? order.order_items?.reduce((s, i) => s + (i.price * i.quantity), 0)
    ?? 0
  const discount      = order.discount      ?? 0
  const deliveryCharge = order.delivery_charge ?? 0
  const total         = order.total          ?? 0
  const shortId       = order.order_number   ?? order.id.split('-')[0].toUpperCase()

  // address_snapshot shape: { full_name, phone, address, city, state, pincode, type }
  const addr = order.address_snapshot ?? {}

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="w-9 h-9 rounded-xl border border-tz-border flex items-center justify-center text-tz-muted hover:text-tz-white hover:border-tz-muted transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-tz-white">
              Order <span className="text-tz-gold">#{shortId}</span>
            </h1>
            <p className="text-tz-muted text-sm mt-0.5">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/users?search=${addr?.full_name ?? ''}`}
            className="flex items-center gap-1.5 text-tz-muted hover:text-tz-white text-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Customer
          </Link>
          <StatusSelect
            orderId={order.id}
            currentStatus={order.status}
            onUpdate={handleStatusUpdate}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-5">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Order Items */}
          <Card title="Order Items" icon={Package}>
            <div className="space-y-4">
              {order.order_items?.length ? order.order_items.map(item => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-14 rounded-xl overflow-hidden bg-tz-dark border border-tz-border shrink-0 aspect-[3/4]">
                    {item.products?.images?.[0]
                      ? <img src={item.products.images[0]} alt={item.products?.name ?? item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-tz-muted opacity-30" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-tz-white text-sm font-medium leading-tight line-clamp-2">
                      {item.products?.name ?? item.name ?? 'Unknown product'}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {item.size  && <p className="text-tz-muted text-xs">Size: {item.size}</p>}
                      {item.color && <p className="text-tz-muted text-xs">Color: {item.color}</p>}
                      <p className="text-tz-muted text-xs">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-tz-white text-sm font-semibold">{fmt(item.price * item.quantity)}</p>
                    <p className="text-tz-muted text-xs">{fmt(item.price)} each</p>
                  </div>
                </div>
              )) : (
                <p className="text-tz-muted text-sm text-center py-4">No items found</p>
              )}
            </div>

            {/* Price breakdown */}
            <div className="mt-5 pt-4 border-t border-tz-border/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-tz-muted">Subtotal</span>
                <span className="text-tz-text">{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-tz-muted flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-emerald-400" />
                    Discount
                  </span>
                  <span className="text-emerald-400">−{fmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-tz-muted">Delivery</span>
                <span className={deliveryCharge === 0 ? 'text-emerald-400' : 'text-tz-text'}>
                  {deliveryCharge === 0 ? 'FREE' : fmt(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-tz-border/50">
                <span className="text-tz-white">Total</span>
                <span className="text-tz-white text-base">{fmt(total)}</span>
              </div>
            </div>
          </Card>

          {/* Shipping Address — reads from address_snapshot JSONB */}
          <Card title="Shipping Address" icon={MapPin}>
            {addr.full_name || addr.address ? (
              <div className="text-sm text-tz-muted leading-relaxed space-y-0.5">
                {addr.full_name && <p className="text-tz-white font-medium">{addr.full_name}</p>}
                {addr.address   && <p>{addr.address}</p>}
                {(addr.city || addr.state) && (
                  <p>{[addr.city, addr.state].filter(Boolean).join(', ')}</p>
                )}
                {addr.pincode && <p>PIN: {addr.pincode}</p>}
                {addr.phone && (
                  <p className="flex items-center gap-1.5 mt-2 pt-2 border-t border-tz-border/30">
                    <span className="text-tz-muted">Phone:</span>
                    <span className="text-tz-white">{addr.phone}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-tz-muted text-sm">No address on record</p>
            )}
          </Card>
        </div>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <div className="space-y-5">

          <Card title="Order Status">
            <Timeline status={order.status} />
          </Card>

          <Card title="Customer">
            <div className="space-y-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-tz-muted shrink-0">Name</span>
                <span className="text-tz-white text-right">{addr.full_name ?? '—'}</span>
              </div>
              {addr.phone && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-tz-muted shrink-0">Phone</span>
                  <span className="text-tz-white flex items-center gap-1">
                    {addr.phone}
                    <CopyButton text={addr.phone} />
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card title="Payment">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-tz-muted">Method</span>
                <span className="text-tz-white capitalize">
                  {order.payment_method === 'razorpay' ? 'Razorpay' : order.payment_method ?? '—'}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div className="flex items-center justify-between pt-2 border-t border-tz-border/30">
                  <span className="text-tz-muted">Payment ID</span>
                  <span className="text-tz-white font-mono text-xs flex items-center gap-1">
                    {order.razorpay_payment_id.slice(0, 18)}…
                    <CopyButton text={order.razorpay_payment_id} />
                  </span>
                </div>
              )}
              {order.payment_method === 'cod' && (
                <div className="flex justify-between">
                  <span className="text-tz-muted">Status</span>
                  <span className="text-amber-400 font-medium">Pay on delivery</span>
                </div>
              )}
            </div>
          </Card>

          <Card title="Tracking" icon={Truck}>
            <TrackingEditor
              orderId={order.id}
              initialNumber={order.tracking_number}
              initialCourier={order.courier_name}
              onSaved={handleTrackingSaved}
            />
          </Card>

          <ReturnRequestPanel orderId={order.id} />

          <Card title="Order Info" icon={Hash}>
            <div className="space-y-2 text-xs font-mono text-tz-muted">
              <div className="flex items-center gap-1">
                <span className="shrink-0">ID:</span>
                <span className="text-tz-white break-all">{order.id}</span>
                <CopyButton text={order.id} />
              </div>
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-tz-white font-body">{formatDate(order.created_at)}</span>
              </div>
              {order.updated_at && (
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span className="text-tz-white font-body">{formatDate(order.updated_at)}</span>
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}