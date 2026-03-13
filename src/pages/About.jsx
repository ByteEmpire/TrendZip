import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Heart, Leaf, Zap, Users } from 'lucide-react'

const VALUES = [
  {
    icon: Heart,
    title: 'Craft Over Quantity',
    desc: 'Every piece is designed intentionally. We release fewer styles, made better, so you build a wardrobe that lasts.',
  },
  {
    icon: Leaf,
    title: 'Conscious Materials',
    desc: 'We prioritise organic cotton, recycled fibres, and low-impact dyes. Fashion should not cost the earth.',
  },
  {
    icon: Zap,
    title: 'Direct to You',
    desc: 'No middlemen. We design, produce, and ship directly — better quality at honest prices.',
  },
  {
    icon: Users,
    title: 'Community First',
    desc: 'Built by a small team in Mumbai. We listen to our community and design what they actually want to wear.',
  },
]

const TEAM = [
  { name: 'Aryan Mehta',    role: 'Co-founder & Creative Director', city: 'Mumbai'    },
  { name: 'Priya Sharma',   role: 'Co-founder & Head of Operations', city: 'Bangalore' },
  { name: 'Dev Kapoor',     role: 'Head of Product',                 city: 'Mumbai'    },
  { name: 'Nisha Iyer',     role: 'Head of Sustainability',          city: 'Chennai'   },
]

export default function About() {
  return (
    <div className="page-container py-16">
      <div className="max-w-4xl mx-auto">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <p className="eyebrow mb-4">Our Story</p>
          <h1 className="font-display text-5xl text-tz-white font-light leading-tight mb-6">
            Dressed for the<br />life you're building
          </h1>
          <p className="text-base text-tz-muted font-body max-w-xl mx-auto leading-relaxed">
            TrendZip was born in 2023 out of frustration — fast fashion that falls apart, 
            luxury brands that price out most people, and nothing in between worth wearing. 
            We set out to change that.
          </p>
        </motion.div>

        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="font-display text-2xl text-tz-white font-light">How it started</h2>
            <p className="text-sm text-tz-muted font-body leading-relaxed">
              Aryan and Priya met at a textile fair in Surat and spent the next six months 
              visiting manufacturers across Gujarat and Tamil Nadu. What they found surprised them — 
              world-class production facilities making clothes for global luxury brands, with the 
              capacity to produce far better quality than what was reaching Indian consumers.
            </p>
            <p className="text-sm text-tz-muted font-body leading-relaxed">
              TrendZip launched with 8 styles in September 2023. We sold out in 11 days. 
              That told us everything we needed to know — the demand for quality, honest 
              fashion in India was real and waiting.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3"
          >
            {['500+', '12', '4', '100%'].map((stat, i) => (
              <div key={i} className="bg-tz-dark border border-tz-border p-5 text-center">
                <p className="font-display text-3xl text-tz-gold font-light">{stat}</p>
                <p className="text-xs text-tz-muted font-body mt-1">
                  {['styles launched', 'cities delivered', 'production partners', 'quality tested'][i]}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="font-display text-2xl text-tz-white font-light text-center mb-10">What we stand for</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-tz-dark border border-tz-border p-6"
              >
                <v.icon size={20} className="text-tz-gold mb-4" />
                <h3 className="font-body text-sm font-semibold text-tz-white mb-2">{v.title}</h3>
                <p className="text-xs text-tz-muted font-body leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <h2 className="font-display text-2xl text-tz-white font-light text-center mb-10">The team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-tz-dark border border-tz-border p-5"
              >
                <div className="w-12 h-12 bg-tz-gold/10 border border-tz-gold/30 flex items-center justify-center mb-4">
                  <span className="font-display text-lg text-tz-gold font-light">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <p className="text-xs font-semibold text-tz-white font-body">{member.name}</p>
                <p className="text-[10px] text-tz-muted font-body mt-0.5">{member.role}</p>
                <p className="text-[10px] text-tz-muted/60 font-body mt-0.5">{member.city}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-tz-dark border border-tz-border p-10 text-center">
          <h2 className="font-display text-2xl text-tz-white font-light mb-3">Ready to shop?</h2>
          <p className="text-sm text-tz-muted font-body mb-6">New drops every two weeks. No noise, just good clothes.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/catalog" className="btn-primary flex items-center gap-2">
              Browse Collection <ArrowRight size={14} />
            </Link>
            <Link to="/contact" className="btn-secondary">Get in Touch</Link>
          </div>
        </div>
      </div>
    </div>
  )
}