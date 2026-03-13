import { motion } from 'framer-motion'
import { Zap, Truck, RefreshCw, Shield } from 'lucide-react'

const VALUES = [
  {
    icon:  Zap,
    title: 'Premium Quality',
    desc:  'Every piece is crafted with premium fabrics sourced from trusted mills across India.',
  },
  {
    icon:  Truck,
    title: 'Fast Delivery',
    desc:  'Pan-India delivery in 2–5 business days. Free shipping on orders above ₹999.',
  },
  {
    icon:  RefreshCw,
    title: 'Easy Returns',
    desc:  '15-day hassle-free returns. No questions asked. Your satisfaction is our priority.',
  },
  {
    icon:  Shield,
    title: 'Secure Payments',
    desc:  'PCI-DSS compliant checkout. Pay with UPI, cards, net banking, or cash on delivery.',
  },
]

export default function BrandValues() {
  return (
    <section className="section-gap" aria-labelledby="values-heading">
      <div className="page-container">
        <div className="text-center mb-14">
          <p className="eyebrow mb-3">Why TrendZip</p>
          <h2 id="values-heading" className="heading-md">
            Built Different
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tz-border">
          {VALUES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-tz-black p-6 sm:p-8 group hover:bg-tz-dark transition-colors duration-300"
            >
              <div className="w-10 h-10 border border-tz-gold/30 flex items-center justify-center mb-5 group-hover:border-tz-gold group-hover:bg-tz-gold/5 transition-all duration-300">
                <Icon size={18} className="text-tz-gold" />
              </div>
              <h3 className="font-body text-sm font-semibold text-tz-white tracking-wide mb-2">
                {title}
              </h3>
              <p className="text-xs text-tz-muted leading-relaxed">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}