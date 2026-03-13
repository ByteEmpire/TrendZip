import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function SizePickerModal({
  product,
  onClose,
  onConfirm,
  actionLabel = 'Done',
}) {
  const [selected, setSelected] = useState(null)

  const sizes       = product?.available_sizes ?? product?.sizes ?? []
  const price       = product?.sale_price ?? product?.price ?? 0
  const origPrice   = product?.base_price ?? product?.original_price
  const image       = Array.isArray(product?.images) ? product.images[0] : product?.image
  const discount    = origPrice && origPrice > price
    ? Math.round(((origPrice - price) / origPrice) * 100)
    : 0
  const canConfirm  = sizes.length === 0 || selected !== null

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative w-full sm:max-w-sm bg-tz-dark border border-tz-border shadow-2xl z-10"
      >
        {/* Product row */}
        <div className="flex items-center gap-3 p-4 border-b border-tz-border">
          {image
            ? <div className="w-14 h-16 bg-tz-surface overflow-hidden shrink-0 border border-tz-border/50">
                <img src={image} alt={product?.name} className="w-full h-full object-cover" />
              </div>
            : <div className="w-14 h-16 bg-tz-surface shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-tz-white font-body line-clamp-2 leading-snug">
              {product?.name}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm font-bold text-tz-gold font-body">
                ₹{price?.toLocaleString('en-IN')}
              </span>
              {discount > 0 && origPrice && (
                <>
                  <span className="text-xs text-tz-muted line-through font-body">
                    ₹{origPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-bold text-green-400 font-body">
                    ({discount}% OFF)
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-tz-muted hover:text-tz-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sizes */}
        <div className="p-4">
          <p className="text-xs font-semibold text-tz-white font-body mb-3 uppercase tracking-widest">
            Select Size
          </p>

          {sizes.length === 0 ? (
            <p className="text-xs text-tz-muted font-body">One size — no selection needed</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelected(size)}
                  className={`w-12 h-12 rounded-full border-2 text-xs font-body font-medium transition-all ${
                    selected === size
                      ? 'border-tz-gold bg-tz-gold text-tz-black font-bold scale-105'
                      : 'border-tz-border text-tz-muted hover:border-tz-gold/60 hover:text-tz-text'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-4 pb-5 pt-1">
          <button
            onClick={() => canConfirm && onConfirm(selected)}
            disabled={!canConfirm}
            className={`w-full py-3.5 text-sm font-bold font-body tracking-wide transition-all ${
              canConfirm
                ? 'bg-tz-gold text-tz-black hover:brightness-110'
                : 'bg-tz-surface text-tz-muted cursor-not-allowed'
            }`}
          >
            {!canConfirm ? 'Select a Size First' : actionLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}