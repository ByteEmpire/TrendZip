import { motion } from 'framer-motion'
import { Download, ExternalLink, Mail } from 'lucide-react'

const COVERAGE = [
  {
    pub:     'Vogue India',
    title:   '"The D2C brands redefining Indian streetwear in 2024"',
    date:    'November 2024',
    url:     '#',
  },
  {
    pub:     'Forbes India',
    title:   '"10 Fashion Startups to Watch"',
    date:    'October 2024',
    url:     '#',
  },
  {
    pub:     'The Hindu',
    title:   '"How TrendZip is bringing premium basics to tier-2 India"',
    date:    'September 2024',
    url:     '#',
  },
  {
    pub:     'YourStory',
    title:   '"Zero markups, maximum quality: The TrendZip story"',
    date:    'August 2024',
    url:     '#',
  },
]

const ASSETS = [
  { name: 'Brand Logo (PNG, SVG)',    size: '2.4 MB' },
  { name: 'Product Photography Pack', size: '48 MB'  },
  { name: 'Founder Headshots',        size: '12 MB'  },
  { name: 'Brand Guidelines PDF',     size: '4.1 MB' },
]

export default function Press() {
  return (
    <div className="page-container py-16">
      <div className="max-w-3xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
          <p className="eyebrow mb-3">Media</p>
          <h1 className="font-display text-4xl text-tz-white font-light mb-4">Press & Media</h1>
          <p className="text-sm text-tz-muted font-body max-w-xl">
            For press enquiries, interviews, and partnership opportunities, contact our media team at{' '}
            <a href="mailto:press@trendzip.in" className="text-tz-gold hover:underline">press@trendzip.in</a>
          </p>
        </motion.div>

        {/* Coverage */}
        <section className="mb-12">
          <h2 className="font-body text-sm font-semibold text-tz-white uppercase tracking-wider mb-5">
            Recent Coverage
          </h2>
          <div className="space-y-3">
            {COVERAGE.map((item, i) => (
              <motion.a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start justify-between gap-4 bg-tz-dark border border-tz-border p-5 hover:border-tz-gold/40 transition-colors group"
              >
                <div>
                  <p className="text-[10px] text-tz-gold font-body font-bold tracking-widest uppercase mb-1">
                    {item.pub}
                  </p>
                  <p className="text-sm text-tz-text font-body group-hover:text-tz-white transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-tz-muted font-body mt-1">{item.date}</p>
                </div>
                <ExternalLink size={14} className="text-tz-muted group-hover:text-tz-gold transition-colors shrink-0 mt-1" />
              </motion.a>
            ))}
          </div>
        </section>

        {/* Brand assets */}
        <section className="mb-12">
          <h2 className="font-body text-sm font-semibold text-tz-white uppercase tracking-wider mb-5">
            Brand Assets
          </h2>
          <div className="bg-tz-dark border border-tz-border divide-y divide-tz-border/50">
            {ASSETS.map((asset, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-xs font-medium text-tz-text font-body">{asset.name}</p>
                  <p className="text-[10px] text-tz-muted font-body">{asset.size}</p>
                </div>
                <button className="flex items-center gap-1.5 text-xs text-tz-gold hover:text-tz-gold-light font-body transition-colors">
                  <Download size={12} />Download
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-tz-muted font-body mt-3">
            Assets are for editorial use only. Contact us for commercial licensing.
          </p>
        </section>

        {/* Contact */}
        <div className="bg-tz-dark border border-tz-gold/20 p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-tz-gold/10 border border-tz-gold/30 flex items-center justify-center shrink-0">
            <Mail size={16} className="text-tz-gold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-tz-white font-body mb-1">Media Enquiries</p>
            <p className="text-xs text-tz-muted font-body mb-3">
              We aim to respond to all press enquiries within 24 hours.
            </p>
            
            <a
              href="mailto:press@trendzip.in"
              className="inline-flex items-center gap-2 bg-tz-gold text-tz-black text-xs font-bold font-body px-4 py-2 hover:brightness-110 transition-all"
            >
              <Mail size={11} />press@trendzip.in
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}