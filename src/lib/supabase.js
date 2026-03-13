import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[TrendZip] Supabase env vars missing. Copy .env.example to .env and fill in your credentials.'
  )
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
      storageKey:         'trendzip_auth',
    },
    global: {
      headers: { 'x-app-name': 'trendzip-frontend' },
    },
  }
)

export const TABLES = {
  USERS:            'users',
  ADDRESSES:        'addresses',
  CATEGORIES:       'categories',
  PRODUCTS:         'products',
  PRODUCT_VARIANTS: 'product_variants',
  ORDERS:           'orders',
  ORDER_ITEMS:      'order_items',
  WISHLIST_ITEMS:   'wishlist_items',
  REVIEWS:          'reviews',
}

export const BUCKETS = {
  PRODUCTS:   'product-images',
  AVATARS:    'avatars',
  CATEGORIES: 'category-images',
}

export function getStorageUrl(bucket, path) {
  if (!path) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl ?? null
}

export async function uploadFile(bucket, path, file, options = {}) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: true, ...options })
  if (error) throw error
  const url = getStorageUrl(bucket, data.path)
  return { path: data.path, url }
}
