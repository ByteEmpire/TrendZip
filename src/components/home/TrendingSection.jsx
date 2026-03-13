import { useRef } from 'react'
import { Link }   from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, TrendingUp } from 'lucide-react'
import { formatPrice, calcDiscount, getProductImage } from '@/lib/utils'

const TRENDING = [
  { id: 't1', name: 'Obsidian Bomber Jacket', slug: 'obsidian-bomber-jacket', base_price: 4999, sale_price: 3499, images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80&auto=format&fit=crop'] },
  { id: 't2', name: 'Cream Ribbed Tank',      slug: 'cream-ribbed-tank',      base_price: 799,  sale_price: 599,  images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80&auto=format&fit=crop'] },
  { id: 't3', name: 'Indigo Wide Jeans',      slug: 'indigo-wide-jeans',      base_price: 2999, sale_price: 2199, images: ['https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=500&q=80&auto=format&fit=crop'] },
  { id: 't4', name: 'Sand Utility Vest',      slug: 'sand-utility-vest',      base_price: 1799, sale_price: 1799, images: ['https://images.unsplash.com/photo-1608518108721-3f40ba0a6cc0?w=500&q=80&auto=format&fit=crop'] },
  { id: 't5', name: 'Noir Trench Coat',       slug: 'noir-trench-coat',       base_price: 6999, sale_price: 4999, images: ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&q=80&auto=format&fit=crop'] },
]

export default function TrendingSection() {
  const scrollRef = useRef(null)

  function scroll(dir) {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }

  return (
    <section className="section-gap bg-tz-dark border-y border-tz-border" aria-labelledby="trending-heading">
      <div className="page-container">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-tz-gold" />
            <div>
              <p className="eyebrow mb-1">Right Now</p>
              <h2 id="trending-heading" className="heading-md">Trending</h2>
            </div>
          </div>

          {/* Scroll buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll(-1)}
              className="w-9 h-9 border border-tz-border text-tz-muted hover:text-tz-text hover:border-tz-border-2 flex items-center justify-center transition-all duration-150"
              aria-label="Scroll left"
            >
              <ArrowLeft size={15} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-9 h-9 border border-tz-border text-tz-muted hover:text-tz-text hover:border-tz-border-2 flex items-center justify-center transition-all duration-150"
              aria-label="Scroll right"
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
        >
          {TRENDING.map((product, i) => {
            const discount = calcDiscount(product.base_price, product.sale_price)
            const image    = getProductImage(product.images)

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="shrink-0 w-[220px] sm:w-[240px]"
              >
                <Link
                  to={`/products/${product.slug}`}
                  className="card-product group block"
                >
                  <div className="relative aspect-[3/4] bg-tz-surface overflow-hidden">
                    <img
                      src={image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {discount > 0 && (
                      <span className="absolute top-2.5 left-2.5 badge-sale">
                        {discount}% Off
                      </span>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent h-20" />
                  </div>

                  <div className="p-3">
                    <h3 className="font-body text-xs font-medium text-tz-text group-hover:text-tz-white transition-colors line-clamp-1 mb-1.5">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-tz-white font-body">
                        {formatPrice(product.sale_price)}
                      </span>
                      {discount > 0 && (
                        <span className="text-xs text-tz-muted line-through font-body">
                          {formatPrice(product.base_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}