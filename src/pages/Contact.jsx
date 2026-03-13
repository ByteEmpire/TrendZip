import { useState }  from 'react'
import { motion }    from 'framer-motion'
import {
  Mail, Phone, MapPin, Clock,
  Send, Check, Loader2, AlertCircle
} from 'lucide-react'

const TOPICS = [
  'Order Issue',
  'Return / Refund',
  'Product Question',
  'Payment Issue',
  'Account Help',
  'Wholesale / B2B',
  'Press / Media',
  'Other',
]

export default function Contact() {
  const [form, setForm]     = useState({ name: '', email: '', topic: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sending, setSending]= useState(false)
  const [sent, setSent]     = useState(false)

  function validate() {
    const e = {}
    if (!form.name.trim())          e.name    = 'Name is required'
    if (!form.email.includes('@'))  e.email   = 'Valid email required'
    if (!form.topic)                e.topic   = 'Please select a topic'
    if (form.message.trim().length < 20) e.message = 'Please write at least 20 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSending(true)
    // Simulate send (wire to your email service / Supabase Edge Function)
    await new Promise(r => setTimeout(r, 1200))
    setSent(true)
    setSending(false)
  }

  function set_(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    setErrors(e => ({ ...e, [field]: null }))
  }

  if (sent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center page-container py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.1 }}
            className="w-16 h-16 bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <Check size={28} className="text-green-400" />
          </motion.div>
          <h2 className="font-display text-2xl text-tz-white font-light mb-3">Message Received!</h2>
          <p className="text-sm text-tz-muted font-body">
            We'll get back to you at <strong className="text-tz-white">{form.email}</strong> within 4 business hours.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page-container py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="eyebrow mb-3">Support</p>
          <h1 className="font-display text-3xl text-tz-white font-light">Get in Touch</h1>
          <p className="text-sm text-tz-muted font-body mt-2">
            We're a real team that reads every message. We aim to respond within 4 business hours.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-tz-dark border border-tz-border p-6 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-base">Your Name</label>
                <input
                  className="input-base w-full"
                  value={form.name}
                  onChange={e => set_('name', e.target.value)}
                  placeholder="Arjun Sharma"
                />
                {errors.name && <p className="text-xs text-tz-accent mt-1 font-body">{errors.name}</p>}
              </div>
              <div>
                <label className="label-base">Email Address</label>
                <input
                  type="email"
                  className="input-base w-full"
                  value={form.email}
                  onChange={e => set_('email', e.target.value)}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-xs text-tz-accent mt-1 font-body">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="label-base">Topic</label>
              <select
                className="input-base w-full cursor-pointer"
                value={form.topic}
                onChange={e => set_('topic', e.target.value)}
              >
                <option value="">Select a topic…</option>
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.topic && <p className="text-xs text-tz-accent mt-1 font-body">{errors.topic}</p>}
            </div>

            <div>
              <label className="label-base">Message</label>
              <textarea
                className="input-base w-full resize-none"
                rows={5}
                value={form.message}
                onChange={e => set_('message', e.target.value)}
                placeholder="Describe your issue or question in detail. Include your order number if relevant."
              />
              <div className="flex justify-between mt-1">
                {errors.message
                  ? <p className="text-xs text-tz-accent font-body">{errors.message}</p>
                  : <span />
                }
                <p className="text-[10px] text-tz-muted font-body">{form.message.length} chars</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-tz-gold text-tz-black text-sm font-bold font-body py-3.5 hover:brightness-110 disabled:opacity-60 transition-all"
            >
              {sending
                ? <><Loader2 size={15} className="animate-spin" />Sending…</>
                : <><Send size={15} />Send Message</>
              }
            </button>
          </motion.div>

          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {[
              {
                icon:  Mail,
                label: 'Email',
                value: 'support@trendzip.in',
                sub:   'General enquiries',
                href:  'mailto:support@trendzip.in',
              },
              {
                icon:  Phone,
                label: 'WhatsApp',
                value: '+91 98765 43210',
                sub:   'Mon–Sat, 10am–7pm IST',
                href:  'https://wa.me/919876543210',
              },
              {
                icon:  MapPin,
                label: 'Office',
                value: 'Mumbai, Maharashtra',
                sub:   'India 400001',
              },
              {
                icon:  Clock,
                label: 'Response Time',
                value: 'Within 4 hours',
                sub:   'Business days only',
              },
            ].map(({ icon: Icon, label, value, sub, href }) => (
              <div key={label} className="bg-tz-dark border border-tz-border p-5 flex items-start gap-4">
                <div className="w-9 h-9 bg-tz-gold/10 border border-tz-gold/20 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-tz-gold" />
                </div>
                <div>
                  <p className="text-[10px] text-tz-muted font-body uppercase tracking-widest mb-0.5">{label}</p>
                  {href
                    ? <a href={href} className="text-sm font-medium text-tz-white font-body hover:text-tz-gold transition-colors">{value}</a>
                    : <p className="text-sm font-medium text-tz-white font-body">{value}</p>
                  }
                  <p className="text-xs text-tz-muted font-body">{sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}