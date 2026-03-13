import { Link }    from 'react-router-dom'
import { motion }  from 'framer-motion'
import { Clock, ArrowRight, Tag } from 'lucide-react'

const POSTS = [
  {
    slug:     'how-to-build-a-capsule-wardrobe',
    category: 'Style Guide',
    title:    'How to Build a Capsule Wardrobe That Actually Works',
    excerpt:  'Stop buying clothes and start building a wardrobe. Here\'s the exact framework we use when designing our seasonal collections.',
    date:     'Jan 18, 2025',
    readTime: '6 min read',
    image:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=70&auto=format&fit=crop',
    featured: true,
  },
  {
    slug:     'fabric-guide-cotton-types',
    category: 'Materials',
    title:    'The Definitive Guide to Cotton: GSM, Combed vs Carded, and Why It Matters',
    excerpt:  'Not all cotton is created equal. Learn why 240 GSM ring-spun cotton feels so different from what most brands use.',
    date:     'Jan 12, 2025',
    readTime: '8 min read',
    image:    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=70&auto=format&fit=crop',
  },
  {
    slug:     'care-guide-make-clothes-last',
    category: 'Care Guide',
    title:    '7 Habits That Will Make Your Clothes Last Years Longer',
    excerpt:  'The best sustainable fashion choice is extending the life of what you already own. Here\'s how.',
    date:     'Jan 5, 2025',
    readTime: '4 min read',
    image:    'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&q=70&auto=format&fit=crop',
  },
  {
    slug:     'oversized-fit-guide',
    category: 'Style Guide',
    title:    'The Oversized Fit Guide: How to Wear Relaxed Silhouettes Effortlessly',
    excerpt:  'Oversized doesn\'t mean shapeless. These are the proportions and styling tricks that make it work.',
    date:     'Dec 28, 2024',
    readTime: '5 min read',
    image:    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=70&auto=format&fit=crop',
  },
  {
    slug:     'india-streetwear-rising',
    category: 'Culture',
    title:    'The Rise of Indian Streetwear: Why This Decade Belongs to Us',
    excerpt:  'From Mumbai to Hyderabad, a generation of designers is building something that doesn\'t borrow from anyone.',
    date:     'Dec 20, 2024',
    readTime: '7 min read',
    image:    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=70&auto=format&fit=crop',
  },
]

const CATEGORIES = ['All', 'Style Guide', 'Materials', 'Care Guide', 'Culture', 'Behind the Brand']

export default function Blog() {
  const [featured, ...rest] = POSTS
  const [activeCat, setActiveCat] = require('react').useState('All')
  const filtered = activeCat === 'All' ? rest : rest.filter(p => p.category === activeCat)

  return (
    <div className="page-container py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <p className="eyebrow mb-3">Editorial</p>
          <h1 className="font-display text-4xl text-tz-white font-light">The TrendZip Journal</h1>
          <p className="text-sm text-tz-muted font-body mt-3">Style, craft, culture — written for people who care about clothes.</p>
        </motion.div>

        {/* Featured post */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-tz-dark border border-tz-border overflow-hidden mb-10 group"
        >
          <div className="grid md:grid-cols-2">
            <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
              <img
                src={featured.image}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <span className="text-[10px] text-tz-gold font-body font-bold tracking-widest uppercase mb-3">
                Featured · {featured.category}
              </span>
              <h2 className="font-display text-2xl text-tz-white font-light leading-snug mb-4">
                {featured.title}
              </h2>
              <p className="text-sm text-tz-muted font-body leading-relaxed mb-5">{featured.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-tz-muted font-body">
                  <span>{featured.date}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock size={9} />{featured.readTime}</span>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-tz-gold font-body hover:gap-2.5 transition-all">
                  Read <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 text-xs font-body whitespace-nowrap border transition-all ${
                activeCat === cat
                  ? 'border-tz-gold bg-tz-gold/10 text-tz-gold'
                  : 'border-tz-border text-tz-muted hover:border-tz-border-2 hover:text-tz-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Post grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-tz-dark border border-tz-border group overflow-hidden"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <span className="text-[9px] text-tz-gold font-body font-bold tracking-widest uppercase">
                  {post.category}
                </span>
                <h3 className="font-body text-sm font-semibold text-tz-white mt-2 mb-2 line-clamp-2 group-hover:text-tz-gold transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-tz-muted font-body line-clamp-2 leading-relaxed mb-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-[10px] text-tz-muted font-body">
                  <span>{post.date}</span>
                  <span className="flex items-center gap-1"><Clock size={9} />{post.readTime}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  )
}