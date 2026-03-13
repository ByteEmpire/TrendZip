import { useEffect } from 'react'
import { supabase }  from '@/lib/supabase'
import useAuthStore  from '@/store/authStore'
import useWishlistStore from '@/store/wishlistStore'

/**
 * Call this once inside Layout.jsx.
 * When a user logs in, their server wishlist overwrites local state.
 * When they add/remove items, both local store and Supabase are updated.
 */
export function useWishlistSync() {
  const user     = useAuthStore(s => s.user)
  const setItems = useWishlistStore(s => s.setItems)

  useEffect(() => {
    if (!user?.id) return

    async function syncFromServer() {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('product_id, products(id, name, slug, sale_price, images)')
        .eq('user_id', user.id)

      if (error || !data) return

      const items = data.map(row => ({
        productId: row.product_id,
        name:      row.products?.name      ?? '',
        slug:      row.products?.slug      ?? '',
        price:     row.products?.sale_price ?? 0,
        image:     row.products?.images?.[0] ?? '',
        addedAt:   new Date().toISOString(),
      }))

      setItems(items)
    }

    syncFromServer()
  }, [user?.id])
}

// ─── Call when toggling wishlist in ProductDetail / ProductCard ───
export async function syncWishlistAdd(userId, productId) {
  if (!userId) return
  await supabase
    .from('wishlist_items')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' })
}

export async function syncWishlistRemove(userId, productId) {
  if (!userId) return
  await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
}