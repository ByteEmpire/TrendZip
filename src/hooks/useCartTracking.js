import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useCartItems, useCartTotalPrice } from '@/store/cartStore'
import useAuthStore from '@/store/authStore'

const DEBOUNCE_MS = 30_000  // 30 seconds — wait until user stops changing cart

export default function useCartTracking() {
  const items     = useCartItems()
  const total     = useCartTotalPrice()   // in paise (integers)
  const user      = useAuthStore(s => s.user)
  const timerRef  = useRef(null)
  const prevRef   = useRef(null)          // previous item count to detect real changes

  useEffect(() => {
    // Only track for logged-in users
    if (!user) return

    // Stringify for change comparison
    const signature = JSON.stringify(items.map(i => ({ id: i.id, qty: i.quantity, size: i.size })))
    if (signature === prevRef.current) return   // nothing changed
    prevRef.current = signature

    // Clear previous pending sync
    if (timerRef.current) clearTimeout(timerRef.current)

    // Debounce: wait 30s after last change before syncing
    timerRef.current = setTimeout(async () => {
      try {
        const session = await supabase.auth.getSession()
        const accessToken = session.data.session?.access_token
        if (!accessToken) return

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

        await fetch(`${supabaseUrl}/functions/v1/track-cart`, {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            items,
            cartTotal: total,   // already in paise
          }),
        })
      } catch {
        // Silently fail — this is non-critical background tracking
      }
    }, DEBOUNCE_MS)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [items, total, user])
}