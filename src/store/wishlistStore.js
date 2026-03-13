import { create }  from 'zustand'
import { persist } from 'zustand/middleware'

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      // ─── Used by useWishlistSync to overwrite state from Supabase on login ───
      setItems: (items) => set({ items }),

      addItem: (item) => {
        const exists = get().items.some(i => i.productId === item.productId)
        if (exists) return
        set(s => ({
          items: [
            ...s.items,
            {
              id:        item.productId,
              productId: item.productId,
              name:      item.name,
              price:     item.price,
              image:     item.image ?? null,
              slug:      item.slug  ?? null,
              sizes:     item.sizes ?? item.available_sizes ?? [],
            },
          ],
        }))
      },

      removeItem: (productId) =>
        set(s => ({ items: s.items.filter(i => i.productId !== productId) })),

      toggleItem: (item) => {
        const exists = get().items.some(i => i.productId === item.productId)
        if (exists) get().removeItem(item.productId)
        else        get().addItem(item)
      },

      isInWishlist: (productId) =>
        get().items.some(i => i.productId === productId),

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name:       'trendzip-wishlist',
      partialize: s => ({ items: s.items }),
    }
  )
)

// Clear on sign-out
if (typeof window !== 'undefined') {
  window.addEventListener('auth:signout', () => {
    useWishlistStore.getState().clearWishlist()
  })
}

// ─── Selector hooks ───────────────────────────────────────────
export const useWishlistItems   = () => useWishlistStore(s => s.items)
export const useWishlistCount   = () => useWishlistStore(s => s.items.length)
export const useIsInWishlist    = (productId) =>
  useWishlistStore(s => s.items.some(i => i.productId === productId))
export const useWishlistActions = () => useWishlistStore(s => ({
  addItem:       s.addItem,
  removeItem:    s.removeItem,
  toggleItem:    s.toggleItem,
  isInWishlist:  s.isInWishlist,
  clearWishlist: s.clearWishlist,
}))

export default useWishlistStore