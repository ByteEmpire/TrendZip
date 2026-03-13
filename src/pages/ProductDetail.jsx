// src/pages/ProductDetail.jsx
// BATCH 24 ADDITIONS:
//   - useRecentlyViewed hook — tracks current product on mount
//   - RecentlyViewed component — shows at bottom, fetched from Supabase by slug
//   - RelatedProducts already existed — kept intact

import { useEffect, useState }          from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence }      from 'framer-motion'
import {
  ShoppingCart, Heart, Share2, X, ChevronLeft, ChevronRight,
  Ruler, Shield, RotateCcw, Truck, Star, Package,
  ChevronDown, Clock,
} from 'lucide-react'
import { supabase }         from '@/lib/supabase'
import useCartStore         from '@/store/cartStore'
import useWishlistStore     from '@/store/wishlistStore'
import useAuthStore         from '@/store/authStore'
import useRecentlyViewed    from '@/hooks/useRecentlyViewed'
import toast                from 'react-hot-toast'
import SEO                  from '@/components/SEO'

// ─── Size Chart ───────────────────────────────────────────────────────────────
const SIZE_CHART = {
  tops: [
    { size: 'XS',  chest: '32–33', waist: '24–25', hips: '34–35' },
    { size: 'S',   chest: '34–35', waist: '26–27', hips: '36–37' },
    { size: 'M',   chest: '36–37', waist: '28–29', hips: '38–39' },
    { size: 'L',   chest: '38–40', waist: '30–32', hips: '40–42' },
    { size: 'XL',  chest: '41–43', waist: '33–35', hips: '43–45' },
    { size: 'XXL', chest: '44–46', waist: '36–38', hips: '46–48' },
  ],
  bottoms: [
    { size: '26', waist: '26', hips: '35', inseam: '30' },
    { size: '28', waist: '28', hips: '37', inseam: '30' },
    { size: '30', waist: '30', hips: '39', inseam: '31' },
    { size: '32', waist: '32', hips: '41', inseam: '31' },
    { size: '34', waist: '34', hips: '43', inseam: '32' },
    { size: '36', waist: '36', hips: '45', inseam: '32' },
  ],
}

// ─── Size Guide Modal ─────────────────────────────────────────────────────────
function SizeGuideModal({ onClose, category }) {
  const isBottoms = ['pants', 'jeans', 'shorts', 'skirts', 'bottoms'].includes(category?.toLowerCase())
  const chart = isBottoms ? SIZE_CHART.bottoms : SIZE_CHART.tops
  const type  = isBottoms ? 'bottoms' : 'tops'

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative z-10 w-full max-w-lg bg-tz-dark border border-tz-border rounded-2xl overflow-hidden"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        >
          <div className="flex items-center justify-between p-6 border-b border-tz-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-tz-gold/10 flex items-center justify-center">
                <Ruler className="w-4 h-4 text-tz-gold" />
              </div>
              <h2 className="text-tz-white font-display text-lg font-semibold">Size Guide</h2>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg bg-tz-black/50 flex items-center justify-center text-tz-muted hover:text-tz-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-tz-muted text-sm mb-5 leading-relaxed">
              All measurements are in <span className="text-tz-white">inches</span>.
              Measure your body and compare to the chart below.
            </p>
            <div className="bg-tz-black/40 rounded-xl p-4 mb-5 border border-tz-border/50">
              <p className="text-tz-gold text-xs font-medium uppercase tracking-wider mb-3">How to Measure</p>
              <div className="space-y-1.5 text-sm text-tz-muted">
                {type === 'tops' ? (
                  <>
                    <p><span className="text-tz-white">Chest:</span> Measure around the fullest part of your chest.</p>
                    <p><span className="text-tz-white">Waist:</span> Measure around your natural waistline.</p>
                    <p><span className="text-tz-white">Hips:</span> Measure around the fullest part of your hips.</p>
                  </>
                ) : (
                  <>
                    <p><span className="text-tz-white">Waist:</span> Measure around your natural waistline.</p>
                    <p><span className="text-tz-white">Hips:</span> Measure around the fullest part of your hips.</p>
                    <p><span className="text-tz-white">Inseam:</span> Measure from the crotch seam to ankle.</p>
                  </>
                )}
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-tz-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-tz-black/60">
                    <th className="text-left px-4 py-3 text-tz-gold text-xs uppercase tracking-wider font-medium">Size</th>
                    {type === 'tops' ? (
                      <>
                        <th className="text-center px-4 py-3 text-tz-muted text-xs uppercase tracking-wider font-medium">Chest</th>
                        <th className="text-center px-4 py-3 text-tz-muted text-xs uppercase tracking-wider font-medium">Waist</th>
                        <th className="text-center px-4 py-3 text-tz-muted text-xs uppercase tracking-wider font-medium">Hips</th>
                      </>
                    ) : (
                      <>
                        <th className="text-center px-4 py-3 text-tz-muted text-xs uppercase tracking-wider font-medium">Waist</th>
                        <th className="text-center px-4 py-3 text-tz-muted text-xs uppercase tracking-wider font-medium">Hips</th>
                        <th className="text-center px-4 py-3 text-tz-muted text-xs uppercase tracking-wider font-medium">Inseam</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {chart.map((row, i) => (
                    <tr key={row.size} className={`border-t border-tz-border/40 ${i % 2 === 0 ? 'bg-transparent' : 'bg-tz-black/20'}`}>
                      <td className="px-4 py-3 text-tz-white font-semibold">{row.size}</td>
                      {type === 'tops' ? (
                        <>
                          <td className="px-4 py-3 text-center text-tz-muted">{row.chest}</td>
                          <td className="px-4 py-3 text-center text-tz-muted">{row.waist}</td>
                          <td className="px-4 py-3 text-center text-tz-muted">{row.hips}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-center text-tz-muted">{row.waist}</td>
                          <td className="px-4 py-3 text-center text-tz-muted">{row.hips}</td>
                          <td className="px-4 py-3 text-center text-tz-muted">{row.inseam}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-tz-muted text-xs mt-4">Between sizes? We recommend sizing up for a relaxed fit.</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Trust Badges ─────────────────────────────────────────────────────────────
function TrustBadges() {
  const badges = [
    { icon: RotateCcw, label: 'Free Returns',     sub: '30-day policy'   },
    { icon: Shield,    label: 'Secure Checkout',  sub: '256-bit SSL'     },
    { icon: Truck,     label: '3–5 Day Delivery', sub: 'Pan India'       },
    { icon: Package,   label: 'Genuine Products', sub: '100% authentic'  },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 mt-6">
      {badges.map(({ icon: Icon, label, sub }) => (
        <div key={label} className="flex items-center gap-2.5 bg-tz-black/40 rounded-xl px-3 py-2.5 border border-tz-border/50">
          <div className="w-7 h-7 rounded-lg bg-tz-gold/10 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-tz-gold" />
          </div>
          <div>
            <p className="text-tz-white text-xs font-medium leading-tight">{label}</p>
            <p className="text-tz-muted text-xs leading-tight">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Stock Urgency ────────────────────────────────────────────────────────────
function StockUrgency({ count }) {
  if (!count || count >= 20) return null
  if (count === 0) {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
        <span className="font-medium">Out of stock</span>
      </div>
    )
  }
  if (count <= 5) {
    return (
      <motion.div className="flex items-center gap-2 text-red-400 text-sm"
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <motion.span className="w-2 h-2 rounded-full bg-red-400 shrink-0"
          animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} />
        <span className="font-medium">Only {count} left — order soon!</span>
      </motion.div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-amber-400 text-sm">
      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
      <span className="font-medium">Only {count} left</span>
    </div>
  )
}

// ─── Mini Product Card (shared by Related & Recently Viewed) ──────────────────
function MiniProductCard({ product, index = 0 }) {
  const displayPrice = product.sale_price ?? product.base_price
  const original     = product.sale_price ? product.base_price : null
  return (
    <motion.div
      key={product.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="group"
    >
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-tz-black mb-3">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-tz-muted">
              <Package className="w-8 h-8 opacity-30" />
            </div>
          )}
          {original && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              SALE
            </span>
          )}
        </div>
        <p className="text-tz-white text-sm font-medium truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-tz-gold text-sm font-semibold">₹{displayPrice?.toLocaleString('en-IN')}</p>
          {original && (
            <p className="text-tz-muted text-xs line-through">₹{original?.toLocaleString('en-IN')}</p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Related Products ─────────────────────────────────────────────────────────
function RelatedProducts({ currentProductSlug, categorySlug }) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (!categorySlug) return
    supabase
      .from('products')
      .select('id, name, base_price, sale_price, images, category_slug, stock_count, slug')
      .eq('category_slug', categorySlug)
      .neq('slug', currentProductSlug)
      .eq('is_active', true)
      .limit(4)
      .then(({ data }) => { if (data) setProducts(data) })
  }, [categorySlug, currentProductSlug])

  if (!products.length) return null

  return (
    <div className="mt-16 border-t border-tz-border pt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold text-tz-white">You May Also Like</h2>
        <Link to="/products" className="text-tz-gold text-sm hover:underline flex items-center gap-1">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p, i) => <MiniProductCard key={p.id} product={p} index={i} />)}
      </div>
    </div>
  )
}

// ─── Recently Viewed ──────────────────────────────────────────────────────────
function RecentlyViewed({ currentSlug }) {
  const { getSlugs }   = useRecentlyViewed()
  const [products, setProducts] = useState([])

  useEffect(() => {
    const slugs = getSlugs().filter(s => s !== currentSlug)
    if (!slugs.length) return

    supabase
      .from('products')
      .select('id, name, slug, images, base_price, sale_price, is_active')
      .in('slug', slugs)
      .eq('is_active', true)
      .limit(6)
      .then(({ data }) => {
        if (!data?.length) return
        // Preserve the order from localStorage (most recent first)
        const ordered = slugs
          .map(s => data.find(p => p.slug === s))
          .filter(Boolean)
        setProducts(ordered)
      })
  }, [currentSlug]) // eslint-disable-line

  if (!products.length) return null

  return (
    <div className="mt-16 border-t border-tz-border pt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-tz-muted" />
          <h2 className="font-display text-xl font-semibold text-tz-white">Recently Viewed</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {products.map((p, i) => <MiniProductCard key={p.id} product={p} index={i} />)}
      </div>
    </div>
  )
}

// ─── Main ProductDetail ───────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id }       = useParams()   // slug from URL
  const navigate     = useNavigate()
  const { addItem }  = useCartStore()
  const { items: wishlistItems, addItem: addWishlist, removeItem: removeWishlist } = useWishlistStore()
  const user         = useAuthStore(s => s.user)
  const { addSlug }  = useRecentlyViewed()  // ✅ NEW

  const [product,      setProduct]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [activeImage,  setActiveImage]  = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [reviews,      setReviews]      = useState([])
  const [descOpen,     setDescOpen]     = useState(true)
  const [quantity,     setQuantity]     = useState(1)

  const isWishlisted = wishlistItems.some(w => w.product_id === product?.id || w.id === product?.id)

  // ── Fetch product by slug ─────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setActiveImage(0)
    supabase
      .from('products').select('*').eq('slug', id).single()
      .then(({ data, error }) => {
        if (error || !data) { navigate('/products'); return }
        setProduct(data)
        if (data.colors?.length) setSelectedColor(data.colors[0])
        setLoading(false)
        // ✅ Track this product as recently viewed
        addSlug(data.slug)
      })
  }, [id, navigate]) // eslint-disable-line

  // ── Fetch approved reviews ────────────────────────────────────────────────
  useEffect(() => {
    if (!product?.id) return
    supabase
      .from('reviews')
      .select('id, rating, title, body, created_at, user_id')
      .eq('product_id', product.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (!error && data) setReviews(data)
      })
  }, [product?.id])

  // ── Derived ───────────────────────────────────────────────────────────────
  const price        = product?.sale_price ?? product?.base_price
  const comparePrice = product?.sale_price && product?.sale_price < product?.base_price ? product.base_price : null
  const savings      = comparePrice ? comparePrice - price : 0
  const outOfStock   = product?.inventory_count === 0
  const categoryDisplay = product?.category_slug || product?.category
  const avgRating    = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const handleAddToCart = async () => {
    if (!product) return
    if (product.available_sizes?.length && !selectedSize) { toast.error('Please select a size'); return }
    if (outOfStock) { toast.error('This item is out of stock'); return }
    setAddingToCart(true)
    try {
      await addItem({
        id: product.id, product_id: product.id, name: product.name,
        price, image: product.images?.[0], size: selectedSize, color: selectedColor, quantity,
      })
      toast.success('Added to cart!')
    } catch { toast.error('Could not add to cart') }
    finally { setAddingToCart(false) }
  }

  const handleWishlist = () => {
    if (!user) { navigate('/login'); return }
    if (isWishlisted) { removeWishlist(product.id); toast('Removed from wishlist') }
    else { addWishlist({ id: product.id, product_id: product.id, name: product.name, price, image: product.images?.[0] }); toast.success('Added to wishlist!') }
  }

  const handleShare = () => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }

  const prevImage = () => setActiveImage(i => (i - 1 + (product.images?.length || 1)) % (product.images?.length || 1))
  const nextImage = () => setActiveImage(i => (i + 1) % (product.images?.length || 1))

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-tz-dark flex items-center justify-center">
        <motion.div className="w-10 h-10 rounded-full border-2 border-tz-gold border-t-transparent"
          animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
      </div>
    )
  }

  if (!product) return null

  const images = product.images?.length ? product.images : [null]

  return (
    <>
      <SEO
        title={product.name}
        description={product.description || `Shop ${product.name} at TrendZip`}
        image={product.images?.[0]}
        type="product"
        product={product}
      />

      {sizeGuideOpen && (
        <SizeGuideModal onClose={() => setSizeGuideOpen(false)} category={product.category_slug || product.category} />
      )}

      <div className="min-h-screen bg-tz-dark">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-tz-muted text-sm mb-8 flex-wrap">
            <Link to="/" className="hover:text-tz-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link to="/products" className="hover:text-tz-white transition-colors">Products</Link>
            {categoryDisplay && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <Link to={`/products?category=${categoryDisplay}`}
                  className="hover:text-tz-white transition-colors capitalize">{categoryDisplay}</Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-tz-white truncate max-w-[160px]">{product.name}</span>
          </nav>

          {/* Main Grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-14">

            {/* ── Image Gallery ── */}
            <div className="space-y-4">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-tz-black group">
                <AnimatePresence mode="wait">
                  <motion.div key={activeImage} className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3 }}
                  >
                    {images[activeImage]
                      ? <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-tz-muted"><Package className="w-16 h-16 opacity-20" /></div>
                    }
                  </motion.div>
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.is_featured && <span className="bg-tz-gold text-tz-black text-xs font-bold px-2.5 py-1 rounded-full">FEATURED</span>}
                  {comparePrice && <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">SALE</span>}
                </div>

                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <button onClick={handleWishlist} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-black/70">
                    <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </button>
                  <button onClick={handleShare} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors hover:bg-black/70">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {images.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                    {activeImage + 1} / {images.length}
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-tz-gold' : 'border-tz-border hover:border-tz-muted'}`}
                    >
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-tz-black" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Product Info ── */}
            <div className="flex flex-col">
              {categoryDisplay && (
                <p className="text-tz-gold text-xs uppercase tracking-widest font-medium mb-2">{categoryDisplay}</p>
              )}

              <h1 className="font-display text-2xl md:text-3xl font-bold text-tz-white leading-tight mb-3">
                {product.name}
              </h1>

              {avgRating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'fill-tz-gold text-tz-gold' : 'text-tz-muted'}`} />
                    ))}
                  </div>
                  <span className="text-tz-white text-sm font-medium">{avgRating}</span>
                  <span className="text-tz-muted text-sm">({reviews.length} reviews)</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-tz-gold font-display text-3xl font-bold">
                  ₹{price?.toLocaleString('en-IN')}
                </span>
                {comparePrice && (
                  <>
                    <span className="text-tz-muted text-lg line-through">₹{comparePrice.toLocaleString('en-IN')}</span>
                    <span className="bg-red-500/10 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                      Save ₹{savings.toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </div>

              <div className="mb-5"><StockUrgency count={product.inventory_count} /></div>

              {/* Colors */}
              {product.colors?.length > 0 && (
                <div className="mb-5">
                  <p className="text-tz-muted text-sm mb-2">Color: <span className="text-tz-white capitalize">{selectedColor}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)} title={color}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-tz-gold scale-110' : 'border-transparent hover:border-tz-muted'}`}
                        style={{ backgroundColor: color.toLowerCase() }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.available_sizes?.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-tz-muted text-sm">Size: <span className="text-tz-white">{selectedSize || 'Select'}</span></p>
                    <button onClick={() => setSizeGuideOpen(true)} className="flex items-center gap-1 text-tz-gold text-xs hover:underline">
                      <Ruler className="w-3 h-3" /> Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.available_sizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedSize === size ? 'border-tz-gold bg-tz-gold/10 text-tz-gold' : 'border-tz-border text-tz-muted hover:border-tz-muted hover:text-tz-white'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <p className="text-tz-muted text-sm">Qty:</p>
                <div className="flex items-center border border-tz-border rounded-lg overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center text-tz-muted hover:text-tz-white hover:bg-tz-black/40 transition-colors">−</button>
                  <span className="w-10 text-center text-tz-white text-sm font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.inventory_count || 99, q + 1))} className="w-9 h-9 flex items-center justify-center text-tz-muted hover:text-tz-white hover:bg-tz-black/40 transition-colors">+</button>
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-3 mb-2">
                <motion.button onClick={handleAddToCart} disabled={addingToCart || outOfStock} whileTap={{ scale: 0.97 }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5 text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToCart
                    ? <motion.div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} />
                    : <ShoppingCart className="w-4 h-4" />
                  }
                  {outOfStock ? 'Out of Stock' : addingToCart ? 'Adding…' : 'Add to Cart'}
                </motion.button>

                <button onClick={handleWishlist}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${isWishlisted ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-tz-border text-tz-muted hover:border-tz-muted hover:text-tz-white'}`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              <TrustBadges />

              {/* Description */}
              <div className="mt-6 border-t border-tz-border pt-4">
                <button onClick={() => setDescOpen(o => !o)}
                  className="w-full flex items-center justify-between text-tz-white py-2">
                  <span className="font-medium">Product Description</span>
                  <motion.div animate={{ rotate: descOpen ? 180 : 0 }}>
                    <ChevronDown className="w-4 h-4 text-tz-muted" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {descOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden"
                    >
                      <p className="text-tz-muted text-sm leading-relaxed pb-4">
                        {product.description || 'No description available.'}
                      </p>
                      {(product.material || product.care || product.fit) && (
                        <div className="space-y-1.5 text-sm pb-4 border-t border-tz-border/40 pt-3">
                          {product.material && <p className="text-tz-muted"><span className="text-tz-white">Material:</span> {product.material}</p>}
                          {product.fit      && <p className="text-tz-muted"><span className="text-tz-white">Fit:</span> {product.fit}</p>}
                          {product.care     && <p className="text-tz-muted"><span className="text-tz-white">Care:</span> {product.care}</p>}
                          {product.gender   && <p className="text-tz-muted"><span className="text-tz-white">Gender:</span> {product.gender}</p>}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Meta */}
              <div className="mt-2 pt-4 border-t border-tz-border/50 text-tz-muted text-xs space-y-1">
                {product.slug && <p>SKU: <span className="text-tz-white">{product.slug}</span></p>}
                {categoryDisplay && (
                  <p>Category: <Link to={`/products?category=${categoryDisplay}`}
                    className="text-tz-white hover:text-tz-gold capitalize">{categoryDisplay}</Link></p>
                )}
              </div>
            </div>
          </div>

          {/* ── Reviews ── */}
          {reviews.length > 0 && (
            <div className="mt-16 border-t border-tz-border pt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold text-tz-white">Customer Reviews</h2>
                {avgRating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-tz-gold text-tz-gold" />
                    <span className="text-tz-white font-bold text-xl">{avgRating}</span>
                    <span className="text-tz-muted text-sm">/ 5</span>
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-tz-black/40 rounded-xl p-4 border border-tz-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-tz-gold text-tz-gold' : 'text-tz-border'}`} />
                        ))}
                      </div>
                      <span className="text-tz-muted text-xs">
                        Anonymous · {new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {r.title && <p className="text-tz-white text-sm font-medium mb-1">{r.title}</p>}
                    <p className="text-tz-muted text-sm leading-relaxed">{r.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recently Viewed ── */}
          <RecentlyViewed currentSlug={product.slug} />

          {/* ── Related Products (You May Also Like) ── */}
          <RelatedProducts currentProductSlug={product.slug} categorySlug={product.category_slug} />

        </div>
      </div>
    </>
  )
}