import { useState, useEffect, useCallback } from 'react'
import { fetchMyOrders, fetchOrderById, cancelOrder } from '@/services/orderService'
import useAuthStore from '@/store/authStore'

export function useMyOrders() {
  const userId    = useAuthStore(s => s.user?.id)
  const [orders,    setOrders]    = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState(null)

  const load = useCallback(async () => {
    if (!userId) { setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchMyOrders(userId)
      setOrders(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return { orders, isLoading, error, refetch: load }
}

export function useOrder(orderId) {
  const userId    = useAuthStore(s => s.user?.id)
  const [order,     setOrder]     = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    if (!orderId || !userId) return
    setIsLoading(true)
    fetchOrderById(orderId, userId)
      .then(setOrder)
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [orderId, userId])

  async function cancel() {
    if (!order || !userId) return
    const updated = await cancelOrder(order.id, userId)
    setOrder(updated)
  }

  return { order, isLoading, error, cancel }
}