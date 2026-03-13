import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

const CATEGORIES = [
  {
    label:    'Men',
    href:     '/catalog?gender=men',
    image:    'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80&auto=format&fit=crop',
    count:    '240+ styles',
    position: 'center top',
  },
  {
    label:    'Women',
    href:     '/catalog?gender=women',
    image:    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80&auto=format&fit=crop',
    count:    '380+ styles',
    position: 'center top',
  },
  {
    label:    'Accessories',
    href:     '/catalog?category=accessories',
    image:    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80&auto=format&fit=crop',
    count:    '120+ styles',
    position: 'center',
  },
  {
    label:    'Sale',
    href:     '/catalog?tag=sale',
    image:    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80&auto=format&fit=crop',
    count:    'Up to 50% off',
    position: 'center',
    badge:    'HOT',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden:   { opacity: 0, y: 24 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

export default function CategoryStrip() {
  return (
    <section className="section-gap" aria-labelledby="categories-heading">
      <div className="page-container">

        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="eyebrow mb-2">Explore</p>
            <h2 id="categories-heading" className="heading-md">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/catalog"
            className="hidden sm:flex items-center gap-2 text-sm text-tz-muted hover:text-tz-gold transition-colors group"
          >
            View All
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Category grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {CATEGORIES.map(cat => (
            <motion.div key={cat.label} variants={cardVariants}>
              <Link
                to={cat.href}
                className="group relative block overflow-hidden bg-tz-surface aspect-[3/4] sm:aspect-[2/3]"
                aria-label={`Shop ${cat.label}`}
              >
                {/* Image */}
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                  style={{ objectPosition: cat.position }}
                  loading="lazy"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Hot badge */}
                {cat.badge && (
                  <div className="absolute top-3 right-3 badge-sale text-[9px]">
                    {cat.badge}
                  </div>
                )}

                {/* Text */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <p className="font-display text-xl sm:text-2xl text-white font-light mb-0.5 group-hover:text-tz-gold transition-colors duration-300">
                    {cat.label}
                  </p>
                  <p className="text-xs text-white/60 tracking-wider">{cat.count}</p>

                  {/* Arrow that slides in on hover */}
                  <div className="flex items-center gap-2 mt-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-xs text-tz-gold tracking-widest uppercase font-body">Shop Now</span>
                    <ArrowUpRight size={12} className="text-tz-gold" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}