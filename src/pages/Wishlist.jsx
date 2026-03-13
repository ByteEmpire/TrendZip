import { useState }              from 'react'
import { Link }                  from 'react-router-dom'
import { motion, AnimatePresence }from 'framer-motion'
import { Heart, ShoppingBag, Trash2, Package } from 'lucide-react'
import useWishlistStore          from '@/store/wishlistStore'
import useCartStore              from '@/store/cartStore'
import useAuthStore              from '@/store/authStore'
import SizePickerModal           from '@/components/product/SizePickerModal'
import { formatPrice }           from '@/lib/utils'
import toast                     from 'react-hot-toast'

export default function Wishlist() {
  const items        = useWishlistStore(s => s.items)
  const removeItem   = useWishlistStore(s => s.removeItem)
  const addToCart    = useCartStore(s => s.addItem)
  const openCart     = useCartStore(s => s.openCart)
  const user         = useAuthStore(s => s.user)
  const openAuth     = useAuthStore(s => s.openAuth)

  // Which product is showing the size picker
  const [sizeTarget, setSizeTarget] = useState(null) // wishlist item

  function handleMoveToCart(item) {
    // If product has sizes, show picker
    if (item.sizes && item.sizes.length > 0) {
      setSizeTarget(item)
    } else {
      // No sizes — add directly
      confirmMoveToCart(item, null)
    }
  }

  function confirmMoveToCart(item, size) {
    addToCart({
      productId: item.productId,
      name:      item.name,
      price:     item.price,
      image:     item.image,
      slug:      item.slug,
      size,
      quantity:  1,
    })
    removeItem(item.productId)
    openCart()
    toast.success(`${item.name} moved to cart`)
    setSizeTarget(null)
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <Heart size={40} className="text-tz-muted mb-4" />
        <h2 className="font-display text-2xl text-tz-white font-light mb-2">Your Wishlist</h2>
        <p className="text-sm text-tz-muted font-body mb-6">Sign in to see your saved items.</p>
        <button onClick={() => openAuth('login')} className="btn-primary">Sign In</button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <Heart size={40} className="text-tz-muted mb-4" />
        <h2 className="font-display text-2xl text-tz-white font-light mb-2">Wishlist is empty</h2>
        <p className="text-sm text-tz-muted font-body mb-6">
          Save items you love by clicking the heart icon.
        </p>
        <Link to="/catalog" className="btn-primary">Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="page-container py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-tz-white font-light">My Wishlist</h1>
        <p className="text-xs text-tz-muted font-body mt-1">
          {items.length} saved item{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.div
              key={item.productId}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ delay: i * 0.05 }}
              className="bg-tz-dark border border-tz-border group"
            >
              {/* Image */}
              <Link to={`/products/${item.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-tz-surface">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-tz-muted" /></div>
                }
              </Link>

              {/* Info */}
              <div className="p-3 space-y-3">
                <div>
                  <Link to={`/products/${item.slug}`}>
                    <p className="text-xs font-medium text-tz-text font-body line-clamp-2 hover:text-tz-gold transition-colors">
                      {item.name}
                    </p>
                  </Link>
                  <p className="text-sm font-bold text-tz-gold font-body mt-1">
                    {formatPrice(item.price)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-tz-gold text-tz-black text-[10px] font-bold font-body py-2 hover:brightness-110 transition-all"
                  >
                    <ShoppingBag size={11} />
                    Move to Cart
                  </button>
                  <button
                    onClick={() => {
                      removeItem(item.productId)
                      toast.success('Removed from wishlist')
                    }}
                    className="w-8 h-8 flex items-center justify-center border border-tz-border text-tz-muted hover:text-tz-accent hover:border-tz-accent/40 transition-all"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Size picker modal */}
      <AnimatePresence>
        {sizeTarget && (
          <SizePickerModal
            product={{
              name:            sizeTarget.name,
              images:          sizeTarget.image ? [sizeTarget.image] : [],
              sale_price:      sizeTarget.price,
              available_sizes: sizeTarget.sizes ?? [],
            }}
            actionLabel="Move to Cart"
            onClose={() => setSizeTarget(null)}
            onConfirm={size => confirmMoveToCart(sizeTarget, size)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}