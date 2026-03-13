import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, ArrowRight, Briefcase } from 'lucide-react'

const OPENINGS = [
  {
    title: 'Senior Frontend Engineer',
    team: 'Engineering',
    type: 'Full-time',
    location: 'Mumbai / Remote',
    desc: 'Build the next version of trendzip.in — React, TypeScript, performance obsessed.',
  },
  {
    title: 'Brand Designer',
    team: 'Creative',
    type: 'Full-time',
    location: 'Mumbai',
    desc: 'Own visual identity across campaigns, product launches, packaging and social.',
  },
  {
    title: 'Buying & Merchandising Manager',
    team: 'Product',
    type: 'Full-time',
    location: 'Mumbai',
    desc: 'Source and curate seasonal collections with our production partners across India.',
  },
  {
    title: 'Customer Experience Lead',
    team: 'Operations',
    type: 'Full-time',
    location: 'Bangalore / Remote',
    desc: 'Build and lead our CX team. Turn every customer interaction into a brand moment.',
  },
  {
    title: 'Content Creator (Fashion)',
    team: 'Marketing',
    type: 'Contract',
    location: 'Remote',
    desc: 'Create editorial and social-first content that aligns with the TrendZip aesthetic.',
  },
]

const PERKS = [
  'Competitive salary + ESOP for senior roles',
  'Remote-first culture with quarterly Mumbai meetups',
  'Generous clothing allowance (obviously)',
  'Health insurance for you and your family',
  '26 days of annual leave + all national holidays',
  'Learning budget of ₹50,000/year',
]

export default function Careers() {
  const [active, setActive] = useState(null)

  return (
    <div className="page-container py-16">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
        >
          <p className="eyebrow mb-3">Join Us</p>

          <h1 className="font-display text-4xl text-tz-white font-light mb-4">
            Build the future<br />of Indian fashion
          </h1>

          <p className="text-sm text-tz-muted font-body leading-relaxed max-w-xl">
            We're a small, high-ownership team building something we're genuinely proud of.
            If you care about craft, move fast, and want your work to matter — we'd love to meet you.
          </p>
        </motion.div>

        {/* Perks */}
        <div className="bg-tz-dark border border-tz-border p-6 mb-10">
          <h2 className="font-body text-sm font-semibold text-tz-white mb-4">
            Why TrendZip
          </h2>

          <div className="grid sm:grid-cols-2 gap-2">
            {PERKS.map((perk, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-tz-muted font-body"
              >
                <span className="text-tz-gold mt-0.5 shrink-0">✦</span>
                {perk}
              </div>
            ))}
          </div>
        </div>

        {/* Openings */}
        <h2 className="font-body text-sm font-semibold text-tz-white mb-4 uppercase tracking-wider">
          Open Positions ({OPENINGS.length})
        </h2>

        <div className="space-y-3">
          {OPENINGS.map((job, i) => (
            <div
              key={job.title}
              className="border border-tz-border bg-tz-dark overflow-hidden"
            >
              {/* Job header */}
              <button
                onClick={() => setActive(active === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-tz-surface/30 transition-colors"
                aria-expanded={active === i}
              >
                <div>
                  <p className="text-sm font-semibold text-tz-white font-body mb-1">
                    {job.title}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-tz-muted font-body">
                      {job.team}
                    </span>

                    <span className="text-[10px] text-tz-muted border border-tz-border px-2 py-0.5 font-body">
                      {job.type}
                    </span>

                    <span className="text-[10px] text-tz-muted border border-tz-border px-2 py-0.5 font-body">
                      {job.location}
                    </span>
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: active === i ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight size={16} className="text-tz-muted shrink-0 ml-4" />
                </motion.div>
              </button>

              {/* Job description */}
              {active === i && (
                <div className="px-5 pb-5 border-t border-tz-border pt-4">
                  <p className="text-sm text-tz-muted font-body leading-relaxed mb-4">
                    {job.desc}
                  </p>

                  <a
                    href={`mailto:careers@trendzip.in?subject=Application: ${job.title}`}
                    className="inline-flex items-center gap-2 bg-tz-gold text-tz-black text-xs font-bold font-body px-5 py-2.5 hover:brightness-110 transition-all"
                  >
                    Apply for this role
                    <ArrowRight size={12} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Generic CTA */}
        <div className="mt-8 p-6 bg-tz-surface border border-tz-border text-center">
          <Briefcase size={20} className="text-tz-gold mx-auto mb-3" />

          <p className="text-sm font-semibold text-tz-white font-body mb-1">
            Don't see your role?
          </p>

          <p className="text-xs text-tz-muted font-body mb-4">
            We're always open to exceptional people. Send your portfolio to{' '}
            <a
              href="mailto:careers@trendzip.in"
              className="text-tz-gold hover:underline"
            >
              careers@trendzip.in
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}