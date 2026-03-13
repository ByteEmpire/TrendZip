import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Check, AlertCircle, Trash2, Loader2 } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import {
  fetchProductReviews,
  checkVerifiedPurchase,
  fetchUserReview,
  submitReview,
  deleteReview,
} from '@/services/reviewService'

// ─── Star picker ────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={22}
            className={`transition-colors ${
              n <= (hovered || value)
                ? 'text-tz-gold fill-tz-gold'
                : 'text-tz-border fill-tz-border'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-xs text-tz-muted font-body">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value]}
        </span>
      )}
    </div>
  )
}

// ─── Static star display ─────────────────────────────────────────
function StarDisplay({ rating, size = 13 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= rating ? 'text-tz-gold fill-tz-gold' : 'text-tz-border fill-tz-border'}
        />
      ))}
    </div>
  )
}

// ─── Write review form ───────────────────────────────────────────
function ReviewForm({ productId, orderId, onSubmitted }) {
  const user = useAuthStore((s) => s.user)
  const [rating,  setRating]  = useState(0)
  const [title,   setTitle]   = useState('')
  const [body,    setBody]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a rating.'); return }
    if (body.trim().length < 10) { setError('Review must be at least 10 characters.'); return }
    setLoading(true)
    setError('')
    try {
      await submitReview({
        productId,
        userId:  user.id,
        orderId,
        rating,
        title:   title.trim() || null,
        body:    body.trim(),
      })
      onSubmitted()
    } catch (err) {
      setError(err.message ?? 'Failed to submit review.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-tz-dark border border-tz-gold/30 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Check size={14} className="text-tz-gold" />
        <p className="text-xs text-tz-gold font-body font-semibold tracking-wide uppercase">
          Verified Purchase — Share your experience
        </p>
      </div>

      <div>
        <p className="label-base mb-2">Your Rating *</p>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="label-base">Review Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarise your experience (optional)"
          maxLength={100}
          className="input-base w-full mt-1"
        />
      </div>

      <div>
        <label className="label-base">Your Review *</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you think about the fit, quality, fabric…?"
          rows={4}
          className="input-base w-full mt-1 resize-none"
          maxLength={1000}
        />
        <p className="text-[10px] text-tz-muted font-body mt-1 text-right">{body.length}/1000</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-tz-accent font-body">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary disabled:opacity-50 flex items-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  )
}

// ─── Single review card ──────────────────────────────────────────
function ReviewCard({ review, currentUserId, onDeleted, index }) {
  const [deleting, setDeleting] = useState(false)
  const name     = review.users?.full_name ?? 'Customer'
  const initials = name.charAt(0).toUpperCase()
  const date     = new Date(review.created_at).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
  const isOwn = review.user_id === currentUserId

  async function handleDelete() {
    if (!confirm('Delete your review?')) return
    setDeleting(true)
    try { await deleteReview(review.id); onDeleted(review.id) }
    catch (_) { setDeleting(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="bg-tz-dark border border-tz-border p-5"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {review.users?.avatar_url ? (
            <img
              src={review.users.avatar_url}
              alt={name}
              className="w-9 h-9 object-cover border border-tz-border"
            />
          ) : (
            <div className="w-9 h-9 bg-tz-gold/10 border border-tz-gold/30 flex items-center justify-center text-xs font-bold text-tz-gold font-body shrink-0">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-tz-white font-body">{name}</p>
            <p className="text-[10px] text-tz-muted font-body">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StarDisplay rating={review.rating} />
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete review"
              className="text-tz-muted hover:text-tz-accent transition-colors disabled:opacity-40"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>

      {review.title && (
        <p className="text-sm font-semibold text-tz-white font-body mb-1">{review.title}</p>
      )}
      <p className="text-sm text-tz-muted font-body leading-relaxed">{review.body}</p>
      <p className="text-[10px] text-tz-gold/60 mt-3 tracking-wider uppercase">✓ Verified Purchase</p>
    </motion.div>
  )
}

// ─── Main ReviewSection ───────────────────────────────────────────
export default function ReviewSection({ productId }) {
  const user    = useAuthStore((s) => s.user)
  const openAuth = useAuthStore((s) => s.openAuth)

  const [reviews,     setReviews]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [orderId,     setOrderId]     = useState(null)      // null = not a verified buyer
  const [userReview,  setUserReview]  = useState(null)      // existing review by this user
  const [showForm,    setShowForm]    = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchProductReviews(productId)
      setReviews(data)
      if (user) {
        const [oid, existing] = await Promise.all([
          checkVerifiedPurchase(user.id, productId),
          fetchUserReview(user.id, productId),
        ])
        setOrderId(oid)
        setUserReview(existing)
      }
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [productId, user?.id])

  const avg   = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0
  const count = reviews.length

  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
    pct:   count ? (reviews.filter((r) => r.rating === n).length / count) * 100 : 0,
  }))

  function handleReviewDeleted(id) {
    setReviews((prev) => prev.filter((r) => r.id !== id))
    setUserReview(null)
  }

  return (
    <section className="mt-16 pt-12 border-t border-tz-border" aria-labelledby="reviews-heading">
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h2 id="reviews-heading" className="heading-sm">Customer Reviews</h2>
          {count > 0 && (
            <p className="text-xs text-tz-muted font-body mt-1">{count} verified review{count !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* CTA to write review */}
        {user && orderId && !userReview && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="btn-secondary text-xs"
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
        {!user && (
          <button onClick={() => openAuth('login')} className="btn-secondary text-xs">
            Sign in to review
          </button>
        )}
        {user && !orderId && (
          <p className="text-xs text-tz-muted font-body italic">
            Purchase &amp; receive this product to leave a review
          </p>
        )}
      </div>

      {/* Write review form */}
      <AnimatePresence>
        {showForm && !userReview && orderId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <ReviewForm
              productId={productId}
              orderId={orderId}
              onSubmitted={() => { setShowForm(false); load() }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      {count > 0 && (
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col items-center justify-center bg-tz-dark border border-tz-border p-6 text-center">
            <p className="font-display text-6xl text-tz-white font-light mb-2">{avg}</p>
            <StarDisplay rating={Math.round(Number(avg))} size={14} />
            <p className="text-xs text-tz-muted mt-2">{count} review{count !== 1 ? 's' : ''}</p>
          </div>
          <div className="md:col-span-2 space-y-2.5">
            {dist.map(({ n, count: c, pct }) => (
              <div key={n} className="flex items-center gap-3">
                <span className="text-xs text-tz-muted w-5 text-right font-body">{n}</span>
                <Star size={11} className="text-tz-gold fill-tz-gold shrink-0" />
                <div className="flex-1 h-1.5 bg-tz-surface overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-tz-gold"
                  />
                </div>
                <span className="text-xs text-tz-muted w-4 font-body">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
      ) : count === 0 ? (
        <div className="py-12 text-center border border-tz-border bg-tz-dark">
          <Star size={28} className="text-tz-border mx-auto mb-3" />
          <p className="text-sm text-tz-muted font-body">No reviews yet. Be the first to review this product.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              onDeleted={handleReviewDeleted}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  )
}