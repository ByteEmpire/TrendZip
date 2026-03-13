import { supabase } from '@/lib/supabase'

// ─── Place a new order ────────────────────────────────────────
export async function placeOrder({ userId, cartItems, address, delivery, payment, subtotal }) {
  const deliveryCost = delivery === 'express' ? 149 : (subtotal >= 999 ? 0 : 79)
  const total        = subtotal + deliveryCost

  // 1. Create the order row
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id:          userId,
      status:           'pending',
      subtotal,
      delivery_charge:  deliveryCost,
      discount:         0,
      total,
      payment_method:   payment,
      address_snapshot: address,
    })
    .select()
    .single()

  if (orderError) throw orderError

  // 2. Insert order items
  const items = cartItems.map(item => ({
    order_id:   order.id,
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    name:       item.name,
    slug:       item.slug,
    image:      item.image,
    size:       item.size  ?? null,
    color:      item.color ?? null,
    price:      item.price,
    quantity:   item.quantity,
    subtotal:   item.price * item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(items)

  if (itemsError) throw itemsError

  return order
}

// ─── Fetch orders for current user ───────────────────────────
export async function fetchMyOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, total,
      delivery_charge, payment_method,
      created_at, tracking_number,
      order_items (
        id, name, slug, image, size, quantity, price
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── Fetch single order with full detail ─────────────────────
export async function fetchOrderById(orderId, userId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, name, slug, image,
        size, color, quantity, price, subtotal,
        product_id
      )
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

// ─── Cancel an order (only if pending) ───────────────────────
export async function cancelOrder(orderId, userId) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) throw error
  return data
}