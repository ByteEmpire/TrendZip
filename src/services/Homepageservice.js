import { supabase } from '@/lib/supabase'

/**
 * Fetch all homepage settings as a flat object { key: value }
 */
export async function fetchHomepageSettings() {
  const { data, error } = await supabase
    .from('homepage_settings')
    .select('key, value')

  if (error) throw error
  return (data ?? []).reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})
}

/**
 * Upsert a single setting key
 */
export async function saveHomepageSetting(key, value) {
  const { error } = await supabase
    .from('homepage_settings')
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  if (error) throw error
}

/**
 * Fetch products by an ordered list of IDs (preserves order, filters inactive)
 */
export async function fetchProductsByIds(ids) {
  if (!ids?.length) return []
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, images, sale_price, base_price, available_sizes, status, tags')
    .in('id', ids)
    .eq('status', 'active')
  if (error) throw error
  // Maintain admin-defined order
  return ids.map(id => (data ?? []).find(p => p.id === id)).filter(Boolean)
}

/**
 * Fetch categories by an ordered list of IDs
 */
export async function fetchCategoriesByIds(ids) {
  if (!ids?.length) return []
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .in('id', ids)
  if (error) throw error
  return ids.map(id => (data ?? []).find(c => c.id === id)).filter(Boolean)
}