import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import ProductCardSkeleton from './ProductCardSkeleton'

export default function ProductGrid({ products, isLoading, view = 'grid', skeletonCount = 8 }) {
  if (isLoading) {
    return (
      <div className={view === 'list' ? 'space-y-3' : 'product-grid'}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} view={view} />
        ))}
      </div>
    )
  }

  if (!products?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 border border-tz-border flex items-center justify-center mb-5">
          <span className="text-2xl">🛍️</span>
        </div>
        <h3 className="font-display text-xl text-tz-white font-light mb-2">No products found</h3>
        <p className="text-sm text-tz-muted max-w-xs">
          Try adjusting your filters or search query to find what you're looking for.
        </p>
      </motion.div>
    )
  }

  return (
    <div className={view === 'list' ? 'space-y-3' : 'product-grid'}>
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          index={i}
          view={view}
        />
      ))}
    </div>
  )
}