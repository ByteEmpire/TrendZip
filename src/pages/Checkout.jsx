// src/pages/Checkout.jsx  — v3
// CHANGES from v2 / Checkout_FINAL:
//   [1] SAVED ADDRESSES: Step 1 now shows user's saved addresses as
//       selectable cards. Clicking one fills the form instantly.
//       User can still enter a new address manually.
//   [2] FRAMER MOTION NaN% FIX: Removed all animated `width` values.
//       Height animations now only run when the target is a real number
//       or 'auto', never when source might be undefined/null.
//   [3] COUPON PAYABLE AMOUNT: discount is always taken from
//       appliedCoupon.discount (server-computed). If null, it is 0.
//       Total recalculates correctly on every render.
//   [4] track-cart CORS: edge function call is fully silent; no
//       unhandled promise rejections bubble to the console.
//   [5] All original logic from Checkout_FINAL preserved exactly.

import { useState, useEffect, useRef }    from 'react'
import { Link }                            from 'react-router-dom'
import { motion, AnimatePresence }         from 'framer-motion'
import {
  ChevronRight, Check, ShoppingBag,
  MapPin, Truck, CreditCard, Package,
  AlertCircle, Loader2, Shield,
  Tag, X, Ticket, Percent, BadgeIndianRupee,
  ChevronDown, ShieldCheck, Home, Briefcase,
  MoreHorizontal, Plus,
} from 'lucide-react'
import useCartStore    from '@/store/cartStore'
import useAuthStore    from '@/store/authStore'
import { supabase }    from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import SEO             from '@/components/SEO'

// ─── Razorpay script loader ───────────────────────────────────────────────────
function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src     = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const steps = ['Address', 'Delivery', 'Payment', 'Review']
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const idx    = i + 1
        const done   = currentStep > idx
        const active = currentStep === idx
        return (
          <div key={step} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 transition-all ${
              active ? 'text-tz-gold' : done ? 'text-tz-success' : 'text-tz-muted'
            }`}>
              <div className={`w-6 h-6 flex items-center justify-center border-2 text-[10px] font-bold font-body transition-all ${
                active
                  ? 'border-tz-gold bg-tz-gold text-tz-black'
                  : done
                  ? 'border-tz-success bg-tz-success text-white'
                  : 'border-tz-border text-tz-muted'
              }`}>
                {done ? <Check size={11} strokeWidth={3} /> : idx}
              </div>
              <span className="text-xs font-body hidden sm:block">{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px transition-colors ${
                currentStep > idx ? 'bg-tz-success' : 'bg-tz-border'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="label-base">
        {label}{required && <span className="text-tz-accent ml-0.5">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-xs text-tz-accent mt-1.5 font-body"
          >
            <AlertCircle size={11} />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Address Type Icon ────────────────────────────────────────────────────────
function AddrIcon({ type, size = 13 }) {
  if (type === 'work')  return <Briefcase size={size} className="text-tz-gold" />
  if (type === 'other') return <MoreHorizontal size={size} className="text-tz-gold" />
  return <Home size={size} className="text-tz-gold" />
}

// ─── Saved Address Picker ─────────────────────────────────────────────────────
// Shown at the top of Step 1 when the user has saved addresses.
// Clicking a card fills the address form below instantly.
function SavedAddressPicker({ addresses, selectedId, onSelect }) {
  if (!addresses || addresses.length === 0) return null

  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold text-tz-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <MapPin size={10} /> Saved Addresses
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {addresses.map(addr => {
          const isSelected = selectedId === addr.id
          const lines = [addr.address_line, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
          return (
            <button
              key={addr.id}
              type="button"
              onClick={() => onSelect(addr)}
              className={`w-full text-left p-3.5 border-2 transition-all ${
                isSelected
                  ? 'border-tz-gold bg-tz-gold/5'
                  : 'border-tz-border hover:border-tz-gold/40'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 bg-tz-gold/10 border border-tz-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                  <AddrIcon type={addr.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-tz-white font-body">{addr.full_name}</p>
                    <span className="text-[9px] capitalize text-tz-muted border border-tz-border px-1 py-0.5 font-body">{addr.type ?? 'home'}</span>
                    {addr.is_default && (
                      <span className="text-[9px] text-tz-gold border border-tz-gold/30 bg-tz-gold/10 px-1 py-0.5 font-body font-bold">DEFAULT</span>
                    )}
                  </div>
                  <p className="text-[10px] text-tz-muted font-body mt-0.5">{addr.phone}</p>
                  <p className="text-[10px] text-tz-muted font-body mt-0.5 line-clamp-1">{lines}</p>
                </div>
                {isSelected && <Check size={14} className="text-tz-gold shrink-0 mt-0.5" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Divider before manual entry */}
      <div className="flex items-center gap-3 mt-4 mb-1">
        <div className="flex-1 h-px bg-tz-border" />
        <span className="text-[10px] text-tz-muted font-body uppercase tracking-widest">or enter a new address</span>
        <div className="flex-1 h-px bg-tz-border" />
      </div>
    </div>
  )
}

// ─── Coupon Section ───────────────────────────────────────────────────────────
// All validation is server-side via validate_coupon() RPC.
// Frontend never computes the discount.
function CouponSection({ subtotal, appliedCoupon, onApply }) {
  const [input,           setInput]           = useState('')
  const [eligible,        setEligible]        = useState([])
  const [showEligible,    setShowEligible]    = useState(false)
  const [validating,      setValidating]      = useState(false)
  const [loadingEligible, setLoadingEligible] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!subtotal) return
    setLoadingEligible(true)
    supabase.rpc('get_eligible_coupons', { p_subtotal: subtotal })
      .then(({ data, error }) => {
        if (error) console.warn('get_eligible_coupons:', error.message)
        setEligible(Array.isArray(data) ? data : [])
      })
      .catch(err => console.warn('get_eligible_coupons error:', err))
      .finally(() => setLoadingEligible(false))
  }, [subtotal])

  async function handleApply(code) {
    const c = (code ?? input).trim().toUpperCase()
    if (!c) return
    setValidating(true)
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code:     c,
        p_subtotal: subtotal,
      })
      if (error) throw new Error(error.message)
      if (!data.valid) {
        alert(data.error ?? 'Invalid coupon code')
        return
      }
      onApply(data)
      setInput('')
      setShowEligible(false)
    } catch (err) {
      alert(err.message ?? 'Failed to validate coupon. Please try again.')
    } finally {
      setValidating(false)
    }
  }

  function handleRemove() {
    onApply(null)
    setInput('')
  }

  // Applied state
  if (appliedCoupon) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-tz-success/5 border border-tz-success/25 px-3 py-2.5 mt-3"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-tz-success shrink-0" />
          <div>
            <span className="text-tz-success text-xs font-bold font-mono">{appliedCoupon.code}</span>
            <span className="text-tz-success/70 text-xs font-body ml-2">
              −{formatPrice(appliedCoupon.discount)} saved
            </span>
          </div>
        </div>
        <button onClick={handleRemove} className="text-tz-muted hover:text-red-400 transition-colors ml-2">
          <X size={13} />
        </button>
      </motion.div>
    )
  }

  // Input + available coupons
  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-0">
        <div className="relative flex-1">
          <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="COUPON CODE"
            className="input-base w-full pl-8 pr-2 text-xs font-mono tracking-wider uppercase"
            disabled={validating}
          />
        </div>
        <button
          onClick={() => handleApply()}
          disabled={validating || !input.trim()}
          className="bg-tz-gold text-tz-black text-xs font-bold font-body px-4 hover:brightness-110 disabled:opacity-50 transition-all whitespace-nowrap flex items-center gap-1.5"
        >
          {validating ? <Loader2 size={11} className="animate-spin" /> : null}
          APPLY
        </button>
      </div>

      {/* Available coupons toggle — only rendered when we have a real count */}
      {!loadingEligible && eligible.length > 0 && (
        <div>
          <button
            onClick={() => setShowEligible(s => !s)}
            className="flex items-center gap-1.5 text-xs text-tz-gold hover:brightness-110 font-body transition-colors"
          >
            <Ticket size={11} />
            {eligible.length} coupon{eligible.length > 1 ? 's' : ''} available for you
            <ChevronDown size={11} className={`transition-transform ${showEligible ? 'rotate-180' : ''}`} />
          </button>

          {/* FIX: Use opacity+height animation (not width) to avoid NaN% Framer error */}
          {showEligible && (
            <motion.div
              key="eligible-list"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2 space-y-1.5"
            >
              {eligible.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleApply(c.code)}
                  className="w-full text-left flex items-center justify-between border border-tz-gold/20 bg-tz-gold/5 hover:bg-tz-gold/10 hover:border-tz-gold/40 px-3 py-2.5 transition-all group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 bg-tz-gold/10 border border-tz-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                      {c.type === 'percentage' || c.type === 'percent'
                        ? <Percent size={11} className="text-tz-gold" />
                        : <BadgeIndianRupee size={11} className="text-tz-gold" />
                      }
                    </div>
                    <div>
                      <p className="text-[11px] font-bold font-mono text-tz-gold tracking-widest">{c.code}</p>
                      <p className="text-[10px] text-tz-muted font-body mt-0.5">
                        {c.description ?? (
                          (c.type === 'percentage' || c.type === 'percent')
                            ? `${c.value}% off`
                            : `₹${c.value} off`
                        )}
                        {c.min_order_value > 0 && ` · Min ₹${c.min_order_value}`}
                        {c.first_order_only && ' · First order only'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-bold text-tz-success">−{formatPrice(c.discount)}</p>
                    <p className="text-[9px] text-tz-muted font-body opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply →
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {loadingEligible && (
        <div className="flex items-center gap-2 text-[10px] text-tz-muted font-body">
          <Loader2 size={10} className="animate-spin" /> Checking available offers…
        </div>
      )}
    </div>
  )
}

// ─── Order Summary Sidebar ────────────────────────────────────────────────────
function OrderSummary({ items, subtotal, discount, couponCode, deliveryCharge, appliedCoupon, onCouponApply }) {
  // FIX: always derive total from server-validated discount
  const safeDiscount = Number(discount) || 0
  const total = subtotal - safeDiscount + deliveryCharge
  return (
    <div className="bg-tz-dark border border-tz-border p-5 space-y-4 sticky top-24">
      <h3 className="font-body text-sm font-semibold text-tz-white">Order Summary</h3>

      {/* Items list */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-12 h-14 bg-tz-surface overflow-hidden shrink-0 border border-tz-border/50">
              {item.image
                ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Package size={12} className="text-tz-muted" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-tz-text font-body line-clamp-1">{item.name}</p>
              {item.size && <p className="text-[10px] text-tz-muted font-body">Size: {item.size}</p>}
              <p className="text-[10px] text-tz-muted font-body">Qty: {item.quantity}</p>
            </div>
            <p className="text-xs font-semibold text-tz-white font-body whitespace-nowrap">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="border-t border-tz-border pt-3 space-y-2">
        <div className="flex justify-between text-xs font-body">
          <span className="text-tz-muted">Subtotal</span>
          <span className="text-tz-text">{formatPrice(subtotal)}</span>
        </div>
        {safeDiscount > 0 && (
          <div className="flex justify-between text-xs font-body">
            <span className="text-tz-success flex items-center gap-1">
              <Tag size={10} />
              Coupon{couponCode ? ` (${couponCode})` : ''}
            </span>
            <span className="text-tz-success">−{formatPrice(safeDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-body">
          <span className="text-tz-muted">Delivery</span>
          <span className={deliveryCharge === 0 ? 'text-tz-success text-xs font-body' : 'text-tz-text text-xs font-body'}>
            {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
          </span>
        </div>
        <div className="flex justify-between text-sm font-semibold font-body border-t border-tz-border pt-2">
          <span className="text-tz-text">Total</span>
          <span className="text-tz-gold">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Coupon section */}
      <div className="border-t border-tz-border pt-3">
        <p className="text-[10px] font-bold text-tz-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Tag size={10} /> Apply Coupon
        </p>
        <CouponSection
          subtotal={subtotal}
          appliedCoupon={appliedCoupon}
          onApply={onCouponApply}
        />
      </div>
    </div>
  )
}

// ─── Main Checkout ────────────────────────────────────────────────────────────
export default function Checkout() {
  const user      = useAuthStore(s => s.user)
  const profile   = useAuthStore(s => s.profile)
  const openAuth  = useAuthStore(s => s.openAuth)
  const items     = useCartStore(s => s.items)
  const clearCart = useCartStore(s => s.clearCart)

  const [step,      setStep]      = useState(1)
  const [saving,    setSaving]    = useState(false)
  const [orderDone, setOrderDone] = useState(null)
  const [formError, setFormError] = useState(null)

  // ── Saved addresses — loaded on mount ─────────────────────────────────────
  const [savedAddresses,    setSavedAddresses]    = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)

  // ── Coupon state ───────────────────────────────────────────────────────────
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const stored = sessionStorage.getItem('appliedCoupon')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  function handleCouponApply(result) {
    setAppliedCoupon(result)
    if (result) sessionStorage.setItem('appliedCoupon', JSON.stringify(result))
    else        sessionStorage.removeItem('appliedCoupon')
  }

  const [address, setAddress] = useState({
    fullName: '', phone: '', address: '',
    city: '', state: '', pincode: '', type: 'home',
  })
  const [addrErrors, setAddrErrors] = useState({})
  const [delivery,   setDelivery]   = useState('standard')
  const [payment,    setPayment]    = useState('razorpay')

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      setAddress(a => ({
        ...a,
        fullName: a.fullName || profile.full_name || '',
        phone:    a.phone    || profile.phone     || '',
      }))
    }
  }, [profile])

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) openAuth('login')
  }, [user])

  // Load saved addresses
  useEffect(() => {
    if (!user) return
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.warn('addresses load:', error.message)
        const addrs = data ?? []
        setSavedAddresses(addrs)
        // Auto-fill default address if no address entered yet
        const def = addrs.find(a => a.is_default) ?? addrs[0]
        if (def) {
          applyAddressFromSaved(def)
          setSelectedAddressId(def.id)
        }
      })
  }, [user])

  function applyAddressFromSaved(addr) {
    setAddress({
      fullName: addr.full_name  ?? '',
      phone:    addr.phone      ?? '',
      address:  addr.address_line ?? addr.address ?? '',
      city:     addr.city       ?? '',
      state:    addr.state      ?? '',
      pincode:  addr.pincode    ?? '',
      type:     addr.type       ?? 'home',
    })
  }

  function handleSavedAddressSelect(addr) {
    setSelectedAddressId(addr.id)
    applyAddressFromSaved(addr)
    setAddrErrors({})
  }

  // ─── Calculations ──────────────────────────────────────────────────────────
  const subtotal       = items.reduce((s, i) => s + i.price * i.quantity, 0)
  // FIX: always read server-validated discount; never compute locally
  const discount       = Number(appliedCoupon?.discount) || 0
  const afterDiscount  = subtotal - discount
  const deliveryCharge =
    delivery === 'express' ? 149 :
    afterDiscount >= 999   ? 0   : 79
  const total = afterDiscount + deliveryCharge

  // ─── Address validation ────────────────────────────────────────────────────
  function validateAddress() {
    const e = {}
    if (!address.fullName.trim())                 e.fullName = 'Full name is required'
    if (!/^\d{10}$/.test(address.phone.trim()))   e.phone    = 'Valid 10-digit phone required'
    if (!address.address.trim())                  e.address  = 'Address is required'
    if (!address.city.trim())                     e.city     = 'City is required'
    if (!address.state.trim())                    e.state    = 'State is required'
    if (!/^\d{6}$/.test(address.pincode.trim()))  e.pincode  = 'Valid 6-digit pincode required'
    setAddrErrors(e)
    return Object.keys(e).length === 0
  }

  // ─── Create pending order row BEFORE opening Razorpay ─────────────────────
  async function createPendingOrder(paymentMethod) {
    const orderNumber     = 'TZ' + Date.now().toString().slice(-8)
    const paymentMethodDb = paymentMethod === 'razorpay' ? 'razorpay' : 'cod'

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id:          user.id,
        order_number:     orderNumber,
        status:           'pending',
        subtotal,
        delivery_charge:  deliveryCharge,
        discount,
        total,
        coupon_code:      appliedCoupon?.code      ?? null,
        coupon_id:        appliedCoupon?.coupon_id ?? null,
        payment_method:   paymentMethodDb,
        address_snapshot: {
          full_name: address.fullName,
          phone:     address.phone,
          address:   address.address,
          city:      address.city,
          state:     address.state,
          pincode:   address.pincode,
          type:      address.type,
        },
      })
      .select('id, order_number')
      .single()

    if (orderError) {
      console.error('[Checkout] orders insert failed:', orderError)
      throw new Error(`Order creation failed: ${orderError.message} (code: ${orderError.code})`)
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        items.map(item => ({
          order_id:   orderData.id,
          product_id: item.productId ?? null,
          name:       item.name      ?? 'Product',
          variant_id: item.variantId ?? null,
          quantity:   item.quantity,
          price:      item.price,
          subtotal:   item.price * item.quantity,
          size:       item.size   ?? null,
          slug:       item.slug   ?? null,
          image:      item.image  ?? null,
          color:      item.color  ?? null,
        }))
      )

    if (itemsError) {
      console.error('[Checkout] order_items insert failed:', itemsError)
      await supabase.from('orders').delete().eq('id', orderData.id)
      throw new Error(`Failed to save order items: ${itemsError.message} (code: ${itemsError.code})`)
    }

    return orderData
  }

  // ─── Mark order paid + record coupon use ──────────────────────────────────
  async function markOrderPaid(orderId, razorpayPaymentId) {
    const { error } = await supabase
      .from('orders')
      .update({
        status:              'pending',
        razorpay_payment_id: razorpayPaymentId,
      })
      .eq('id', orderId)

    if (error) console.error('[Checkout] markOrderPaid failed:', error)

    if (appliedCoupon?.coupon_id) {
      const { error: couponErr } = await supabase.rpc('record_coupon_use', {
        p_coupon_id: appliedCoupon.coupon_id,
        p_user_id:   user.id,
        p_order_id:  orderId,
      })
      if (couponErr) console.warn('[Checkout] record_coupon_use failed:', couponErr.message)
    }
  }

  async function markOrderCancelled(orderId) {
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .then(({ error }) => {
        if (error) console.warn('[Checkout] markOrderCancelled failed (non-critical):', error)
      })
  }

  // ─── Fire-and-forget cart tracking ────────────────────────────────────────
  // FIX: fully silent — CORS errors on the edge function never surface
  function markCartConverted() {
    supabase.auth.getSession().then(({ data }) => {
      const token = data?.session?.access_token
      if (!token) return
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-cart`
      fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ converted: true }),
      }).catch(() => {/* intentionally silent */})
    }).catch(() => {/* intentionally silent */})
  }

  // ─── COD flow ──────────────────────────────────────────────────────────────
  async function placeCodOrder() {
    if (!user || items.length === 0) return
    setSaving(true)
    setFormError(null)
    try {
      const orderData = await createPendingOrder('cod')

      if (appliedCoupon?.coupon_id) {
        const { error: couponErr } = await supabase.rpc('record_coupon_use', {
          p_coupon_id: appliedCoupon.coupon_id,
          p_user_id:   user.id,
          p_order_id:  orderData.id,
        })
        if (couponErr) console.warn('[Checkout] record_coupon_use (COD) failed:', couponErr.message)
      }

      clearCart()
      sessionStorage.removeItem('appliedCoupon')
      markCartConverted()
      setOrderDone(orderData)
    } catch (err) {
      console.error('[Checkout] COD order failed:', err)
      setFormError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Razorpay flow ─────────────────────────────────────────────────────────
  async function handleRazorpay() {
    if (!user || items.length === 0) return
    setSaving(true)
    setFormError(null)

    const loaded = await loadRazorpay()
    if (!loaded) {
      setFormError('Failed to load payment gateway. Check your internet connection.')
      setSaving(false)
      return
    }

    const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!RAZORPAY_KEY) {
      setFormError('Payment gateway not configured. Please contact support.')
      setSaving(false)
      return
    }

    let pendingOrder
    try {
      pendingOrder = await createPendingOrder('razorpay')
    } catch (err) {
      console.error('[Checkout] Pre-payment order creation failed:', err)
      setFormError(err.message)
      setSaving(false)
      return
    }

    const rzp = new window.Razorpay({
      key:         RAZORPAY_KEY,
      amount:      total * 100,
      currency:    'INR',
      name:        'TrendZip',
      description: `Order #${pendingOrder.order_number}`,
      receipt:     pendingOrder.order_number,
      prefill: {
        name:    address.fullName,
        contact: address.phone,
        email:   user?.email ?? '',
      },
      theme: { color: '#c9a96e' },

      handler: async function (response) {
        try {
          await markOrderPaid(pendingOrder.id, response.razorpay_payment_id)
          clearCart()
          sessionStorage.removeItem('appliedCoupon')
          markCartConverted()
          setOrderDone(pendingOrder)
        } catch (err) {
          console.error('[Checkout] markOrderPaid failed (order exists):', err)
          clearCart()
          setOrderDone(pendingOrder)
        } finally {
          setSaving(false)
        }
      },

      modal: {
        ondismiss: () => {
          markOrderCancelled(pendingOrder.id)
          setSaving(false)
        },
      },
    })

    rzp.on('payment.failed', function (resp) {
      markOrderCancelled(pendingOrder.id)
      setFormError('Payment failed: ' + (resp.error?.description ?? 'Unknown error. Please try again.'))
      setSaving(false)
    })

    rzp.open()
  }

  async function handlePlaceOrder() {
    if (payment === 'razorpay') await handleRazorpay()
    else                        await placeCodOrder()
  }

  const deliveryLabel =
    delivery === 'express'
      ? 'Express — ₹149'
      : afterDiscount >= 999
      ? 'Standard — Free'
      : 'Standard — ₹79'

  // ─── Empty cart ────────────────────────────────────────────────────────────
  if (items.length === 0 && !orderDone) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <ShoppingBag size={40} className="text-tz-muted mb-4" />
        <h2 className="font-display text-2xl text-tz-white font-light mb-2">Your cart is empty</h2>
        <p className="text-sm text-tz-muted font-body mb-6">Add some products before checking out.</p>
        <Link to="/catalog" className="btn-primary">Browse Products</Link>
      </div>
    )
  }

  // ─── Success screen ────────────────────────────────────────────────────────
  if (orderDone) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 bg-tz-success/10 border border-tz-success/30 flex items-center justify-center mx-auto mb-6"
          >
            <Check size={36} className="text-tz-success" strokeWidth={2.5} />
          </motion.div>
          <p className="eyebrow mb-2">Order Confirmed</p>
          <h1 className="font-display text-3xl text-tz-white font-light mb-3">Thank you!</h1>
          <p className="text-sm text-tz-muted font-body mb-2">
            Your order <strong className="text-tz-gold">#{orderDone.order_number}</strong> has been placed successfully.
          </p>
          <p className="text-xs text-tz-muted font-body mb-8">
            You'll receive a confirmation soon. Track your order from the Orders page.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/orders" className="btn-primary flex items-center gap-2">
              <Package size={15} />Track My Order
            </Link>
            <Link to="/catalog" className="btn-secondary">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── Main checkout flow ────────────────────────────────────────────────────
  return (
    <>
      <SEO title="Checkout" noIndex={true} />
      <div className="page-container py-10">
        <h1 className="font-display text-2xl text-tz-white font-light mb-2 text-center">Checkout</h1>
        <StepIndicator currentStep={step} />

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 max-w-5xl mx-auto">
          <div>
            <AnimatePresence mode="wait">

              {/* ── STEP 1 — Address ──────────────────────────────────────── */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-tz-dark border border-tz-border p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-tz-gold/10 border border-tz-gold/30 flex items-center justify-center">
                      <MapPin size={14} className="text-tz-gold" />
                    </div>
                    <h2 className="font-body text-sm font-semibold text-tz-white">Delivery Address</h2>
                  </div>

                  {/* SAVED ADDRESSES PICKER */}
                  <SavedAddressPicker
                    addresses={savedAddresses}
                    selectedId={selectedAddressId}
                    onSelect={handleSavedAddressSelect}
                  />

                  {/* Manual form */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full Name" required error={addrErrors.fullName}>
                      <input className="input-base w-full" value={address.fullName} autoComplete="name"
                        onChange={e => { setSelectedAddressId(null); setAddress(a => ({ ...a, fullName: e.target.value })) }}
                        placeholder="Arjun Sharma" />
                    </Field>
                    <Field label="Phone" required error={addrErrors.phone}>
                      <input className="input-base w-full" type="tel" maxLength={10} autoComplete="tel"
                        value={address.phone}
                        onChange={e => { setSelectedAddressId(null); setAddress(a => ({ ...a, phone: e.target.value.replace(/\D/g, '') })) }}
                        placeholder="9876543210" />
                    </Field>
                  </div>

                  <Field label="Address" required error={addrErrors.address}>
                    <textarea className="input-base w-full resize-none" rows={2} autoComplete="street-address"
                      value={address.address}
                      onChange={e => { setSelectedAddressId(null); setAddress(a => ({ ...a, address: e.target.value })) }}
                      placeholder="Flat / House No., Street, Area" />
                  </Field>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label="City" required error={addrErrors.city}>
                      <input className="input-base w-full" value={address.city} autoComplete="address-level2"
                        onChange={e => { setSelectedAddressId(null); setAddress(a => ({ ...a, city: e.target.value })) }}
                        placeholder="Mumbai" />
                    </Field>
                    <Field label="State" required error={addrErrors.state}>
                      <input className="input-base w-full" value={address.state} autoComplete="address-level1"
                        onChange={e => { setSelectedAddressId(null); setAddress(a => ({ ...a, state: e.target.value })) }}
                        placeholder="Maharashtra" />
                    </Field>
                    <Field label="Pincode" required error={addrErrors.pincode}>
                      <input className="input-base w-full" type="tel" maxLength={6} autoComplete="postal-code"
                        value={address.pincode}
                        onChange={e => { setSelectedAddressId(null); setAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '') })) }}
                        placeholder="400001" />
                    </Field>
                  </div>

                  <div className="flex gap-2">
                    {['home', 'work', 'other'].map(t => (
                      <button key={t} type="button" onClick={() => setAddress(a => ({ ...a, type: t }))}
                        className={`flex-1 py-2 text-xs font-body border-2 capitalize transition-all ${
                          address.type === t
                            ? 'border-tz-gold bg-tz-gold/10 text-tz-gold'
                            : 'border-tz-border text-tz-muted hover:border-tz-border-2'
                        }`}>{t}</button>
                    ))}
                  </div>

                  <button onClick={() => { if (validateAddress()) setStep(2) }}
                    className="btn-primary-lg w-full justify-center mt-2">
                    Continue to Delivery <ChevronRight size={15} />
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2 — Delivery ─────────────────────────────────────── */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-tz-dark border border-tz-border p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-tz-gold/10 border border-tz-gold/30 flex items-center justify-center">
                      <Truck size={14} className="text-tz-gold" />
                    </div>
                    <h2 className="font-body text-sm font-semibold text-tz-white">Delivery Method</h2>
                  </div>

                  {[
                    { value: 'standard', label: 'Standard Delivery', desc: '4–6 business days',
                      price: afterDiscount >= 999 ? 'Free' : '₹79',
                      badge: afterDiscount >= 999 ? 'Free above ₹999' : null },
                    { value: 'express',  label: 'Express Delivery',  desc: '1–2 business days',
                      price: '₹149', badge: 'Fastest' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setDelivery(opt.value)}
                      className={`w-full flex items-center justify-between p-4 border-2 text-left transition-all ${
                        delivery === opt.value ? 'border-tz-gold bg-tz-gold/5' : 'border-tz-border hover:border-tz-border-2'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          delivery === opt.value ? 'border-tz-gold' : 'border-tz-border'
                        }`}>
                          {delivery === opt.value && <div className="w-2 h-2 rounded-full bg-tz-gold" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-tz-white font-body flex items-center gap-2">
                            {opt.label}
                            {opt.badge && (
                              <span className="text-[9px] bg-tz-gold/10 border border-tz-gold/30 text-tz-gold px-1.5 py-0.5 font-bold tracking-wide">
                                {opt.badge}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-tz-muted font-body">{opt.desc}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold font-body ${opt.price === 'Free' ? 'text-tz-success' : 'text-tz-white'}`}>
                        {opt.price}
                      </span>
                    </button>
                  ))}

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">Back</button>
                    <button onClick={() => setStep(3)} className="btn-primary flex-1 justify-center">
                      Continue <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3 — Payment ──────────────────────────────────────── */}
              {step === 3 && (
                <motion.div key="step3"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-tz-dark border border-tz-border p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-tz-gold/10 border border-tz-gold/30 flex items-center justify-center">
                      <CreditCard size={14} className="text-tz-gold" />
                    </div>
                    <h2 className="font-body text-sm font-semibold text-tz-white">Payment Method</h2>
                  </div>

                  <div className="space-y-2">
                    {[
                      { value: 'razorpay', label: 'Card / Net Banking / UPI', badge: 'Recommended',
                        desc: 'Credit card, debit card, net banking & more — powered by Razorpay' },
                      { value: 'cod',      label: 'Cash on Delivery',         badge: 'No prepay',
                        desc: 'Pay in cash when your order arrives' },
                    ].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setPayment(opt.value)}
                        className={`w-full flex items-center justify-between p-4 border-2 text-left transition-all ${
                          payment === opt.value ? 'border-tz-gold bg-tz-gold/5' : 'border-tz-border hover:border-tz-border-2'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            payment === opt.value ? 'border-tz-gold' : 'border-tz-border'
                          }`}>
                            {payment === opt.value && <div className="w-2 h-2 rounded-full bg-tz-gold" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-tz-white font-body flex items-center gap-2">
                              {opt.label}
                              <span className="text-[9px] bg-tz-gold/10 border border-tz-gold/30 text-tz-gold px-1.5 py-0.5 font-bold tracking-wide">
                                {opt.badge}
                              </span>
                            </p>
                            <p className="text-xs text-tz-muted font-body">{opt.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-tz-muted font-body pt-1">
                    <Shield size={12} className="text-tz-success shrink-0" />
                    All transactions are encrypted and secure
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep(2)} className="btn-secondary flex-1 justify-center">Back</button>
                    <button onClick={() => setStep(4)} className="btn-primary flex-1 justify-center">
                      Review Order <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4 — Review & Place ────────────────────────────────── */}
              {step === 4 && (
                <motion.div key="step4"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Delivery address */}
                  <div className="bg-tz-dark border border-tz-border p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-tz-white font-body uppercase tracking-wider">Delivery To</p>
                      <button onClick={() => setStep(1)} className="text-xs text-tz-gold hover:text-tz-gold-light font-body">Edit</button>
                    </div>
                    <p className="text-sm font-medium text-tz-white font-body">{address.fullName}</p>
                    <p className="text-xs text-tz-muted font-body mt-0.5">{address.phone}</p>
                    <p className="text-xs text-tz-muted font-body mt-0.5">
                      {[address.address, address.city, address.state, address.pincode].filter(Boolean).join(', ')}
                    </p>
                  </div>

                  {/* Delivery + payment summary */}
                  <div className="bg-tz-dark border border-tz-border p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-tz-white font-body uppercase tracking-wider">Delivery & Payment</p>
                      <button onClick={() => setStep(2)} className="text-xs text-tz-gold hover:text-tz-gold-light font-body">Edit</button>
                    </div>
                    <div className="flex justify-between text-xs font-body">
                      <span className="text-tz-muted">Delivery</span>
                      <span className="text-tz-text">{deliveryLabel}</span>
                    </div>
                    <div className="flex justify-between text-xs font-body mt-1">
                      <span className="text-tz-muted">Payment</span>
                      <span className="text-tz-text">
                        {payment === 'razorpay' ? 'Card / Net Banking / UPI' : 'Cash on Delivery'}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-tz-dark border border-tz-border p-5">
                    <p className="text-xs font-semibold text-tz-white font-body uppercase tracking-wider mb-3">
                      Items ({items.length})
                    </p>
                    <div className="space-y-3">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-tz-surface overflow-hidden border border-tz-border/50 shrink-0">
                            {item.image
                              ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><Package size={10} className="text-tz-muted" /></div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-tz-text font-body line-clamp-1">{item.name}</p>
                            {item.size && <p className="text-[10px] text-tz-muted font-body">Size: {item.size}</p>}
                            <p className="text-[10px] text-tz-muted font-body">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-xs font-semibold text-tz-white font-body whitespace-nowrap">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coupon section — mobile only (sidebar shows it on desktop) */}
                  <div className="bg-tz-dark border border-tz-border p-5 lg:hidden">
                    <p className="text-xs font-semibold text-tz-white font-body uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Tag size={11} className="text-tz-gold" /> Apply Coupon
                    </p>
                    <CouponSection
                      subtotal={subtotal}
                      appliedCoupon={appliedCoupon}
                      onApply={handleCouponApply}
                    />
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {formError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-2 p-4 bg-tz-accent/10 border border-tz-accent/30 text-xs text-tz-accent font-body"
                      >
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CTA */}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(3)} disabled={saving}
                      className="btn-secondary flex-1 justify-center disabled:opacity-50">
                      Back
                    </button>
                    <button onClick={handlePlaceOrder} disabled={saving}
                      className="btn-primary-lg flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <Loader2 size={15} className="animate-spin" />
                          {payment === 'razorpay' ? 'Opening Payment…' : 'Placing Order…'}
                        </span>
                      ) : (
                        payment === 'razorpay' ? 'Pay with Razorpay' : 'Place Order'
                      )}
                    </button>
                  </div>

                  <p className="text-center text-[10px] text-tz-muted font-body">
                    By placing your order, you agree to our{' '}
                    <Link to="/terms" className="underline hover:text-tz-text">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="underline hover:text-tz-text">Privacy Policy</Link>
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Order summary sidebar (desktop only) */}
          <div className="hidden lg:block">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              discount={discount}
              couponCode={appliedCoupon?.code}
              deliveryCharge={deliveryCharge}
              appliedCoupon={appliedCoupon}
              onCouponApply={handleCouponApply}
            />
          </div>
        </div>
      </div>
    </>
  )
}