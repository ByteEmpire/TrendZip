import { useState }              from 'react'
import { Link }                  from 'react-router-dom'
import { motion, AnimatePresence }from 'framer-motion'
import { Heart, ShoppingBag, Package } from 'lucide-react'
import useWishlistStore          from '@/store/wishlistStore'
import useCartStore              from '@/store/cartStore'
import useAuthStore              from '@/store/authStore'
import SizePickerModal           from '@/components/product/SizePickerModal'
import { formatPrice }           from '@/lib/utils'
import toast                     from 'react-hot-toast'

export default function ProductCard({ product, index = 0 }) {
  const user           = useAuthStore(s => s.user)
  const openAuth       = useAuthStore(s => s.openAuth)

  // Wishlist state — checks real-time if this product is saved
  const isInWishlist   = useWishlistStore(s =>
    s.items.some(i => i.productId === (product.id ?? product.productId))
  )
  const toggleWishlist = useWishlistStore(s => s.toggleItem)

  const addToCart      = useCartStore(s => s.addItem)
  const openCart       = useCartStore(s => s.openCart)

  const [showPicker, setShowPicker] = useState(false)

  const id    = product.id ?? product.productId
  const name  = product.name
  const slug  = product.slug
  const image = product.images?.[0] ?? product.image
  const price = product.sale_price ?? product.price ?? 0
  const orig  = product.base_price ?? product.original_price
  const sizes = product.available_sizes ?? product.sizes ?? []
  const discount = orig && orig > price
    ? Math.round(((orig - price) / orig) * 100)
    : 0

  function handleWishlist(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { openAuth('login'); return }
    toggleWishlist({
      productId: id,
      name, price, image, slug,
      sizes,
    })
    if (isInWishlist) {
      toast.success('Removed from wishlist')
    } else {
      toast.success('Added to wishlist')
    }
  }

  function handleQuickAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { openAuth('login'); return }

    // Always show size picker (even for "one size") so user confirms
    if (sizes.length > 0) {
      setShowPicker(true)
    } else {
      // No sizes defined — add directly
      addToCart({ productId: id, name, price, image, slug, size: null, quantity: 1 })
      openCart()
      toast.success(`${name} added to cart`)
    }
  }

  function confirmAdd(size) {
    addToCart({ productId: id, name, price, image, slug, size, quantity: 1 })
    openCart()
    toast.success(`${name} (${size ?? 'One Size'}) added to cart`)
    setShowPicker(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        className="group relative bg-tz-dark border border-tz-border hover:border-tz-border-2 transition-colors"
      >
        {/* Image */}
        <Link to={`/products/${slug}`} className="block relative aspect-[3/4] overflow-hidden bg-tz-surface">
          {image
            ? <img
                src={image}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            : <div className="w-full h-full flex items-center justify-center">
                <Package size={28} className="text-tz-muted" />
              </div>
          }

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.tags?.includes('new-arrival') && (
              <span className="text-[9px] font-bold tracking-widest uppercase bg-tz-gold text-tz-black px-1.5 py-0.5">
                New
              </span>
            )}
            {discount > 0 && (
              <span className="text-[9px] font-bold tracking-widest uppercase bg-tz-accent text-white px-1.5 py-0.5">
                -{discount}%
              </span>
            )}
          </div>

          {/* Quick Add — appears on hover */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-tz-black/90 border-t border-tz-border text-tz-white text-[10px] font-bold font-body tracking-widest uppercase py-2.5 flex items-center justify-center gap-2 hover:bg-tz-gold hover:text-tz-black hover:border-tz-gold transition-colors"
            >
              <ShoppingBag size={12} />
              Quick Add
            </button>
          </div>
        </Link>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center transition-all z-10 ${
            isInWishlist
              ? 'bg-tz-accent text-white border border-tz-accent'
              : 'bg-tz-dark/80 text-tz-muted hover:text-tz-accent hover:bg-tz-dark border border-tz-border/50'
          }`}
        >
          <Heart
            size={14}
            className={isInWishlist ? 'fill-white' : ''}
            strokeWidth={isInWishlist ? 0 : 1.5}
          />
        </button>

        {/* Info */}
        <div className="p-3">
          <Link to={`/products/${slug}`}>
            <p className="text-xs font-medium text-tz-text font-body line-clamp-2 hover:text-tz-gold transition-colors mb-2">
              {name}
            </p>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-tz-gold font-body">
              {formatPrice(price)}
            </span>
            {orig && orig > price && (
              <span className="text-[10px] text-tz-muted line-through font-body">
                {formatPrice(orig)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Size Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <SizePickerModal
            product={product}
            actionLabel="Add to Cart"
            onClose={() => setShowPicker(false)}
            onConfirm={confirmAdd}
          />
        )}
      </AnimatePresence>
    </>
  )
}