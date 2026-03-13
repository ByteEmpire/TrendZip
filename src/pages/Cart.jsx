import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Trash2, Plus, Minus,
  ArrowRight, Truck, RefreshCw, Lock,
  Tag, Check, X, Loader2
} from 'lucide-react'

import useCartStore, {
  useCartItems, useCartTotalPrice, useCartIsEmpty, useCartActions
} from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import SEO from '@/components/SEO'

const DELIVERY_THRESHOLD = 999
const DELIVERY_CHARGE = 79

// ─── Inline CouponInput ───────────────────────────────────────────────────────

function CouponInput({ cartTotal, appliedCoupon, onApply, onRemove }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { toast.error('Enter a coupon code'); return }

    setLoading(true)
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', trimmed)
      .eq('is_active', true)
      .single()
    setLoading(false)

    if (error || !coupon) { toast.error('Invalid or expired coupon code'); return }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      toast.error('This coupon has expired'); return
    }
    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
      toast.error('This coupon has reached its usage limit'); return
    }
    // ✅ Fixed: min_order_value → min_order
    if (cartTotal < (coupon.min_order ?? 0)) {
      toast.error(`Minimum order of ${formatPrice(coupon.min_order)} required`); return
    }

    // ✅ Fixed: coupon.type → coupon.discount_type, coupon.value → coupon.discount_value
    const discount = coupon.discount_type === 'percent'
      ? Math.round((cartTotal * coupon.discount_value) / 100)
      : Math.min(coupon.discount_value, cartTotal)

    onApply({ coupon, discount })
    setCode('')
    toast.success(`Coupon applied! You save ${formatPrice(discount)}`)
  }

  // ── Applied state ─────────────────────────────────────────────────────────
  if (appliedCoupon) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 bg-tz-success/10 border border-tz-success/30 mb-5"
      >
        <div className="flex items-center gap-2">
          <Check size={13} className="text-tz-success shrink-0" />
          <p className="text-xs font-body text-tz-success">
            <code className="font-mono font-bold">{appliedCoupon.coupon.code}</code> applied
            {' '}— you save <span className="font-bold">{formatPrice(appliedCoupon.discount)}</span>
          </p>
        </div>
        <button
          onClick={onRemove}
          className="text-tz-muted hover:text-tz-white transition-colors ml-3"
          aria-label="Remove coupon"
        >
          <X size={14} />
        </button>
      </motion.div>
    )
  }

  // ── Input state ───────────────────────────────────────────────────────────
  return (
    <div className="flex gap-0 mb-5">
      <div className="relative flex-1">
        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Coupon code"
          className="input-base pl-9 h-10 text-xs border-r-0 uppercase tracking-widest font-mono"
          aria-label="Enter coupon code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          disabled={loading}
        />
      </div>
      <button
        onClick={handleApply}
        disabled={loading || !code.trim()}
        className="btn-secondary h-10 px-4 text-xs shrink-0 disabled:opacity-50"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
      </button>
    </div>
  )
}

// ─── Order Summary ────────────────────────────────────────────────────────────

function OrderSummary({ items, subtotal, appliedCoupon, onApply, onRemove, onCheckout }) {
  const discount = appliedCoupon?.discount ?? 0
  const deliveryFree = (subtotal - discount) >= DELIVERY_THRESHOLD
  const deliveryCost = deliveryFree ? 0 : DELIVERY_CHARGE
  const total = subtotal - discount + deliveryCost
  const remaining = DELIVERY_THRESHOLD - (subtotal - discount)

  return (
    <div className="bg-tz-dark border border-tz-border p-6 sticky top-24">
      <h2 className="font-display text-xl text-tz-white font-light mb-6">Order Summary</h2>

      {/* Free shipping progress */}
      {!deliveryFree && (
        <div className="mb-6 p-4 bg-tz-surface border border-tz-border">
          <p className="text-xs text-tz-text mb-2 font-body">
            Add <span className="text-tz-gold font-semibold">{formatPrice(Math.max(0, remaining))}</span> more for free delivery
          </p>
          <div className="h-1 bg-tz-surface-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((subtotal - discount) / DELIVERY_THRESHOLD) * 100, 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-tz-gold"
            />
          </div>
        </div>
      )}

      {deliveryFree && (
        <div className="flex items-center gap-2 mb-6 p-3 bg-tz-success/10 border border-tz-success/30">
          <Truck size={14} className="text-tz-success shrink-0" />
          <p className="text-xs text-tz-success font-body">Yay! You get free delivery on this order.</p>
        </div>
      )}

      {/* Line items */}
      <div className="space-y-3 mb-5">
        <div className="flex justify-between text-sm">
          <span className="text-tz-muted font-body">
            Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)
          </span>
          <span className="text-tz-text font-body">{formatPrice(subtotal)}</span>
        </div>

        {discount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex justify-between text-sm"
          >
            <span className="text-tz-success font-body flex items-center gap-1.5">
              <Tag size={12} />
              Discount ({appliedCoupon.coupon.code})
            </span>
            <span className="text-tz-success font-body font-semibold">
              −{formatPrice(discount)}
            </span>
          </motion.div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-tz-muted font-body">Delivery</span>
          <span className={`font-body ${deliveryFree ? 'text-tz-success' : 'text-tz-text'}`}>
            {deliveryFree ? 'FREE' : formatPrice(deliveryCost)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-tz-muted font-body">Tax (GST included)</span>
          <span className="text-tz-text font-body">Included</span>
        </div>
      </div>

      <div className="divider-gold mb-5" />

      <div className="flex justify-between items-baseline mb-6">
        <span className="font-body text-sm font-semibold text-tz-white">Total</span>
        <div className="text-right">
          <span className="font-display text-2xl text-tz-white font-light">{formatPrice(total)}</span>
          {discount > 0 && (
            <p className="text-[10px] text-tz-muted line-through">{formatPrice(subtotal + deliveryCost)}</p>
          )}
        </div>
      </div>

      {/* Coupon input */}
      <CouponInput
        cartTotal={subtotal}
        appliedCoupon={appliedCoupon}
        onApply={onApply}
        onRemove={onRemove}
      />

      <button
        onClick={onCheckout}
        className="btn-primary-lg w-full justify-between group"
      >
        <span>Proceed to Checkout</span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Trust */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <Lock size={11} className="text-tz-muted" />
        <p className="text-[10px] text-tz-muted font-body">Secure 256-bit SSL encrypted checkout</p>
      </div>

      {/* Accepted payments */}
      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
        {['UPI', 'Visa', 'MC', 'RuPay', 'COD'].map(pm => (
          <span
            key={pm}
            className="border border-tz-border text-tz-muted text-[9px] font-body font-semibold tracking-wider px-2 py-1"
          >
            {pm}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Cart Item Row ────────────────────────────────────────────────────────────

function CartItemRow({ item }) {
  const { removeItem, updateQuantity } = useCartActions()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, overflow: 'hidden', marginBottom: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-4 sm:gap-5 py-5 border-b border-tz-border last:border-0"
    >
      {/* Image */}
      <Link to={`/products/${item.slug}`} className="shrink-0">
        <div className="w-24 sm:w-28 aspect-[3/4] bg-tz-surface overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              to={`/products/${item.slug}`}
              className="font-body text-sm sm:text-base font-medium text-tz-text hover:text-tz-white transition-colors line-clamp-2 leading-snug block mb-1"
            >
              {item.name}
            </Link>
            {(item.size || item.color) && (
              <p className="text-xs text-tz-muted mb-1 font-body">
                {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(' · ')}
              </p>
            )}
            <p className="font-body text-base font-semibold text-tz-gold">
              {formatPrice(item.price)}
            </p>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className="text-tz-muted hover:text-tz-accent transition-colors p-1 shrink-0"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 size={15} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          {/* Qty controls */}
          <div className="flex items-center">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-8 h-8 border border-tz-border text-tz-muted hover:text-tz-text flex items-center justify-center transition-all"
              aria-label="Decrease"
            >
              <Minus size={12} />
            </button>
            <span className="w-10 h-8 border-t border-b border-tz-border flex items-center justify-center text-sm text-tz-white font-body">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 border border-tz-border text-tz-muted hover:text-tz-text flex items-center justify-center transition-all"
              aria-label="Increase"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Line total */}
          <p className="text-sm font-body font-semibold text-tz-white">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Cart page ───────────────────────────────────────────────────────────

export default function Cart() {
  const navigate = useNavigate()
  const items = useCartItems()
  const subtotal = useCartTotalPrice()
  const isEmpty = useCartIsEmpty()
  const clearCart = useCartStore(s => s.clearCart)
  const isLoggedIn = useAuthStore(s => !!s.user)
  const openAuth = useAuthStore(s => s.openAuth)

  // appliedCoupon = { coupon: {...}, discount: number } | null
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  function handleCheckout() {
    if (!isLoggedIn) { openAuth(); return }
    if (appliedCoupon) {
      sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon))
    } else {
      sessionStorage.removeItem('appliedCoupon')
    }
    navigate('/checkout')
  }

  return (
    <>
      <SEO title="Your Cart" noIndex={true} />
      <div className="min-h-screen bg-tz-black">
        <div className="border-b border-tz-border bg-tz-dark">
          <div className="page-container py-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <p className="eyebrow mb-2">Shopping</p>
              <h1 className="heading-md">Your Cart</h1>
            </motion.div>
          </div>
        </div>

        <div className="page-container py-8 lg:py-12">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center gap-6"
            >
              <div className="w-24 h-24 border border-tz-border flex items-center justify-center">
                <ShoppingBag size={36} className="text-tz-muted" />
              </div>
              <div>
                <h2 className="font-display text-2xl text-tz-white font-light mb-2">Your cart is empty</h2>
                <p className="text-sm text-tz-muted max-w-xs mx-auto">
                  Looks like you haven't added anything yet. Explore our collection to find something you'll love.
                </p>
              </div>
              <Link to="/catalog" className="btn-primary-lg">
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
              {/* Cart items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-tz-muted font-body">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </p>
                  <button
                    onClick={() => { clearCart(); setAppliedCoupon(null) }}
                    className="text-xs text-tz-muted hover:text-tz-accent transition-colors font-body tracking-wider uppercase"
                  >
                    Clear All
                  </button>
                </div>

                <div className="bg-tz-dark border border-tz-border px-4 sm:px-6">
                  <AnimatePresence initial={false}>
                    {items.map(item => (
                      <CartItemRow key={item.id} item={item} />
                    ))}
                  </AnimatePresence>
                </div>

                <Link
                  to="/catalog"
                  className="flex items-center gap-2 mt-6 text-sm text-tz-muted hover:text-tz-gold transition-colors font-body group"
                >
                  <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Continue Shopping
                </Link>

                <div className="grid sm:grid-cols-3 gap-3 mt-8">
                  {[
                    { icon: Truck,     title: 'Free Delivery',   desc: 'On orders above ₹999' },
                    { icon: RefreshCw, title: 'Easy Returns',    desc: '15-day return policy'  },
                    { icon: Lock,      title: 'Secure Checkout', desc: 'SSL encrypted payments'},
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-center gap-3 p-4 bg-tz-dark border border-tz-border">
                      <Icon size={16} className="text-tz-gold shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-tz-white font-body">{title}</p>
                        <p className="text-[10px] text-tz-muted">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order summary with coupon */}
              <OrderSummary
                items={items}
                subtotal={subtotal}
                appliedCoupon={appliedCoupon}
                onApply={setAppliedCoupon}
                onRemove={() => setAppliedCoupon(null)}
                onCheckout={handleCheckout}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}