import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'

const HERO_SLIDES = [
  {
    id:       1,
    eyebrow:  'New Season · SS 2025',
    heading:  'Dress the\nBoldest You',
    sub:      'Premium streetwear built for the modern Indian.',
    cta:      { label: 'Shop New Arrivals', href: '/catalog?tag=new-arrival' },
    ctaSec:   { label: 'Explore Lookbook',  href: '/catalog' },
    bg:       'from-[#0f0d0b] via-[#1a1208] to-[#0a0a0a]',
    accent:   '#c9a96e',
    image:    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1400&q=85&auto=format&fit=crop',
    imageAlt: 'Model wearing TrendZip collection',
  },
]

export default function HeroSection() {
  const containerRef = useRef(null)
  const { scrollY }  = useScroll()

  // Parallax: image moves up slower than scroll
  const imageY = useTransform(scrollY, [0, 600], [0, 80])
  // Fade text out slightly as user scrolls
  const textOpacity = useTransform(scrollY, [0, 350], [1, 0])
  const textY       = useTransform(scrollY, [0, 350], [0, -40])

  const slide = HERO_SLIDES[0]

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] flex items-center overflow-hidden"
      aria-label="Hero section"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg}`} />

      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gold radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-tz-gold opacity-[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 page-container w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[100svh] py-24">

          {/* Text content */}
          <motion.div
            style={{ opacity: textOpacity, y: textY }}
            className="flex flex-col justify-center order-2 lg:order-1"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="flex items-center gap-3 mb-6"
            >
              <span className="w-8 h-px bg-tz-gold" />
              <p className="eyebrow">{slide.eyebrow}</p>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-light text-tz-white leading-[1.02] mb-6"
              style={{ fontSize: 'clamp(3.2rem, 7vw, 6rem)' }}
            >
              {slide.heading.split('\n').map((line, i) => (
                <span key={i} className="block">
                  {i === 1 ? (
                    <span className="text-gold-gradient">{line}</span>
                  ) : line}
                </span>
              ))}
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-tz-subtle text-lg font-light leading-relaxed mb-10 max-w-md"
            >
              {slide.sub}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                to={slide.cta.href}
                className="btn-primary-lg group"
              >
                {slide.cta.label}
                <ArrowRight
                  size={18}
                  className="ml-1 group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>
              <Link
                to={slide.ctaSec.href}
                className="btn-secondary group flex items-center gap-2"
              >
                <Play size={13} className="fill-current" />
                {slide.ctaSec.label}
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.8 }}
              className="flex items-center gap-8 mt-14 pt-8 border-t border-tz-border/50"
            >
              {[
                { value: '50K+',  label: 'Happy Customers' },
                { value: '800+',  label: 'Premium Styles'  },
                { value: '4.8★',  label: 'Avg. Rating'     },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="font-display text-2xl text-tz-white font-light">{stat.value}</p>
                  <p className="text-xs text-tz-muted tracking-wider uppercase mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero image */}
          <motion.div
            className="relative order-1 lg:order-2 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              style={{ y: imageY }}
              className="relative w-full max-w-[480px] mx-auto"
            >
              {/* Decorative frame */}
              <div className="absolute -inset-4 border border-tz-gold/10 pointer-events-none" />
              <div className="absolute -inset-8 border border-tz-gold/5 pointer-events-none" />

              {/* Gold corner accents */}
              {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                <span
                  key={i}
                  className={`absolute ${pos} w-6 h-6 border-tz-gold`}
                  style={{
                    borderTopWidth:    i < 2 ? '1px' : 0,
                    borderBottomWidth: i >= 2 ? '1px' : 0,
                    borderLeftWidth:   i % 2 === 0 ? '1px' : 0,
                    borderRightWidth:  i % 2 === 1 ? '1px' : 0,
                    borderColor: '#c9a96e',
                  }}
                />
              ))}

              {/* Image */}
              <div className="overflow-hidden aspect-[3/4] bg-tz-surface">
                <img
                  src={slide.image}
                  alt={slide.imageAlt}
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                  fetchpriority="high"
                />
              </div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="absolute -right-4 bottom-16 glass-gold px-4 py-3 shadow-gold-sm"
              >
                <p className="text-tz-gold text-xs font-body font-semibold tracking-widest uppercase mb-0.5">
                  New Drop
                </p>
                <p className="text-tz-white text-sm font-display font-light">
                  Summer '25
                </p>
              </motion.div>

              {/* Sale badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.4, type: 'spring' }}
                className="absolute -left-4 top-16 bg-tz-accent text-white px-3 py-1.5 text-xs font-body font-semibold tracking-widest uppercase"
              >
                Upto 50% Off
              </motion.div>
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-[10px] text-tz-muted tracking-[0.25em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="w-px h-8 bg-gradient-to-b from-tz-gold to-transparent"
        />
      </motion.div>
    </section>
  )
}