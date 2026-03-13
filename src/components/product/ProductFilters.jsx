import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence }  from 'framer-motion'
import { X, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import {
  CLOTHING_SIZES, PRICE_RANGES, SORT_OPTIONS
} from '@/lib/constants'
import { parseQueryString, buildQueryString } from '@/lib/utils'

const COLORS = [
  { label: 'Black',  value: 'black',  hex: '#1a1a1a' },
  { label: 'White',  value: 'white',  hex: '#f5f0eb' },
  { label: 'Navy',   value: 'navy',   hex: '#1e2d4a' },
  { label: 'Brown',  value: 'brown',  hex: '#7c5c3e' },
  { label: 'Olive',  value: 'olive',  hex: '#5a6340' },
  { label: 'Grey',   value: 'grey',   hex: '#6b6b6b' },
  { label: 'Beige',  value: 'beige',  hex: '#d4b896' },
  { label: 'Red',    value: 'red',    hex: '#c0392b' },
]

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-tz-border pb-5 mb-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full mb-4 group"
        aria-expanded={open}
      >
        <span className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-tz-white">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`text-tz-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ProductFilters({ onClose, isDrawer = false }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const filters   = parseQueryString(location.search)

  function updateFilter(key, value) {
    const next = { ...filters, [key]: value, page: 1 }
    if (!value) delete next[key]
    navigate(`/catalog${buildQueryString(next)}`, { replace: true })
  }

  function toggleArrayFilter(key, value) {
    const current = filters[key]
      ? String(filters[key]).split(',').filter(Boolean)
      : []
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    updateFilter(key, next.length > 0 ? next.join(',') : null)
  }

  function clearAll() {
    navigate('/catalog', { replace: true })
  }

  const activeSizes  = filters.sizes  ? String(filters.sizes).split(',')  : []
  const activeColors = filters.colors ? String(filters.colors).split(',') : []
  const hasFilters   = Object.keys(filters).some(k => k !== 'sort' && k !== 'page')

  return (
    <div className={isDrawer ? 'h-full flex flex-col' : ''}>
      {/* Drawer header */}
      {isDrawer && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-tz-border shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-tz-gold" />
            <h2 className="font-display text-lg text-tz-white font-light">Filters</h2>
          </div>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button onClick={clearAll} className="text-xs text-tz-accent hover:text-tz-accent/80 font-body tracking-wider">
                Clear All
              </button>
            )}
            <button onClick={onClose} className="btn-icon">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className={`${isDrawer ? 'flex-1 overflow-y-auto p-5' : ''}`}>
        {/* Desktop header */}
        {!isDrawer && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-tz-gold" />
              <span className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-tz-white">Filters</span>
            </div>
            {hasFilters && (
              <button onClick={clearAll} className="text-xs text-tz-accent hover:underline font-body">
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Category */}
        <FilterSection title="Category">
          <div className="space-y-1">
            {[
              { label: 'All',         value: null         },
              { label: 'Tops',        value: 'tops'       },
              { label: 'Bottoms',     value: 'bottoms'    },
              { label: 'Dresses',     value: 'dresses'    },
              { label: 'Outerwear',   value: 'outerwear'  },
              { label: 'Co-ords',     value: 'co-ords'    },
              { label: 'Knitwear',    value: 'knitwear'   },
              { label: 'Accessories', value: 'accessories'},
            ].map(cat => (
              <button
                key={cat.label}
                onClick={() => updateFilter('category', cat.value)}
                className={`w-full text-left px-3 py-2 text-sm font-body transition-all duration-150 ${
                  filters.category === cat.value || (!filters.category && !cat.value)
                    ? 'text-tz-gold bg-tz-gold/5 border-l-2 border-tz-gold pl-[10px]'
                    : 'text-tz-muted hover:text-tz-text border-l-2 border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Gender */}
        <FilterSection title="Gender">
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'All',   value: null    },
              { label: 'Men',   value: 'men'   },
              { label: 'Women', value: 'women' },
              { label: 'Unisex',value: 'unisex'},
            ].map(g => (
              <button
                key={g.label}
                onClick={() => updateFilter('gender', g.value)}
                className={`px-4 py-1.5 text-xs font-body tracking-wider transition-all duration-150 border ${
                  filters.gender === g.value || (!filters.gender && !g.value)
                    ? 'bg-tz-gold text-tz-black border-tz-gold font-semibold'
                    : 'border-tz-border text-tz-muted hover:border-tz-border-2 hover:text-tz-text'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range">
          <div className="space-y-1">
            {[{ label: 'All Prices', min: null, max: null }, ...PRICE_RANGES].map(range => {
              const isActive =
                String(filters.minPrice ?? '') === String(range.min ?? '') &&
                String(filters.maxPrice ?? '') === String(range.max ?? '')
              return (
                <button
                  key={range.label}
                  onClick={() => {
                    updateFilter('minPrice', range.min)
                    updateFilter('maxPrice', range.max)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-body transition-all duration-150 ${
                    isActive
                      ? 'text-tz-gold bg-tz-gold/5 border-l-2 border-tz-gold pl-[10px]'
                      : 'text-tz-muted hover:text-tz-text border-l-2 border-transparent'
                  }`}
                >
                  {range.label}
                </button>
              )
            })}
          </div>
        </FilterSection>

        {/* Sizes */}
        <FilterSection title="Size">
          <div className="flex flex-wrap gap-2">
            {CLOTHING_SIZES.map(size => {
              const active = activeSizes.includes(size)
              return (
                <button
                  key={size}
                  onClick={() => toggleArrayFilter('sizes', size)}
                  className={`w-11 h-11 text-xs font-body font-medium border transition-all duration-150 ${
                    active
                      ? 'bg-tz-gold text-tz-black border-tz-gold'
                      : 'border-tz-border text-tz-muted hover:border-tz-gold/50 hover:text-tz-text'
                  }`}
                  aria-pressed={active}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </FilterSection>

        {/* Colors */}
        <FilterSection title="Color">
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map(color => {
              const active = activeColors.includes(color.value)
              return (
                <button
                  key={color.value}
                  onClick={() => toggleArrayFilter('colors', color.value)}
                  title={color.label}
                  aria-pressed={active}
                  aria-label={color.label}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all duration-150 ${
                    active ? 'border-tz-gold scale-110' : 'border-transparent hover:border-tz-border-2 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {active && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-white/80" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </FilterSection>
      </div>

      {/* Drawer apply button */}
      {isDrawer && (
        <div className="p-5 border-t border-tz-border shrink-0">
          <button onClick={onClose} className="btn-primary w-full justify-center">
            View Results
          </button>
        </div>
      )}
    </div>
  )
}