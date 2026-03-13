import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, ArrowRight, Star } from 'lucide-react'

import useCartStore     from '@/store/cartStore'
import useWishlistStore from '@/store/wishlistStore'
import { formatPrice, calcDiscount, getProductImage } from '@/lib/utils'

// ─── Mock data — replaced with Supabase query in Batch 5 ─────────────────────
const MOCK_PRODUCTS = [
  {
    id: '1', name: 'Onyx Oversized Tee', slug: 'onyx-oversized-tee',
    base_price: 1299, sale_price: 899, category: 'Tops',
    images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80&auto=format&fit=crop'],
    tags: ['new-arrival'], is_featured: true,
  },
  {
    id: '2', name: 'Ember Cargo Joggers', slug: 'ember-cargo-joggers',
    base_price: 2499, sale_price: 1799, category: 'Bottoms',
    images: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80&auto=format&fit=crop'],
    tags: ['best-seller'], is_featured: true,
  },
  {
    id: '3', name: 'Veil Sheer Co-ord Set', slug: 'veil-sheer-coord-set',
    base_price: 3499, sale_price: 3499, category: 'Co-ords',
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4c5f?w=600&q=80&auto=format&fit=crop'],
    tags: ['new-arrival'], is_featured: true,
  },
  {
    id: '4', name: 'Forge Leather Belt', slug: 'forge-leather-belt',
    base_price: 899, sale_price: 649, category: 'Accessories',
    images: ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80&auto=format&fit=crop'],
    tags: ['sale'], is_featured: true,
  },
  {
    id: '5', name: 'Slate Linen Shirt', slug: 'slate-linen-shirt',
    base_price: 1899, sale_price: 1899, category: 'Shirts',
    images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80&auto=format&fit=crop'],
    tags: ['premium'], is_featured: true,
  },
  {
    id: '6', name: 'Nova Knit Cardigan', slug: 'nova-knit-cardigan',
    base_price: 2199, sale_price: 1499, category: 'Knitwear',
    images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80&auto=format&fit=crop'],
    tags: ['sale'], is_featured: true,
  },
  {
    id: '7', name: 'Ash Wide Leg Trousers', slug: 'ash-wide-leg-trousers',
    base_price: 2899, sale_price: 2199, category: 'Bottoms',
    images: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80&auto=format&fit=crop'],
    tags: ['new-arrival'], is_featured: true,
  },
  {
    id: '8', name: 'Glow Metallic Crop Top', slug: 'glow-metallic-crop-top',
    base_price: 1199, sale_price: 799, category: 'Tops',
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80&auto=format&fit=crop'],
    tags: ['best-seller'], is_featured: true,
  },
]

const TABS = ['All', 'New Arrivals', 'Best Sellers', 'Sale']

function ProductCard({ product, index }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered,   setIsHovered]   = useState(false)

  const addItem        = useCartStore(s => s.addItem)
  const toggleItem     = useWishlistStore(s => s.toggleItem)
  const isWishlisted   = useWishlistStore(s => s.items.some(i => i.productId === product.id))

  const discount = calcDiscount(product.base_price, product.sale_price)
  const image    = getProductImage(product.images)

  function handleAddToCart(e) {
    e.preventDefault()
    addItem({
      productId: product.id,
      variantId: null,
      name:      product.name,
      slug:      product.slug,
      image:     image,
      price:     product.sale_price,
      quantity:  1,
      maxStock:  10,
    })
  }

  function handleWishlist(e) {
    e.preventDefault()
    toggleItem({
      productId: product.id,
      name:      product.name,
      slug:      product.slug,
      image:     image,
      price:     product.sale_price,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/products/${product.slug}`}
        className="card-product group block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`View ${product.name}`}
      >
        {/* Image container */}
        <div className="relative overflow-hidden aspect-[3/4] bg-tz-surface">
          {/* Skeleton */}
          {!imageLoaded && <div className="absolute inset-0 shimmer" />}

          <img
            src={image}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-700 ${
              isHovered ? 'scale-105' : 'scale-100'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="badge-sale">{discount}% Off</span>
            )}
            {product.tags?.includes('new-arrival') && (
              <span className="badge-new">New</span>
            )}
            {product.tags?.includes('best-seller') && (
              <span className="badge bg-tz-gold/90 text-tz-black">
                Best Seller
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all duration-200
              ${isWishlisted
                ? 'bg-tz-accent text-white opacity-100'
                : 'bg-tz-black/60 text-white opacity-0 group-hover:opacity-100'
              }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Quick add overlay */}
          <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}>
            <button
              onClick={handleAddToCart}
              className="w-full bg-tz-gold text-tz-black font-body text-xs font-semibold tracking-[0.15em] uppercase py-2.5 flex items-center justify-center gap-2 hover:bg-tz-gold-light transition-colors active:scale-[0.98]"
            >
              <ShoppingBag size={13} />
              Quick Add
            </button>
          </div>
        </div>

        {/* Product info */}
        <div className="p-3 sm:p-4">
          <p className="text-[10px] text-tz-muted tracking-widest uppercase mb-1 font-body">
            {product.category}
          </p>
          <h3 className="font-body text-sm text-tz-text font-medium group-hover:text-tz-white transition-colors duration-150 line-clamp-1 mb-2">
            {product.name}
          </h3>

          {/* Rating mock */}
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map(i => (
              <Star
                key={i}
                size={10}
                className={i <= 4 ? 'text-tz-gold fill-tz-gold' : 'text-tz-border fill-tz-border'}
              />
            ))}
            <span className="text-[10px] text-tz-muted ml-1">(24)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-semibold text-tz-white">
              {formatPrice(product.sale_price)}
            </span>
            {discount > 0 && (
              <span className="font-body text-xs text-tz-muted line-through">
                {formatPrice(product.base_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState('All')

  const filtered = MOCK_PRODUCTS.filter(p => {
    if (activeTab === 'All')          return true
    if (activeTab === 'New Arrivals') return p.tags?.includes('new-arrival')
    if (activeTab === 'Best Sellers') return p.tags?.includes('best-seller')
    if (activeTab === 'Sale')         return p.sale_price < p.base_price
    return true
  })

  return (
    <section className="section-gap" aria-labelledby="featured-heading">
      <div className="page-container">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-0 justify-between mb-10">
          <div>
            <p className="eyebrow mb-2">Handpicked</p>
            <h2 id="featured-heading" className="heading-md">
              Featured Products
            </h2>
          </div>

          {/* Tab pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-body text-xs tracking-wider uppercase px-4 py-2 transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-tz-gold text-tz-black font-semibold'
                    : 'text-tz-muted hover:text-tz-text border border-tz-border hover:border-tz-border-2'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="product-grid">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        {/* View all CTA */}
        <div className="text-center mt-12">
          <Link to="/catalog" className="btn-secondary inline-flex items-center gap-2 group">
            View All Products
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}