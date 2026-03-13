import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function PromoSection() {
  return (
    <section className="section-gap" aria-label="Promotional banners">
      <div className="page-container">
        <div className="grid md:grid-cols-2 gap-4">

          {/* Banner 1 — Men's */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link
              to="/catalog?gender=men"
              className="group relative block overflow-hidden aspect-[4/3] sm:aspect-[16/9] bg-tz-surface"
              aria-label="Shop Men's Collection"
            >
              <img
                src="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80&auto=format&fit=crop"
                alt="Men's Collection"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-7 sm:p-10">
                <p className="eyebrow mb-2 text-white/70">For Him</p>
                <h3 className="font-display text-3xl sm:text-4xl text-white font-light mb-4">
                  Men's Edit
                </h3>
                <span className="flex items-center gap-2 text-sm text-white/80 group-hover:text-tz-gold transition-colors font-body">
                  Shop Now
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Banner 2 — Women's */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link
              to="/catalog?gender=women"
              className="group relative block overflow-hidden aspect-[4/3] sm:aspect-[16/9] bg-tz-surface"
              aria-label="Shop Women's Collection"
            >
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80&auto=format&fit=crop"
                alt="Women's Collection"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 object-top"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-7 sm:p-10">
                <p className="eyebrow mb-2 text-white/70">For Her</p>
                <h3 className="font-display text-3xl sm:text-4xl text-white font-light mb-4">
                  Women's Edit
                </h3>
                <span className="flex items-center gap-2 text-sm text-white/80 group-hover:text-tz-gold transition-colors font-body">
                  Shop Now
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}