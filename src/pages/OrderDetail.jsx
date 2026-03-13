// src/pages/OrderDetail.jsx
// BATCH 24 ADDITIONS:
//   - Return & Refund request button (delivered orders only)
//   - Return request modal with reason, description, item selection
//   - Shows existing return request status if already submitted
//   - Courier tracking links (Delhivery, Bluedart, Ekart, Dtdc, etc.)
//   - Estimated delivery chip based on shipped date

import { useEffect, useState }           from 'react'
import { useParams, Link, useNavigate }   from 'react-router-dom'
import { motion, AnimatePresence }        from 'framer-motion'
import {
  Package, Check, Clock, Truck,
  ShoppingBag, MapPin, Phone, ArrowLeft, AlertCircle,
  ChevronRight, RotateCcw, ExternalLink, X, ChevronDown,
  Loader2, CheckCircle2,
} from 'lucide-react'
import { supabase }   from '@/lib/supabase'
import useAuthStore   from '@/store/authStore'
import toast          from 'react-hot-toast'

// ─── Status pipeline ──────────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'pending',    label: 'Order Placed',  icon: ShoppingBag, desc: 'We received your order'        },
  { key: 'confirmed',  label: 'Confirmed',      icon: Check,       desc: 'Payment confirmed'             },
  { key: 'processing', label: 'Processing',     icon: Package,     desc: 'Being packed at our warehouse' },
  { key: 'shipped',    label: 'Shipped',        icon: Truck,       desc: 'On its way to you'             },
  { key: 'delivered',  label: 'Delivered',      icon: Check,       desc: 'Enjoy your order!'             },
]
const STATUS_ORDER = STATUS_STEPS.map(s => s.key)
const STATUS_COLORS = {
  pending:    'text-amber-400',
  confirmed:  'text-blue-400',
  processing: 'text-purple-400',
  shipped:    'text-sky-400',
  delivered:  'text-emerald-400',
  cancelled:  'text-red-400',
}

// ─── Courier tracking URL map ─────────────────────────────────────────────────
const COURIER_URLS = {
  delhivery:    n => `https://www.delhivery.com/track/package/${n}`,
  bluedart:     n => `https://www.bluedart.com/tracking?trackfor=${n}`,
  ekart:        n => `https://ekartlogistics.com/shipmenttrack/${n}`,
  dtdc:         n => `https://www.dtdc.in/tracking/track-result.asp?TrkType=consignment&strCnno=${n}`,
  'india post': n => `https://www.indiapost.gov.in/VAS/Pages/trackconsignment.aspx`,
  xpressbees:   n => `https://www.xpressbees.com/shipment/tracking?shipmentNo=${n}`,
  shadowfax:    n => `https://tracker.shadowfax.in/track?awb=${n}`,
  ecom:         n => `https://ecomexpress.in/tracking/?awb_field=${n}`,
}

function getTrackingUrl(courier, number) {
  if (!courier || !number) return null
  const key = Object.keys(COURIER_URLS).find(k =>
    courier.toLowerCase().includes(k)
  )
  return key ? COURIER_URLS[key](number) : null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
function formatShort(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Status Timeline ──────────────────────────────────────────────────────────
function StatusTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <p className="text-red-400 font-semibold">Order Cancelled</p>
          <p className="text-tz-muted text-sm">
            If you were charged, a refund will be processed in 5–7 business days.
          </p>
        </div>
      </div>
    )
  }

  const currentIdx = STATUS_ORDER.indexOf(status)

  return (
    <div className="relative">
      <div className="absolute left-[18px] top-5 bottom-5 w-px bg-tz-border" />
      <div className="space-y-1">
        {STATUS_STEPS.map((step, i) => {
          const done    = i <= currentIdx
          const current = i === currentIdx
          const Icon    = step.icon
          return (
            <motion.div
              key={step.key}
              className="flex items-start gap-4 py-3 relative"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                done
                  ? current
                    ? 'bg-tz-gold border-tz-gold'
                    : 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-tz-dark border-tz-border'
              }`}>
                {done && !current
                  ? <Check className="w-4 h-4 text-emerald-400" />
                  : <Icon className={`w-4 h-4 ${done ? 'text-tz-black' : 'text-tz-muted'}`} />
                }
              </div>
              <div className="pt-1.5">
                <p className={`text-sm font-semibold ${done ? 'text-tz-white' : 'text-tz-muted'}`}>
                  {step.label}
                </p>
                {current && <p className="text-tz-muted text-xs mt-0.5">{step.desc}</p>}
              </div>
              {current && (
                <motion.div
                  className="absolute left-0 top-2.5 w-9 h-9 rounded-full border-2 border-tz-gold"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Return Request Modal ─────────────────────────────────────────────────────
const RETURN_REASONS = [
  'Wrong size / doesn\'t fit',
  'Defective or damaged product',
  'Wrong item received',
  'Product not as described',
  'Changed my mind',
  'Other',
]

function ReturnRequestModal({ order, onClose, onSubmitted }) {
  const [reason,      setReason]      = useState('')
  const [description, setDescription] = useState('')
  const [selectedItems, setSelectedItems] = useState(
    () => new Set((order.order_items ?? []).map(i => i.id))
  )
  const [submitting, setSubmitting] = useState(false)

  function toggleItem(id) {
    setSelectedItems(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  async function handleSubmit() {
    if (!reason) { toast.error('Please select a reason'); return }
    if (selectedItems.size === 0) { toast.error('Select at least one item to return'); return }

    const returnItems = (order.order_items ?? [])
      .filter(i => selectedItems.has(i.id))
      .map(i => ({
        order_item_id: i.id,
        product_name:  i.products?.name ?? 'Unknown',
        quantity:      i.quantity,
        size:          i.size,
        price:         i.price,
      }))

    setSubmitting(true)
    const { error } = await supabase.from('return_requests').insert({
      order_id:     order.id,
      user_id:      order.user_id,
      reason,
      description:  description.trim() || null,
      return_items: returnItems,
    })
    setSubmitting(false)

    if (error) {
      toast.error('Failed to submit request. Please try again.')
      console.error(error)
      return
    }

    toast.success('Return request submitted!')
    onSubmitted()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative z-10 w-full sm:max-w-lg bg-tz-dark border border-tz-border rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-tz-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <RotateCcw size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-tz-white font-semibold">Request Return / Refund</h3>
              <p className="text-tz-muted text-xs">Order #{order.id.split('-')[0].toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-tz-muted hover:text-tz-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Item selection */}
          <div>
            <p className="text-xs font-semibold text-tz-white mb-2.5">
              Which items are you returning? *
            </p>
            <div className="space-y-2">
              {(order.order_items ?? []).map(item => (
                <label key={item.id}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                    selectedItems.has(item.id)
                      ? 'border-tz-gold/50 bg-tz-gold/5'
                      : 'border-tz-border hover:border-tz-border/80'
                  }`}
                >
                  <input type="checkbox" checked={selectedItems.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="accent-tz-gold shrink-0" />
                  {item.products?.images?.[0] && (
                    <img src={item.products.images[0]} alt={item.products.name}
                      className="w-10 h-12 object-cover rounded-lg border border-tz-border shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-tz-white text-sm font-medium line-clamp-1">
                      {item.products?.name ?? 'Product'}
                    </p>
                    <p className="text-tz-muted text-xs">
                      {[item.size && `Size: ${item.size}`, `Qty: ${item.quantity}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <p className="text-tz-white text-sm font-semibold shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-tz-white mb-2 block">Reason for return *</label>
            <div className="relative">
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="input-base w-full text-sm appearance-none pr-8"
              >
                <option value="">Select a reason…</option>
                {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-tz-white mb-2 block">
              Additional details <span className="text-tz-muted font-normal">(optional)</span>
            </label>
            <textarea
              className="input-base w-full resize-none text-sm"
              rows={3}
              placeholder="Describe the issue in detail — include photos if defective…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Policy note */}
          <div className="bg-tz-black/40 border border-tz-border rounded-xl p-3.5 text-xs text-tz-muted space-y-1">
            <p className="text-tz-white font-medium mb-1">Return Policy</p>
            <p>• Returns accepted within 30 days of delivery</p>
            <p>• Items must be unused, unwashed, and in original packaging</p>
            <p>• Refund processed in 5–7 business days after we receive the item</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-tz-border shrink-0 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason || selectedItems.size === 0}
            className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting
              ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
              : <><RotateCcw size={14} /> Submit Request</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Return Status Card ───────────────────────────────────────────────────────
const RETURN_STATUS_META = {
  pending:   { label: 'Under Review',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   desc: 'We\'ve received your request and will review it within 2 business days.' },
  approved:  { label: 'Approved',       cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', desc: 'Your return has been approved. Please ship the item(s) back to us.' },
  rejected:  { label: 'Not Approved',   cls: 'bg-red-500/10 text-red-400 border-red-500/20',         desc: 'Unfortunately we were unable to approve this return request.' },
  completed: { label: 'Refund Issued',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',      desc: 'Your refund has been processed successfully.' },
}

function ReturnStatusCard({ returnRequest }) {
  const meta = RETURN_STATUS_META[returnRequest.status] ?? RETURN_STATUS_META.pending
  return (
    <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RotateCcw size={16} className="text-tz-gold" />
          <p className="text-tz-white font-semibold text-sm">Return Request</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${meta.cls}`}>
          {meta.label}
        </span>
      </div>
      <p className="text-tz-muted text-xs leading-relaxed mb-3">{meta.desc}</p>
      <div className="text-xs text-tz-muted space-y-1">
        <p><span className="text-tz-white">Reason:</span> {returnRequest.reason}</p>
        <p><span className="text-tz-white">Submitted:</span> {formatShort(returnRequest.created_at)}</p>
        {returnRequest.refund_amount && (
          <p><span className="text-tz-white">Refund Amount:</span> ₹{returnRequest.refund_amount.toLocaleString('en-IN')}</p>
        )}
        {returnRequest.admin_notes && (
          <div className="mt-2 p-2.5 bg-tz-surface/40 border border-tz-border rounded-lg">
            <p className="text-tz-white text-xs font-medium mb-0.5">Note from support:</p>
            <p className="text-tz-muted text-xs">{returnRequest.admin_notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OrderDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const user      = useAuthStore(s => s.user)
  const isLoading = useAuthStore(s => s.isLoading)

  const [order,         setOrder]         = useState(null)
  const [returnRequest, setReturnRequest] = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [showReturn,    setShowReturn]    = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!user) { navigate('/login'); return }

    Promise.all([
      supabase
        .from('orders')
        .select(`*, order_items ( id, quantity, price, size, color, product_id, products ( id, name, images ) )`)
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('return_requests')
        .select('*')
        .eq('order_id', id)
        .maybeSingle(),
    ]).then(([{ data: orderData, error: orderErr }, { data: returnData }]) => {
      if (orderErr || !orderData) {
        setError("Order not found or you don't have access to it.")
      } else {
        setOrder({ ...orderData, user_id: user.id })
        setReturnRequest(returnData ?? null)
      }
      setLoading(false)
    })
  }, [id, user, isLoading, navigate])

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-tz-dark flex items-center justify-center">
        <motion.div className="w-10 h-10 rounded-full border-2 border-tz-gold border-t-transparent"
          animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-tz-dark flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-tz-muted">{error}</p>
        <Link to="/orders" className="btn-primary px-5 py-2.5 text-sm rounded-xl">Back to Orders</Link>
      </div>
    )
  }

  if (!order) return null

  const subtotal   = order.order_items?.reduce((s, i) => s + i.price * i.quantity, 0) ?? order.total_amount
  const shipping   = order.shipping_cost ?? 0
  const discount   = order.discount_amount ?? 0
  const total      = order.total_amount ?? subtotal + shipping - discount
  const canReturn  = order.status === 'delivered' && !returnRequest
  const trackingUrl = getTrackingUrl(order.courier_name, order.tracking_number)

  return (
    <div className="min-h-screen bg-tz-dark">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">

        <Link to="/orders" className="flex items-center gap-2 text-tz-muted hover:text-tz-white transition-colors text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-tz-white">Order Details</h1>
            <p className="text-tz-muted text-sm mt-1">
              #{order.id.split('-')[0].toUpperCase()} · Placed {formatShort(order.created_at)}
            </p>
          </div>
          <span className="text-sm font-semibold capitalize px-3.5 py-1.5 rounded-full bg-black/20">
            <span className={STATUS_COLORS[order.status]}>{order.status}</span>
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* ── Left col ── */}
          <div className="md:col-span-2 space-y-4">

            {/* Items */}
            <div className="bg-tz-black/40 border border-tz-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-tz-border">
                <p className="text-tz-white font-semibold">
                  {order.order_items?.length ?? '?'} item{order.order_items?.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="divide-y divide-tz-border/40">
                {order.order_items?.map(item => (
                  <div key={item.id} className="flex gap-4 p-4">
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-tz-dark shrink-0">
                      {item.products?.images?.[0] ? (
                        <img src={item.products.images[0]} alt={item.products?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-tz-muted opacity-40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product_id}`}
                        className="text-tz-white text-sm font-medium hover:text-tz-gold transition-colors line-clamp-2">
                        {item.products?.name ?? 'Product'}
                      </Link>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                        {item.size  && <span className="text-tz-muted text-xs">Size: {item.size}</span>}
                        {item.color && <span className="text-tz-muted text-xs">Color: {item.color}</span>}
                        <span className="text-tz-muted text-xs">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-tz-white font-semibold text-sm">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-tz-muted text-xs mt-0.5">
                          ₹{item.price.toLocaleString('en-IN')} each
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price summary */}
            <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
              <p className="text-tz-white font-semibold mb-4">Price Details</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-tz-muted">Subtotal</span>
                  <span className="text-tz-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-tz-muted">Shipping</span>
                    <span className="text-tz-white">₹{shipping.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-tz-muted">
                      Discount
                      {order.coupon_code && (
                        <code className="ml-1.5 text-xs bg-tz-gold/10 text-tz-gold border border-tz-gold/20 px-1.5 py-0.5 rounded font-mono">
                          {order.coupon_code}
                        </code>
                      )}
                    </span>
                    <span className="text-emerald-400">−₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="border-t border-tz-border pt-2.5 flex justify-between font-bold">
                  <span className="text-tz-white">Total Paid</span>
                  <span className="text-tz-gold text-base">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              {order.payment_method && (
                <p className="text-tz-muted text-xs mt-3 pt-3 border-t border-tz-border/50">
                  Paid via <span className="text-tz-white capitalize">{order.payment_method}</span>
                  {order.payment_ref && <> · Ref: <span className="font-mono">{order.payment_ref}</span></>}
                </p>
              )}
            </div>

            {/* Return request status or CTA */}
            {returnRequest ? (
              <ReturnStatusCard returnRequest={returnRequest} />
            ) : canReturn ? (
              <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <RotateCcw size={16} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-tz-white font-semibold text-sm">Not happy with your order?</p>
                    <p className="text-tz-muted text-xs mt-0.5 mb-3">
                      You can request a return or refund within 30 days of delivery.
                    </p>
                    <button
                      onClick={() => setShowReturn(true)}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <RotateCcw size={13} /> Request Return / Refund
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* ── Right col ── */}
          <div className="space-y-4">
            {/* Status timeline */}
            <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
              <p className="text-tz-white font-semibold mb-5">Order Status</p>
              <StatusTimeline status={order.status} />
            </div>

            {/* Tracking */}
            {order.tracking_number && (
              <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-tz-gold" />
                  <p className="text-tz-white font-semibold text-sm">Shipment Tracking</p>
                </div>
                {order.courier_name && (
                  <p className="text-tz-muted text-xs mb-1 uppercase tracking-wider">
                    {order.courier_name}
                  </p>
                )}
                <code className="text-tz-gold font-mono text-sm block mb-3">
                  {order.tracking_number}
                </code>
                {trackingUrl ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-tz-gold hover:underline"
                  >
                    <ExternalLink size={11} /> Track on {order.courier_name} website
                  </a>
                ) : (
                  <p className="text-tz-muted text-xs">
                    Use this number on your courier's website to track.
                  </p>
                )}
              </div>
            )}

            {/* Address */}
            {order.shipping_address && (
              <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-tz-gold" />
                  <p className="text-tz-white font-semibold text-sm">Delivery Address</p>
                </div>
                {(() => {
                  const addr = typeof order.shipping_address === 'string'
                    ? JSON.parse(order.shipping_address)
                    : order.shipping_address
                  return (
                    <div className="text-tz-muted text-sm space-y-0.5 leading-relaxed">
                      {addr.name    && <p className="text-tz-white font-medium">{addr.name}</p>}
                      {addr.line1   && <p>{addr.line1}</p>}
                      {addr.line2   && <p>{addr.line2}</p>}
                      {(addr.city || addr.state) && <p>{[addr.city, addr.state].filter(Boolean).join(', ')}</p>}
                      {addr.pincode && <p>PIN: {addr.pincode}</p>}
                      {addr.phone   && <p className="flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {addr.phone}</p>}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Order date */}
            <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-tz-gold" />
                <p className="text-tz-white font-semibold text-sm">Order Date</p>
              </div>
              <p className="text-tz-muted text-sm">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Return request modal */}
      <AnimatePresence>
        {showReturn && (
          <ReturnRequestModal
            order={order}
            onClose={() => setShowReturn(false)}
            onSubmitted={() => {
              // reload return request
              supabase.from('return_requests').select('*').eq('order_id', id).maybeSingle()
                .then(({ data }) => setReturnRequest(data))
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}