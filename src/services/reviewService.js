import { supabase } from '@/lib/supabase'

/**
 * Fetch all reviews for a product (with reviewer name).
 */
export async function fetchProductReviews(productId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, users(full_name, avatar_url)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Check if the current user has a delivered order containing this product.
 * Returns the order_id if yes, null if not.
 */
export async function checkVerifiedPurchase(userId, productId) {
  const { data } = await supabase
    .from('order_items')
    .select('order_id, orders!inner(status, user_id)')
    .eq('product_id', productId)
    .eq('orders.user_id', userId)
    .eq('orders.status', 'delivered')
    .limit(1)
    .maybeSingle()

  return data?.order_id ?? null
}

/**
 * Check if the current user already reviewed this product.
 */
export async function fetchUserReview(userId, productId) {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  return data ?? null
}

/**
 * Submit a review. Supabase RLS enforces verified-buyer check server-side.
 */
export async function submitReview({ productId, userId, orderId, rating, title, body }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({ product_id: productId, user_id: userId, order_id: orderId, rating, title, body })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete the user's own review.
 */
export async function deleteReview(reviewId) {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  if (error) throw error
}