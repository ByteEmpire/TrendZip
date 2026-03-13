import { supabase } from '@/lib/supabase'

// ─── Fetch paginated + filtered products ─────────────────────
export async function fetchProducts({
  page       = 1,
  limit      = 12,
  category   = '',
  gender     = '',
  tags       = [],
  search     = '',
  minPrice   = 0,
  maxPrice   = 999999,
  sizes      = [],
  sort       = 'created_at_desc',
} = {}) {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .gte('sale_price', minPrice)
    .lte('sale_price', maxPrice)

  if (category) query = query.eq('category_slug', category)
  if (gender && gender !== 'all') query = query.eq('gender', gender)
  if (search) query = query.ilike('name', `%${search}%`)
  if (tags.length)  query = query.overlaps('tags', tags)
  if (sizes.length) query = query.overlaps('available_sizes', sizes)

  const sortMap = {
    created_at_desc : ['created_at',  { ascending: false }],
    price_asc       : ['sale_price',  { ascending: true  }],
    price_desc      : ['sale_price',  { ascending: false }],
    rating_desc     : ['rating_avg',  { ascending: false }],
    name_asc        : ['name',        { ascending: true  }],
  }
  const [col, opts] = sortMap[sort] ?? sortMap.created_at_desc
  query = query.order(col, opts)

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { products: data ?? [], total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) }
}

// ─── Single product by slug + variants ───────────────────────
export async function fetchProductBySlug(slug) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (error) throw error

  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    .order('size')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, users(full_name, avatar_url)')
    .eq('product_id', product.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return { product, variants: variants ?? [], reviews: reviews ?? [] }
}

// ─── Featured products for homepage ──────────────────────────
export async function fetchFeaturedProducts(limit = 8) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// ─── Related products (same category, exclude current) ───────
export async function fetchRelatedProducts(categorySlug, excludeId, limit = 4) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('category_slug', categorySlug)
    .neq('id', excludeId)
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// ─── All active categories ────────────────────────────────────
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

// ─── Autocomplete search ──────────────────────────────────────
export async function searchProducts(query, limit = 6) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, sale_price, images')
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .limit(limit)
  if (error) throw error
  return data ?? []
}