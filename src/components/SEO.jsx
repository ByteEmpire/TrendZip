// src/components/SEO.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Usage:
//   import SEO from '@/components/SEO'
//   <SEO title="Men's T-Shirts" description="Shop premium tees" />
//
// Setup (one-time, in main.jsx):
//   import { HelmetProvider } from 'react-helmet-async'
//   <HelmetProvider><App /></HelmetProvider>
//
// Install: npm install react-helmet-async
// ─────────────────────────────────────────────────────────────────────────────

import { Helmet } from 'react-helmet-async'

const SITE_NAME    = 'TrendZip'
const SITE_URL     = 'https://trendzip.in'  // ← update to your real domain
const DEFAULT_OG   = `${SITE_URL}/og-default.jpg`  // ← add a 1200×630 image to /public

export default function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  noIndex = false,
  product,  // optional: pass product object for rich product schema
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Premium Fashion`
  const metaDesc  = description ?? 'Shop the latest trends in fashion at TrendZip. Free delivery on orders above ₹999.'
  const metaImage = image ?? DEFAULT_OG
  const metaUrl   = url ?? (typeof window !== 'undefined' ? window.location.href : SITE_URL)

  // Build JSON-LD structured data
  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name:        product.name,
    description: product.description,
    image:       product.images ?? [],
    sku:         product.sku,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price:          product.price,
      availability:   product.inventory_count > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: metaUrl,
    },
    aggregateRating: product.avg_rating ? {
      '@type':       'AggregateRating',
      ratingValue:   product.avg_rating,
      reviewCount:   product.review_count ?? 1,
    } : undefined,
  } : null

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',     item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/catalog` },
      ...(product ? [{ '@type': 'ListItem', position: 3, name: product.name, item: metaUrl }] : []),
    ],
  }

  return (
    <Helmet>
      {/* ── Basic ──────────────────────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={metaUrl} />

      {/* ── Open Graph ─────────────────────────────────────────── */}
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image"       content={metaImage} />
      <meta property="og:url"         content={metaUrl} />
      <meta property="og:locale"      content="en_IN" />

      {/* ── Twitter Card ───────────────────────────────────────── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image"       content={metaImage} />

      {/* ── Product-specific OG ────────────────────────────────── */}
      {product && (
        <>
          <meta property="og:type"                content="product" />
          <meta property="product:price:amount"   content={String(product.price)} />
          <meta property="product:price:currency" content="INR" />
        </>
      )}

      {/* ── JSON-LD ────────────────────────────────────────────── */}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  )
}