import LegalLayout, { Section } from '@/components/layout/LegalLayout'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RotateCcw, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

const STEPS = [
  { step: '01', title: 'Initiate Return',   desc: 'Log into your account, go to Orders, and click "Return Item" within 14 days of delivery.' },
  { step: '02', title: 'Pack Securely',     desc: 'Place the item(s) in the original packaging or any sturdy box with your order number.' },
  { step: '03', title: 'Drop Off',          desc: 'We\'ll send a prepaid label. Drop at any DTDC or Delhivery point — free pickup available in select cities.' },
  { step: '04', title: 'Refund Processed',  desc: 'Once received and inspected, your refund is processed within 5–7 business days.' },
]

export default function Returns() {
  return (
    <div className="page-container py-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <p className="eyebrow mb-3">Customer Care</p>
          <h1 className="font-display text-3xl text-tz-white font-light">Returns & Refunds</h1>
          <p className="text-sm text-tz-muted font-body mt-2">
            We want you to love what you bought. If you don't, we'll make it right.
          </p>
        </div>

        {/* Policy highlights */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: RotateCcw,    label: '14-Day Returns',   desc: 'From date of delivery' },
            { icon: CheckCircle,  label: 'Free Returns',     desc: 'No hidden charges'     },
            { icon: Clock,        label: '5–7 Day Refund',   desc: 'To original source'    },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-tz-dark border border-tz-border p-5 text-center">
              <Icon size={20} className="text-tz-gold mx-auto mb-3" />
              <p className="text-sm font-semibold text-tz-white font-body">{label}</p>
              <p className="text-xs text-tz-muted font-body mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* Steps */}
        <section className="mb-12">
          <h2 className="font-body text-sm font-semibold text-tz-white uppercase tracking-wider mb-6">
            How to Return
          </h2>

          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-5 bg-tz-dark border border-tz-border p-5"
              >
                <span className="font-display text-2xl text-tz-gold/30 font-light shrink-0">
                  {s.step}
                </span>

                <div>
                  <p className="text-sm font-semibold text-tz-white font-body mb-1">
                    {s.title}
                  </p>
                  <p className="text-xs text-tz-muted font-body leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Policy details */}
        <div className="space-y-6 mb-12">

          <section className="space-y-3">
            <h2 className="font-body text-sm font-semibold text-tz-white">
              Eligible for Return
            </h2>

            <UL items={[
              'Unused, unworn items with original tags attached',
              'Items in original packaging without damage',
              'Reported within 14 days of delivery',
              'Wrong size or colour received',
              'Defective or damaged on arrival',
            ]}/>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
              <h2 className="font-body text-sm font-semibold text-tz-white">
                Not Eligible for Return
              </h2>
            </div>

            <UL items={[
              'Items marked "Final Sale" or purchased during clearance',
              'Washed, worn, or altered items',
              'Items without original tags',
              'Innerwear and personal care items',
              'Items returned after 14 days from delivery',
            ]}/>
          </section>

          <section className="space-y-3">
            <h2 className="font-body text-sm font-semibold text-tz-white">
              Refund Methods
            </h2>

            <P>
              Refunds are credited to the original payment method. UPI and card refunds take 5–7 business days. COD orders are refunded to your bank account (NEFT) within 7–10 days — email your bank details to refunds@trendzip.in.
            </P>
          </section>

        </div>

        {/* CTA */}
        <div className="bg-tz-dark border border-tz-border p-6 text-center">
          <p className="text-sm text-tz-muted font-body mb-4">
            Need help with a return?
          </p>

          <div className="flex gap-3 justify-center">
            <Link to="/orders" className="btn-primary">
              Go to My Orders
            </Link>

            <Link to="/contact" className="btn-secondary">
              Contact Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}


/* ─── Local helpers (safe now because not imported anymore) ─── */

function P({ children }) {
  return (
    <p className="text-sm text-tz-muted font-body leading-relaxed">
      {children}
    </p>
  )
}

function UL({ items }) {
  return (
    <ul className="space-y-1.5 pl-4">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-tz-muted font-body flex items-start gap-2">
          <span className="text-tz-gold mt-1 shrink-0">·</span>
          {item}
        </li>
      ))}
    </ul>
  )
}