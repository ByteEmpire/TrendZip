import { create }   from 'zustand'
import { persist }  from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items:  [],
      isOpen: false,

      addItem: (item) => {
        const existing = get().items.find(
          i => i.productId === item.productId && i.size === item.size
        )
        if (existing) {
          set(s => ({
            items: s.items.map(i =>
              i.productId === item.productId && i.size === item.size
                ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                : i
            ),
          }))
        } else {
          set(s => ({
            items: [
              ...s.items,
              {
                id:        `${item.productId}-${item.size ?? 'ns'}-${Date.now()}`,
                productId: item.productId,
                name:      item.name,
                price:     item.price,
                image:     item.image ?? null,
                slug:      item.slug  ?? null,
                size:      item.size  ?? null,
                quantity:  item.quantity ?? 1,
              },
            ],
          }))
        }
      },

      removeItem:     (id)           => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      updateQuantity: (id, qty)      => {
        if (qty <= 0) { get().removeItem(id); return }
        set(s => ({ items: s.items.map(i => i.id === id ? { ...i, quantity: qty } : i) }))
      },
      clearCart:  ()  => set({ items: [] }),
      openCart:   ()  => set({ isOpen: true  }),
      closeCart:  ()  => set({ isOpen: false }),
      toggleCart: ()  => set(s => ({ isOpen: !s.isOpen })),
    }),
    {
      name:        'trendzip-cart',
      partialize:  s => ({ items: s.items }),
    }
  )
)

// Clear on sign-out
if (typeof window !== 'undefined') {
  window.addEventListener('auth:signout', () => {
    useCartStore.getState().clearCart()
  })
}

// ─── Selector hooks ───────────────────────────────────────────
export const useCartItems      = () => useCartStore(s => s.items)
export const useCartIsOpen     = () => useCartStore(s => s.isOpen)
export const useCartItemCount  = () => useCartStore(s => s.items.reduce((t, i) => t + i.quantity, 0))
export const useCartTotalPrice = () => useCartStore(s => s.items.reduce((t, i) => t + i.price * i.quantity, 0))
export const useCartIsEmpty    = () => useCartStore(s => s.items.length === 0)
export const useCartActions    = () => useCartStore(s => ({
  addItem:        s.addItem,
  removeItem:     s.removeItem,
  updateQuantity: s.updateQuantity,
  clearCart:      s.clearCart,
  openCart:       s.openCart,
  closeCart:      s.closeCart,
  toggleCart:     s.toggleCart,
}))

export default useCartStore