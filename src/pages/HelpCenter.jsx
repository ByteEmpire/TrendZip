import { useState }  from 'react'
import { Link }      from 'react-router-dom'
import { motion }    from 'framer-motion'
import { Search, ChevronDown, ChevronUp, Package, CreditCard, RotateCcw, User, Truck } from 'lucide-react'

const FAQS = {
  orders: {
    icon: Package,
    label: 'Orders',
    items: [
      { q: 'How do I track my order?', a: 'Log into your account and go to "My Orders". You\'ll see the real-time status and tracking number once your order has shipped. You\'ll also receive an SMS with the tracking link.' },
      { q: 'Can I change or cancel my order?', a: 'Orders can be cancelled within 1 hour of placement if they haven\'t been processed. Go to My Orders → select order → Cancel. For changes, please contact support immediately at support@trendzip.in.' },
      { q: 'What if I receive the wrong item?', a: 'We\'re sorry! Email us at support@trendzip.in with your order number and a photo. We\'ll send the correct item and arrange a free pickup of the wrong one within 48 hours.' },
      { q: 'How long does delivery take?', a: 'Standard delivery: 4–6 business days. Express delivery: 1–2 business days. Delivery times may vary for remote pin codes. You\'ll receive an estimated delivery date in your confirmation email.' },
    ],
  },
  payments: {
    icon: CreditCard,
    label: 'Payments',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept UPI (GPay, PhonePe, Paytm, BHIM), all major debit/credit cards, net banking via Razorpay, and Cash on Delivery (COD) for eligible pin codes.' },
      { q: 'Is it safe to pay on TrendZip?', a: 'Absolutely. All card and net banking payments are processed by Razorpay, a PCI-DSS certified payment gateway. We never store your card details.' },
      { q: 'My payment failed but money was deducted. What now?', a: 'In cases where payment is deducted but the order isn\'t confirmed, the amount is automatically refunded within 5–7 business days. If not, email us with your UPI reference or bank statement.' },
    ],
  },
  returns: {
    icon: RotateCcw,
    label: 'Returns',
    items: [
      { q: 'What is the return policy?', a: 'We accept returns within 14 days of delivery for unworn, unwashed items with original tags. Returns are free — we provide a prepaid shipping label.' },
      { q: 'How long do refunds take?', a: 'Once we receive and inspect the return (usually 2–3 days after pickup), refunds are processed within 5–7 business days to your original payment method.' },
      { q: 'Can I exchange for a different size?', a: 'Yes! Email us at support@trendzip.in with your order number and desired size. We\'ll confirm availability and arrange an exchange. The original item must be returned first.' },
    ],
  },
  account: {
    icon: User,
    label: 'Account',
    items: [
      { q: 'How do I reset my password?', a: 'Click "Sign In" → "Forgot Password" and enter your email. You\'ll receive a reset link within 2 minutes. Check your spam folder if you don\'t see it.' },
      { q: 'Can I use TrendZip without creating an account?', a: 'You can browse and add to cart as a guest, but checkout requires an account. Creating one takes under a minute and lets you track orders, save wishlists, and get faster checkout.' },
      { q: 'How do I delete my account?', a: 'Email privacy@trendzip.in from your registered email with subject "Account Deletion Request". We\'ll process it within 7 days and confirm via email.' },
    ],
  },
}

function FAQSection({ section }) {
  const [open, setOpen] = useState(null)
  const Icon = section.icon
  return (
    <div className="bg-tz-dark border border-tz-border">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-tz-border">
        <Icon size={15} className="text-tz-gold" />
        <h2 className="font-body text-sm font-semibold text-tz-white">{section.label}</h2>
      </div>
      <div className="divide-y divide-tz-border/50">
        {section.items.map((item, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm text-tz-text font-body pr-4">{item.q}</span>
              {open === i
                ? <ChevronUp size={14} className="text-tz-gold shrink-0" />
                : <ChevronDown size={14} className="text-tz-muted shrink-0" />
              }
            </button>
            {open === i && (
              <div className="px-5 pb-5">
                <p className="text-xs text-tz-muted font-body leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HelpCenter() {
  const [search, setSearch] = useState('')

  const allFaqs = Object.values(FAQS).flatMap(s => s.items)
  const filtered = search
    ? allFaqs.filter(f =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      )
    : null

  return (
    <div className="page-container py-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <p className="eyebrow mb-3">Support</p>
          <h1 className="font-display text-4xl text-tz-white font-light mb-4">Help Center</h1>
          <p className="text-sm text-tz-muted font-body mb-6">Find answers to common questions, or reach our team directly.</p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-tz-muted" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for answers…"
              className="input-base w-full pl-11 py-3"
            />
          </div>
        </motion.div>

        {/* Search results */}
        {filtered && (
          <div className="bg-tz-dark border border-tz-border mb-8">
            <p className="px-5 py-3 text-xs text-tz-muted font-body border-b border-tz-border">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
            </p>
            {filtered.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-tz-muted font-body">
                No results found. Try different keywords or{' '}
                <Link to="/contact" className="text-tz-gold hover:underline">contact us</Link>.
              </p>
            ) : (
              <div className="divide-y divide-tz-border/50">
                {filtered.map((f, i) => (
                  <div key={i} className="px-5 py-4">
                    <p className="text-sm font-medium text-tz-white font-body mb-1">{f.q}</p>
                    <p className="text-xs text-tz-muted font-body leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAQ sections */}
        {!filtered && (
          <div className="space-y-5">
            {Object.values(FAQS).map((section, i) => (
              <motion.div
                key={section.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <FAQSection section={section} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-10 bg-tz-dark border border-tz-border p-6 text-center">
          <p className="text-sm font-semibold text-tz-white font-body mb-1">Still need help?</p>
          <p className="text-xs text-tz-muted font-body mb-5">Our support team replies within 4 business hours.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/contact" className="btn-primary">Contact Support</Link>
            <a href="mailto:support@trendzip.in" className="btn-secondary">support@trendzip.in</a>
          </div>
        </div>
      </div>
    </div>
  )
}