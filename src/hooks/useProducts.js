import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchProducts } from '@/services/productService'

export function useProducts() {
  const [searchParams] = useSearchParams()

  const params = {
    page:     parseInt(searchParams.get('page') || '1', 10),
    limit:    12,
    category: searchParams.get('category') || '',
    gender:   searchParams.get('gender')   || '',
    search:   searchParams.get('q')        || '',
    sort:     searchParams.get('sort')     || 'created_at_desc',
    minPrice: parseInt(searchParams.get('minPrice') || '0',      10),
    maxPrice: parseInt(searchParams.get('maxPrice') || '999999', 10),
    tags:     searchParams.getAll('tag'),
    sizes:    searchParams.getAll('size'),
  }

  const [products,   setProducts]   = useState([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchProducts(params)
      setProducts(result.products)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])  // re-run whenever URL params change

  useEffect(() => { load() }, [load])

  return { products, total, totalPages, isLoading, error, refetch: load, page: params.page }
}

export function useActiveFilters() {
  const [searchParams] = useSearchParams()
  const filters = {}
  const keys = ['category','gender','q','sort','minPrice','maxPrice']
  keys.forEach(k => { if (searchParams.get(k)) filters[k] = searchParams.get(k) })
  searchParams.getAll('tag').forEach(t  => { filters[`tag:${t}`]  = t  })
  searchParams.getAll('size').forEach(s => { filters[`size:${s}`] = s  })
  return filters
}