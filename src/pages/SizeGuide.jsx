import { useState }  from 'react'
import { motion }    from 'framer-motion'
import { Link }      from 'react-router-dom'
import { Ruler, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

const CHARTS = {
  tops: {
    label: 'Tops & Shirts',
    cols:  ['Size', 'Chest (in)', 'Waist (in)', 'Shoulder (in)', 'Length (in)'],
    rows: [
      ['XS', '32–33', '26–27', '14.5', '26'],
      ['S',  '34–35', '28–29', '15.5', '27'],
      ['M',  '36–37', '30–31', '16.5', '28'],
      ['L',  '38–39', '32–33', '17.5', '29'],
      ['XL', '40–41', '34–35', '18.5', '30'],
      ['XXL','42–43', '36–37', '19.5', '30.5'],
      ['3XL','44–46', '38–40', '20.5', '31'],
    ],
  },
  bottoms: {
    label: 'Bottoms & Trousers',
    cols:  ['Size', 'Waist (in)', 'Hip (in)', 'Inseam (in)', 'Rise (in)'],
    rows: [
      ['XS', '26–27', '34–35', '28', '9'],
      ['S',  '28–29', '36–37', '29', '9.5'],
      ['M',  '30–31', '38–39', '30', '10'],
      ['L',  '32–33', '40–41', '31', '10.5'],
      ['XL', '34–35', '42–43', '31', '11'],
      ['XXL','36–37', '44–46', '32', '11.5'],
      ['3XL','38–40', '46–48', '32', '12'],
    ],
  },
  dresses: {
    label: 'Dresses & Co-ords',
    cols:  ['Size', 'Bust (in)', 'Waist (in)', 'Hip (in)', 'Length (in)'],
    rows: [
      ['XS', '32–33', '25–26', '35–36', '50'],
      ['S',  '34–35', '27–28', '37–38', '51'],
      ['M',  '36–37', '29–30', '39–40', '52'],
      ['L',  '38–39', '31–32', '41–42', '53'],
      ['XL', '40–41', '33–34', '43–44', '53'],
      ['XXL','42–43', '35–36', '45–46', '54'],
    ],
  },
}

const TIPS = [
  { label: 'Chest / Bust', tip: 'Measure around the fullest part of your chest, tape parallel to the ground.' },
  { label: 'Waist',        tip: 'Measure around your natural waistline — the narrowest part of your torso.' },
  { label: 'Hip',          tip: 'Stand feet together, measure around the fullest part of your hips.' },
  { label: 'Shoulder',     tip: 'Measure from the outer edge of one shoulder to the other across the back.' },
  { label: 'Inseam',       tip: 'Measure from your crotch to where you want the hem to fall.' },
]

export default function SizeGuide() {
  const [active,  setActive]  = useState('tops')
  const [tipsOpen,setTipsOpen]= useState(false)
  const chart = CHARTS[active]

  return (
    <div className="page-container py-12">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-xs text-tz-muted hover:text-tz-gold font-body mb-8 transition-colors"
        >
          <ArrowLeft size={13} />Back to Catalog
        </Link>

        {/* Header */}
        <div className="mb-10">
          <p className="eyebrow mb-2">Fit Guide</p>
          <h1 className="font-display text-3xl text-tz-white font-light">Size Guide</h1>
          <p className="text-sm text-tz-muted font-body mt-2">
            All measurements in inches. When between sizes, we recommend sizing up.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-0 border-b border-tz-border mb-6">
          {Object.entries(CHARTS).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`px-5 py-3 text-xs font-body tracking-wide border-b-2 -mb-px transition-all ${
                active === key
                  ? 'border-tz-gold text-tz-gold'
                  : 'border-transparent text-tz-muted hover:text-tz-text'
              }`}
            >
              {label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Chart */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-tz-dark border border-tz-border p-5 mb-5"
        >
          <h2 className="text-sm font-semibold text-tz-white font-body mb-4">{chart.label}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="border-b border-tz-border">
                  {chart.cols.map(c => (
                    <th key={c} className="px-3 py-2.5 text-left text-[10px] text-tz-muted uppercase tracking-wider whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-tz-border/50">
                {chart.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-tz-surface/30 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className={`px-3 py-2.5 whitespace-nowrap ${
                        j === 0 ? 'font-bold text-tz-gold' : 'text-tz-text'
                      }`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* How to measure */}
        <div className="bg-tz-dark border border-tz-border">
          <button
            onClick={() => setTipsOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <Ruler size={15} className="text-tz-gold" />
              <span className="text-sm font-semibold text-tz-white font-body">How to Measure</span>
            </div>
            {tipsOpen
              ? <ChevronUp size={15} className="text-tz-muted" />
              : <ChevronDown size={15} className="text-tz-muted" />
            }
          </button>
          {tipsOpen && (
            <div className="border-t border-tz-border divide-y divide-tz-border/50">
              {TIPS.map(({ label, tip }) => (
                <div key={label} className="px-5 py-3.5">
                  <p className="text-xs font-semibold text-tz-gold font-body mb-0.5">{label}</p>
                  <p className="text-xs text-tz-muted font-body leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-tz-muted font-body mt-6">
          Measurements may vary slightly by garment. Check individual product pages for style-specific notes.
        </p>
      </div>
    </div>
  )
}