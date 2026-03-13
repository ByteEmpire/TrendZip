import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'

import useCartStore, {
  useCartItems, useCartIsOpen, useCartTotalPrice, useCartIsEmpty, useCartActions
} from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'

export default function CartDrawer() {
  const isOpen    = useCartIsOpen()
  const items     = useCartItems()
  const total     = useCartTotalPrice()
  const isEmpty   = useCartIsEmpty()
  const { closeCart, removeItem, updateQuantity } = useCartActions()
  const overlayRef = useRef(null)

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') closeCart() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeCart])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/70 z-drawer backdrop-blur-sm"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-tz-dark border-l border-tz-border z-drawer flex flex-col shadow-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-tz-border shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} className="text-tz-gold" />
                <h2 className="font-display text-xl text-tz-white font-light">
                  Your Cart
                </h2>
                {!isEmpty && (
                  <span className="badge-gold ml-1">
                    {items.reduce((n, i) => n + i.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="btn-icon"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4">
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
                  <div className="w-20 h-20 border border-tz-border flex items-center justify-center">
                    <ShoppingBag size={32} className="text-tz-muted" />
                  </div>
                  <div>
                    <p className="font-display text-xl text-tz-white font-light mb-1">Your cart is empty</p>
                    <p className="text-sm text-tz-muted">Add something premium to get started.</p>
                  </div>
                  <button onClick={closeCart} className="btn-secondary mt-2">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <ul className="space-y-0 divide-y divide-tz-border/50">
                  <AnimatePresence initial={false}>
                    {items.map(item => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-4 px-6 py-4"
                      >
                        {/* Product image */}
                        <Link
                          to={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="shrink-0"
                        >
                          <div className="w-20 h-24 bg-tz-surface overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.slug}`}
                            onClick={closeCart}
                            className="font-body text-sm font-medium text-tz-text hover:text-tz-gold transition-colors line-clamp-2 leading-snug mb-1 block"
                          >
                            {item.name}
                          </Link>

                          {(item.size || item.color) && (
                            <p className="text-xs text-tz-muted mb-2">
                              {[item.size, item.color].filter(Boolean).join(' · ')}
                            </p>
                          )}

                          <p className="font-body text-sm font-semibold text-tz-gold mb-3">
                            {formatPrice(item.price)}
                          </p>

                          {/* Qty controls */}
                          <div className="flex items-center gap-0">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 border border-tz-border text-tz-muted hover:text-tz-text hover:border-tz-border-2 flex items-center justify-center transition-all duration-150"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-9 h-7 border-t border-b border-tz-border flex items-center justify-center text-xs font-medium text-tz-text">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 border border-tz-border text-tz-muted hover:text-tz-text hover:border-tz-border-2 flex items-center justify-center transition-all duration-150"
                              aria-label="Increase quantity"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="self-start mt-1 text-tz-muted hover:text-tz-accent transition-colors duration-150 p-1"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer with total and checkout */}
            {!isEmpty && (
              <div className="px-6 py-5 border-t border-tz-border bg-tz-black shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-tz-subtle font-body">Subtotal</span>
                  <span className="font-display text-xl text-tz-white font-light">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-tz-muted">Taxes and shipping calculated at checkout.</p>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="btn-primary-lg w-full justify-between group"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={closeCart}
                  className="w-full text-center text-xs text-tz-muted hover:text-tz-subtle transition-colors font-body tracking-wider uppercase py-1"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}