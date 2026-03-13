import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Check, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

/**
 * CouponInput — drop into your Cart page.
 *
 * Props:
 *   cartTotal   {number}   - current cart subtotal (before discount)
 *   onApply     {Function} - called with { coupon, discount } when valid
 *   onRemove    {Function} - called when coupon is cleared
 *   appliedCode {string}   - currently applied code (controlled from parent)
 */
export default function CouponInput({ cartTotal, onApply, onRemove, appliedCode }) {
  const [code,    setCode]    = useState('')
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

    if (error || !coupon) {
      toast.error('Invalid or expired coupon code')
      return
    }

    // Expiry check
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      toast.error('This coupon has expired')
      return
    }

    // Max uses check
    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
      toast.error('This coupon has reached its usage limit')
      return
    }

    // Minimum order check
    if (cartTotal < coupon.min_order_value) {
      toast.error(`Minimum order of ₹${coupon.min_order_value} required for this coupon`)
      return
    }

    // Calculate discount
    let discount = 0
    if (coupon.type === 'percentage') {
      discount = (cartTotal * coupon.value) / 100
    } else {
      discount = coupon.value
    }
    discount = Math.min(discount, cartTotal) // can't discount more than total

    onApply({ coupon, discount: Math.round(discount) })
    setCode('')
    toast.success(`Coupon applied! You save ₹${Math.round(discount)}`)
  }

  const handleRemove = () => {
    onRemove()
    setCode('')
    toast('Coupon removed')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleApply()
  }

  // ── Applied state ─────────────────────────────────────────────────────────
  if (appliedCode) {
    return (
      <motion.div
        className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-emerald-400 text-sm font-medium">
              Coupon applied:{' '}
              <code className="font-mono font-bold">{appliedCode}</code>
            </p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="text-tz-muted hover:text-tz-white transition-colors ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    )
  }

  // ── Input state ───────────────────────────────────────────────────────────
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tz-muted" />
        <input
          type="text"
          className="input-base pl-9 uppercase tracking-widest font-mono text-sm"
          placeholder="Enter coupon code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
      </div>
      <button
        onClick={handleApply}
        disabled={loading || !code.trim()}
        className="btn-secondary px-4 py-2 text-sm rounded-xl disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Apply'
        )}
      </button>
    </div>
  )
}