import { Link }  from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function LegalLayout({ title, subtitle, updated, children }) {
  return (
    <div className="page-container py-12">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-tz-muted hover:text-tz-gold font-body mb-8 transition-colors"
        >
          <ArrowLeft size={13} /> Back to TrendZip
        </Link>

        <div className="mb-10 pb-8 border-b border-tz-border">
          <p className="eyebrow mb-2">Legal</p>
          <h1 className="font-display text-3xl text-tz-white font-light">{title}</h1>
          {subtitle && (
            <p className="text-sm text-tz-muted font-body mt-2">{subtitle}</p>
          )}
          {updated && (
            <p className="text-xs text-tz-muted/60 font-body mt-3">Last updated: {updated}</p>
          )}
        </div>

        <div className="prose-tz space-y-8">{children}</div>
      </div>
    </div>
  )
}

// Shared prose components
export function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="font-body text-base font-semibold text-tz-white">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

export function P({ children }) {
  return <p className="text-sm text-tz-muted font-body leading-relaxed">{children}</p>
}

export function UL({ items }) {
  return (
    <ul className="space-y-1.5 pl-4">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-tz-muted font-body leading-relaxed flex gap-2">
          <span className="text-tz-gold mt-1 shrink-0">–</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}