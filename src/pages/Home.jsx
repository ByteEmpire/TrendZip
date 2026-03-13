// src/pages/Home.jsx — v4
// CHANGES from v3:
//   [1] DiscountSection: after a user has USED their welcome coupon
//       (detected via coupon_uses table), show a "Thank You for Your
//       First Order" loyalty card instead of the code again.
//       States: idle → checking → claimed | already_claimed | used
//   [2] Everything else unchanged from v3.

import { useState, useEffect }                         from 'react'
import { Link }                                         from 'react-router-dom'
import { motion, AnimatePresence }                      from 'framer-motion'
import {
  ArrowRight, Star, LayoutGrid, Loader2,
  Gift, Check, Copy, LogIn, Heart, Sparkles,
} from 'lucide-react'
import { supabase }       from '@/lib/supabase'
import useAuthStore       from '@/store/authStore'
import ProductCard        from '@/components/product/ProductCard'

// ─── Data loader ──────────────────────────────────────────────────────────────
async function loadHomeData() {
  const { data: settingsRows } = await supabase
    .from('homepage_settings')
    .select('key, value')

  const s = (settingsRows ?? []).reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {})

  const heroId      = s.hero?.product_id ?? null
  const featuredIds = s.featured_products?.product_ids ?? []
  const trendingIds = s.trending_products?.product_ids ?? []
  const allIds      = [...new Set([heroId, ...featuredIds, ...trendingIds].filter(Boolean))]

  let productsMap = {}
  if (allIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, images, sale_price, base_price, available_sizes, stock_count, tags, rating_avg, review_count')
      .in('id', allIds)
      .eq('is_active', true)
    ;(products ?? []).forEach(p => { productsMap[p.id] = p })
  }

  const catIds = s.featured_categories?.category_ids ?? []
  let categories = []
  if (catIds.length > 0) {
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name, slug, image_url')
      .in('id', catIds)
      .eq('is_active', true)
    categories = catIds.map(id => (cats ?? []).find(c => c.id === id)).filter(Boolean)
  }

  return {
    settings:         s,
    heroProduct:      heroId ? (productsMap[heroId] ?? null) : null,
    featuredProducts: featuredIds.map(id => productsMap[id]).filter(Boolean),
    trendingProducts: trendingIds.map(id => productsMap[id]).filter(Boolean),
    categories,
    testimonials:     s.testimonials?.items ?? [],
    announcement:     s.announcement_bar   ?? { active: false, text: '' },
  }
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHomeData()
      .then(setData)
      .catch(err => { console.error('[Home]', err); setData({}) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-tz-black flex items-center justify-center">
        <Loader2 size={28} className="text-tz-gold animate-spin" />
      </div>
    )
  }

  const {
    settings          = {},
    heroProduct       = null,
    featuredProducts  = [],
    trendingProducts  = [],
    categories        = [],
    testimonials      = [],
    announcement      = {},
  } = data ?? {}

  return (
    <div className="bg-tz-black min-h-screen">

      {/* Announcement bar */}
      {announcement.active && announcement.text && (
        <div className="bg-tz-gold text-tz-black text-center py-2.5 px-4">
          <p className="text-xs font-bold font-body tracking-wide">{announcement.text}</p>
        </div>
      )}

      <HeroSection product={heroProduct} config={settings.hero ?? {}} />

      {featuredProducts.length > 0 && (
        <ProductsSection label="Featured" heading="Handpicked for You" products={featuredProducts} viewAllHref="/catalog" />
      )}

      {categories.length > 0 && (
        <CategoriesSection categories={categories} />
      )}

      {trendingProducts.length > 0 && (
        <ProductsSection label="Trending" heading="Trending Now" products={trendingProducts} viewAllHref="/c/trending" />
      )}

      {testimonials.length > 0 && (
        <TestimonialsSection testimonials={testimonials} />
      )}

      {/* Discount section — home page only */}
      <DiscountSection />
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ product, config }) {
  const image        = product?.images?.[0] ?? null
  const headline     = config.headline      || 'New Season Arrivals'
  const subheading   = config.subheading    || 'Premium D2C fashion for the modern Indian'
  const badge        = config.badge         || ''
  const season       = config.season        || ''
  const discountText = config.discount_text || ''
  const ctaText      = config.cta_text      || 'Shop Now'

  const ctaHref =
    config.link_type === 'url' || config.link_type === 'collection'
      ? (config.link_url || '/catalog')
      : config.link_type === 'product' && product?.slug
      ? `/products/${product.slug}`
      : '/catalog'

  return (
    <div className="relative h-[78vh] min-h-[480px] max-h-[860px] overflow-hidden bg-tz-dark">
      {image ? (
        <img src={image} alt={product?.name ?? 'Hero'} className="w-full h-full object-cover object-center" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tz-dark to-tz-surface">
          <div className="text-center px-6">
            <h1 className="font-display text-5xl sm:text-7xl text-tz-white font-light leading-none mb-4">{headline}</h1>
            <p className="text-sm text-tz-muted font-body mb-8 max-w-md mx-auto">{subheading}</p>
            <Link to={ctaHref} className="inline-flex items-center gap-2 bg-tz-gold text-tz-black text-sm font-bold font-body px-8 py-3.5 hover:brightness-110 transition-all">
              {ctaText} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {image && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />}

      {discountText && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-tz-accent text-white text-[11px] font-bold font-body px-3 py-1.5 tracking-wide">{discountText}</span>
        </div>
      )}

      {(badge || season) && image && (
        <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-sm border border-tz-border/60 px-4 py-3 text-right z-10">
          {badge  && <p className="text-[9px] font-bold text-tz-gold font-body tracking-[0.2em] uppercase">{badge}</p>}
          {season && <p className="text-sm text-tz-white font-display font-light">{season}</p>}
        </div>
      )}

      {image && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 z-10"
        >
          <h1 className="font-display text-3xl sm:text-5xl text-tz-white font-light leading-tight mb-2 max-w-lg">{headline}</h1>
          <p className="text-sm text-tz-muted font-body mb-6">{subheading}</p>
          <Link to={ctaHref} className="inline-flex items-center gap-2 bg-tz-gold text-tz-black text-xs font-bold font-body px-6 py-3 hover:brightness-110 transition-all">
            {ctaText} <ArrowRight size={13} />
          </Link>
        </motion.div>
      )}
    </div>
  )
}

// ─── Products section ─────────────────────────────────────────────────────────
function ProductsSection({ label, heading, products, viewAllHref }) {
  return (
    <section className="py-14 border-t border-tz-border">
      <div className="page-container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="eyebrow mb-2">{label}</p>
            <h2 className="font-display text-3xl text-tz-white font-light">{heading}</h2>
          </div>
          <Link to={viewAllHref} className="hidden sm:flex items-center gap-1.5 text-xs text-tz-muted hover:text-tz-gold font-body transition-colors">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
        <div className="mt-6 sm:hidden text-center">
          <Link to={viewAllHref} className="btn-secondary text-xs">View All <ArrowRight size={11} className="inline ml-1" /></Link>
        </div>
      </div>
    </section>
  )
}

// ─── Shop by Category ─────────────────────────────────────────────────────────
function CategoriesSection({ categories }) {
  return (
    <section className="py-14 border-t border-tz-border">
      <div className="page-container">
        <div className="text-center mb-10">
          <p className="eyebrow mb-2">Browse</p>
          <h2 className="font-display text-3xl text-tz-white font-light">Shop by Category</h2>
        </div>
        <div className={`grid gap-3 ${
          categories.length <= 2 ? 'grid-cols-2' :
          categories.length === 3 ? 'grid-cols-3' :
          'grid-cols-2 md:grid-cols-4'
        }`}>
          {categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <Link to={`/catalog?category=${cat.slug}`}
                className="group block relative overflow-hidden bg-tz-dark border border-tz-border hover:border-tz-gold/40 transition-colors">
                <div className="aspect-[4/5] overflow-hidden">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-tz-surface flex items-center justify-center">
                      <LayoutGrid size={28} className="text-tz-muted" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-sm font-semibold text-tz-white font-body group-hover:text-tz-gold transition-colors">{cat.name}</p>
                  <span className="text-[10px] text-tz-gold font-body flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Shop now <ArrowRight size={9} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection({ testimonials }) {
  return (
    <section className="py-14 border-t border-tz-border">
      <div className="page-container">
        <div className="text-center mb-10">
          <p className="eyebrow mb-2">Reviews</p>
          <h2 className="font-display text-3xl text-tz-white font-light">What Our Customers Say</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div key={t.id ?? i}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="bg-tz-dark border border-tz-border p-6"
            >
              <div className="flex items-center gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={13} className={n <= (t.rating ?? 5) ? 'text-tz-gold fill-tz-gold' : 'text-tz-border'} />
                ))}
              </div>
              <p className="text-sm text-tz-text font-body leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-tz-gold/10 border border-tz-gold/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-tz-gold font-body">{(t.name ?? 'C').charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-tz-white font-body">{t.name}</p>
                  {t.location && <p className="text-[10px] text-tz-muted font-body">{t.location}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Discount Section ─────────────────────────────────────────────────────────
// States:
//   idle            → not logged in  → show "Create Account" gate
//   idle            → logged in      → triggers useEffect → 'checking'
//   checking        → checking newsletter + coupon_uses
//   claimed         → first time this session (just inserted)
//   already_claimed → code was revealed before but coupon not yet used
//   used            → coupon was actually used (record in coupon_uses)
//                     → show "Thank you" loyalty card instead of the code
// ─────────────────────────────────────────────────────────────────────────────
const DISCOUNT_CODE = 'TRENDZIP10'

function DiscountSection() {
  const user     = useAuthStore(s => s.user)
  const profile  = useAuthStore(s => s.profile)
  const openAuth = useAuthStore(s => s.openAuth)

  // 'idle' | 'checking' | 'claimed' | 'already_claimed' | 'used'
  const [claimState, setClaimState] = useState('idle')
  const [copied,     setCopied]     = useState(false)

  useEffect(() => {
    if (!user || !profile) return
    if (claimState !== 'idle') return

    async function checkAndClaim() {
      setClaimState('checking')
      const email = user.email.toLowerCase().trim()

      try {
        // ── 1. Has the coupon been *used* in an order? ────────────────────
        // Look up the coupon id first
        const { data: couponRow } = await supabase
          .from('coupons')
          .select('id')
          .eq('code', DISCOUNT_CODE)
          .maybeSingle()

        if (couponRow?.id) {
          const { data: useRow } = await supabase
            .from('coupon_uses')
            .select('id')
            .eq('coupon_id', couponRow.id)
            .eq('user_id', user.id)
            .maybeSingle()

          if (useRow) {
            setClaimState('used')
            return
          }
        }

        // ── 2. Has the code been revealed before (newsletter table)? ──────
        const { data: existing } = await supabase
          .from('newsletter_subscribers')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (existing) {
          setClaimState('already_claimed')
          return
        }

        // ── 3. First time — insert and reveal ─────────────────────────────
        await supabase.from('newsletter_subscribers').insert({
          email,
          discount_code: DISCOUNT_CODE,
          source:        'homepage_discount_section',
        })
        setClaimState('claimed')
      } catch (err) {
        console.warn('[DiscountSection] check error:', err)
        setClaimState('idle')
      }
    }

    checkAndClaim()
  }, [user, profile])

  function copyCode() {
    navigator.clipboard.writeText(DISCOUNT_CODE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const codeRevealed = claimState === 'claimed' || claimState === 'already_claimed'
  const isChecking   = claimState === 'checking'
  const isUsed       = claimState === 'used'

  return (
    <section className="py-20 border-t border-tz-border bg-tz-dark/60">
      <div className="page-container">
        <div className="max-w-xl mx-auto text-center">

          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="w-14 h-14 bg-tz-gold/10 border border-tz-gold/30 flex items-center justify-center mx-auto mb-6"
          >
            {isUsed
              ? <Heart size={22} className="text-tz-gold fill-tz-gold/30" />
              : <Gift  size={22} className="text-tz-gold" />
            }
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {isUsed ? (
              <>
                <p className="eyebrow mb-3">Thank You</p>
                <h2 className="font-display text-3xl sm:text-4xl text-tz-white font-light mb-3">
                  Welcome to the TrendZip family
                </h2>
                <p className="text-sm text-tz-muted font-body mb-8 leading-relaxed">
                  You've already used your welcome offer — thank you for shopping with us.
                  Keep an eye out for exclusive member deals and new arrivals.
                </p>
              </>
            ) : (
              <>
                <p className="eyebrow mb-3">Exclusive Offer</p>
                <h2 className="font-display text-3xl sm:text-4xl text-tz-white font-light mb-3">
                  Get 10% Off Your First Order
                </h2>
                <p className="text-sm text-tz-muted font-body mb-8 leading-relaxed">
                  Sign up for TrendZip updates and get exclusive access to new drops,
                  special offers, and style inspiration.
                </p>
              </>
            )}
          </motion.div>

          <AnimatePresence mode="wait">

            {/* ── Checking ── */}
            {isChecking && (
              <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-3 py-6">
                <Loader2 size={18} className="text-tz-gold animate-spin" />
                <span className="text-sm text-tz-muted font-body">Checking your account…</span>
              </motion.div>
            )}

            {/* ── Used state — loyalty card ── */}
            {isUsed && (
              <motion.div
                key="used"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 18 }}
                className="max-w-md mx-auto"
              >
                <div className="bg-tz-surface border border-tz-gold/20 p-6 space-y-4">
                  {/* Loyalty badge */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={14} className="text-tz-gold fill-tz-gold" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-tz-gold font-body tracking-wider uppercase">Valued Member</span>
                  </div>

                  <p className="text-xs text-tz-muted font-body leading-relaxed text-center">
                    You're part of the TrendZip community. Stay tuned — we're always cooking up exclusive deals for our members.
                  </p>

                  <div className="flex gap-2 pt-1">
                    <Link to="/catalog"
                      className="flex-1 flex items-center justify-center gap-2 bg-tz-gold text-tz-black text-xs font-bold font-body px-4 py-3 hover:brightness-110 transition-all">
                      Shop New Arrivals <ArrowRight size={12} />
                    </Link>
                    <Link to="/orders"
                      className="flex-1 flex items-center justify-center gap-2 border border-tz-border text-tz-muted text-xs font-body px-4 py-3 hover:border-tz-gold/40 hover:text-tz-gold transition-all">
                      My Orders
                    </Link>
                  </div>

                  {/* Subtle "coming soon" teaser */}
                  <div className="flex items-center gap-2 pt-1 border-t border-tz-border/50">
                    <Sparkles size={11} className="text-tz-gold/60 shrink-0" />
                    <p className="text-[10px] text-tz-muted/70 font-body">
                      More exclusive offers coming soon for loyal members
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Not logged in ── */}
            {!user && !isChecking && !isUsed && (
              <motion.div key="logged-out"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="max-w-md mx-auto"
              >
                <div className="bg-tz-surface border border-tz-border p-6 text-center">
                  <p className="text-xs text-tz-muted font-body mb-5 leading-relaxed">
                    Create a free account to instantly unlock your exclusive 10% discount code.
                    One use per account — applied automatically at checkout.
                  </p>
                  <button
                    onClick={() => openAuth('register')}
                    className="w-full flex items-center justify-center gap-2 bg-tz-gold text-tz-black text-sm font-bold font-body px-6 py-3.5 hover:brightness-110 transition-all"
                  >
                    <LogIn size={15} />
                    Create Account to Unlock
                  </button>
                  <button
                    onClick={() => openAuth('login')}
                    className="w-full mt-2 text-xs text-tz-muted hover:text-tz-gold font-body transition-colors py-2"
                  >
                    Already have an account? Sign in →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Code revealed ── */}
            {codeRevealed && (
              <motion.div key="reveal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 18 }}
                className="max-w-md mx-auto"
              >
                <div className="bg-tz-surface border border-tz-gold/30 p-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                      <Check size={13} className="text-green-400" />
                    </div>
                    <p className="text-xs font-semibold text-tz-white font-body">
                      {claimState === 'claimed' ? "Your code is ready! 🎉" : "Your exclusive code"}
                    </p>
                  </div>

                  <p className="text-xs text-tz-muted font-body mb-4">Your 10% discount code:</p>

                  <div className="flex items-center border border-tz-gold/40 bg-tz-black">
                    <span className="flex-1 text-center font-mono text-xl font-bold text-tz-gold py-4 px-6 tracking-widest">
                      {DISCOUNT_CODE}
                    </span>
                    <button
                      onClick={copyCode}
                      className="px-4 py-4 text-tz-muted hover:text-tz-gold border-l border-tz-gold/40 transition-colors"
                      title="Copy code"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>

                  {copied && <p className="text-xs text-green-400 font-body mt-2 text-center">Copied to clipboard!</p>}

                  <p className="text-[10px] text-tz-muted/70 font-body mt-4 leading-relaxed">
                    Valid on your first order · One use per account · Cannot be combined with other offers
                  </p>

                  <Link to="/catalog"
                    className="mt-5 flex items-center justify-center gap-2 bg-tz-gold text-tz-black text-xs font-bold font-body px-6 py-3 hover:brightness-110 transition-all w-full">
                    Shop Now — Use My Code <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}