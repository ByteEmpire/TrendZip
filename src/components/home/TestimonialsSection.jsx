import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    id:      1,
    name:    'Priya Sharma',
    city:    'Mumbai',
    rating:  5,
    avatar:  'PS',
    text:    'Absolutely love the quality! The Onyx Oversized Tee is so comfortable and the fit is perfect. Will definitely order more.',
    product: 'Onyx Oversized Tee',
  },
  {
    id:      2,
    name:    'Arjun Mehta',
    city:    'Delhi',
    rating:  5,
    avatar:  'AM',
    text:    'TrendZip has the best streetwear in India. The cargo joggers are a game changer — premium quality at a fair price.',
    product: 'Ember Cargo Joggers',
  },
  {
    id:      3,
    name:    'Ananya Rao',
    city:    'Bangalore',
    rating:  5,
    avatar:  'AR',
    text:    'Delivery was super fast and the packaging is premium. The co-ord set looks even better in person. 10/10 would recommend.',
    product: 'Veil Sheer Co-ord Set',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="section-gap bg-tz-dark border-t border-tz-border" aria-labelledby="reviews-heading">
      <div className="page-container">

        <div className="text-center mb-14">
          <p className="eyebrow mb-3">Social Proof</p>
          <h2 id="reviews-heading" className="heading-md">
            What Our Customers Say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.55 }}
              className="bg-tz-surface border border-tz-border p-6 sm:p-7 hover:border-tz-gold/30 transition-colors duration-300 relative"
            >
              {/* Quote icon */}
              <Quote size={28} className="text-tz-gold/20 mb-5" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} size={13} className="text-tz-gold fill-tz-gold" />
                ))}
              </div>

              {/* Review text */}
              <p className="text-sm text-tz-text leading-relaxed mb-5 font-light">
                "{t.text}"
              </p>

              {/* Verified purchase tag */}
              <p className="text-[10px] text-tz-gold/70 tracking-widest uppercase mb-5">
                ✓ Verified Purchase · {t.product}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-tz-border">
                <div className="w-9 h-9 bg-tz-gold/10 border border-tz-gold/30 flex items-center justify-center font-body text-xs font-semibold text-tz-gold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-tz-white font-body">{t.name}</p>
                  <p className="text-xs text-tz-muted">{t.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Overall rating */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-tz-surface border border-tz-border px-6 py-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-tz-gold fill-tz-gold" />
              ))}
            </div>
            <span className="text-sm text-tz-white font-body font-medium">4.8 out of 5</span>
            <span className="text-xs text-tz-muted">·</span>
            <span className="text-xs text-tz-muted">Based on 2,400+ reviews</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
