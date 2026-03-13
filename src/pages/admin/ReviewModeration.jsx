import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, Check, X, Package, MessageSquare
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'pending',  label: 'Pending',  filter: null  },
  { key: 'approved', label: 'Approved', filter: true  },
  { key: 'rejected', label: 'Rejected', filter: false },
]

export default function ReviewModeration() {
  const [tab,     setTab]     = useState('pending')
  const [reviews, setReviews] = useState([])
  const [counts,  setCounts]  = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  // ── Load counts ─────────────────────────────────────────────────────────
  const loadCounts = async () => {
    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      supabase.from('reviews').select('*', { count: 'exact', head: true }).is('is_approved', null),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', true),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    ])
    setCounts({
      pending:  pendingRes.count  ?? 0,
      approved: approvedRes.count ?? 0,
      rejected: rejectedRes.count ?? 0,
    })
  }

  // ── Load reviews ─────────────────────────────────────────────────────────
  const loadReviews = async () => {
    setLoading(true)
    const { filter } = TABS.find(t => t.key === tab) ?? {}

    // ✅ FIXED: select 'body' and 'title' not 'comment' — matches DB schema
    let query = supabase
      .from('reviews')
      .select(`
        id, rating, title, body, created_at, is_approved,
        profiles ( full_name ),
        products ( id, name, slug, images )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (tab === 'pending') query = query.is('is_approved', null)
    else                   query = query.eq('is_approved', filter)

    const { data } = await query
    if (data) setReviews(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCounts()
    loadReviews()
  }, [tab])

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    setReviews(rs => rs.filter(r => r.id !== id))
    setCounts(c => ({ ...c, pending: Math.max(0, c.pending - 1), approved: c.approved + 1 }))
    toast.success('Review approved')
  }

  const handleReject = async (id) => {
    const { error } = await supabase.from('reviews').update({ is_approved: false }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    setReviews(rs => rs.filter(r => r.id !== id))
    setCounts(c => ({ ...c, pending: Math.max(0, c.pending - 1), rejected: c.rejected + 1 }))
    toast.success('Review rejected')
  }

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this review?')) return
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) { toast.error('Failed'); return }
    setReviews(rs => rs.filter(r => r.id !== id))
    toast.success('Deleted')
    loadCounts()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-tz-white mb-1">Review Moderation</h1>
        <p className="text-tz-muted text-sm">
          Approve or reject customer reviews before they appear on product pages
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-tz-black/40 border border-tz-border p-1 rounded-xl mb-6 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-tz-dark text-tz-white' : 'text-tz-muted hover:text-tz-white'
            }`}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                t.key === 'pending'  ? 'bg-amber-500 text-black'          :
                t.key === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                       'bg-red-500/20 text-red-400'
              }`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-tz-black/40 border border-tz-border rounded-2xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-[72px] rounded-lg bg-tz-border/30" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-tz-border/30 rounded" />
                  <div className="h-4 w-full bg-tz-border/20 rounded" />
                  <div className="h-4 w-3/4 bg-tz-border/20 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-tz-muted opacity-20" />
          <p className="text-tz-muted">No {tab} reviews</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {reviews.map(review => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, margin: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-tz-black/40 border border-tz-border rounded-2xl p-5"
              >
                <div className="flex gap-4">

                  {/* Product thumbnail — ✅ FIXED: link uses slug */}
                  <Link
                    to={`/products/${review.products?.slug ?? review.products?.id}`}
                    className="w-14 rounded-lg overflow-hidden bg-tz-dark shrink-0 block"
                    style={{ height: '72px' }}
                  >
                    {review.products?.images?.[0] ? (
                      <img
                        src={review.products.images[0]}
                        alt={review.products?.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-tz-muted opacity-30" />
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/products/${review.products?.slug ?? review.products?.id}`}
                          className="text-tz-white text-sm font-medium hover:text-tz-gold transition-colors line-clamp-1"
                        >
                          {review.products?.name ?? 'Unknown Product'}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-tz-gold text-tz-gold' : 'text-tz-border'}`} />
                            ))}
                          </div>
                          <span className="text-tz-muted text-xs">
                            by {review.profiles?.full_name ?? 'Anonymous'} ·{' '}
                            {new Date(review.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {tab !== 'pending' && (
                        <span className={`text-xs px-2.5 py-1 rounded-full ${
                          review.is_approved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {review.is_approved ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </div>

                    {/* ✅ FIXED: review.body not review.comment */}
                    {review.title && (
                      <p className="text-tz-white text-sm font-medium mt-2.5">{review.title}</p>
                    )}
                    <p className="text-tz-muted text-sm mt-1 leading-relaxed line-clamp-3">
                      {review.body}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {tab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-tz-border/20 hover:bg-red-500/10 text-tz-muted hover:text-red-400 text-xs font-medium rounded-lg transition-colors ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}