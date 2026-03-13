// src/pages/admin/HomepageEditor.jsx
// FIXED: Check was missing from imports (caused render crash)
// ADDED: Hero link type — product | collection | custom URL
// ADDED: Festive / Special Offer section in hero — links to a collection slug
// ADDED: Inline category image editing — no need to leave the page
// ADDED: CTA button text customisation in hero

import { useState, useEffect } from 'react'
import {
  Image, Star, TrendingUp, LayoutGrid, MessageSquare,
  Bell, Save, Loader2, Search, X, ChevronUp, ChevronDown,
  Plus, Trash2, Eye, EyeOff, Check, Link2, Upload,
  ExternalLink, Sparkles, Tag, ArrowRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast        from 'react-hot-toast'

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { key: 'hero',         label: 'Hero Banner',       icon: Image         },
  { key: 'featured',     label: 'Featured Products', icon: Star          },
  { key: 'trending',     label: 'Trending Now',      icon: TrendingUp    },
  { key: 'categories',   label: 'Shop by Category',  icon: LayoutGrid    },
  { key: 'testimonials', label: 'Testimonials',      icon: MessageSquare },
  { key: 'announcement', label: 'Announcement Bar',  icon: Bell          },
]

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomepageEditor() {
  const [tab,        setTab]        = useState('hero')
  const [settings,   setSettings]   = useState({})
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [{ data: settingsData }, { data: productsData }, { data: catsData }] =
        await Promise.all([
          supabase.from('homepage_settings').select('key, value'),
          supabase
            .from('products')
            .select('id, name, slug, images, sale_price, base_price, is_active')
            .eq('is_active', true)
            .order('name'),
          supabase.from('categories').select('id, name, slug, image_url').order('name'),
        ])

      setSettings((settingsData ?? []).reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {}))
      setProducts(productsData ?? [])
      setCategories(catsData ?? [])
    } catch {
      toast.error('Failed to load homepage settings')
    } finally {
      setLoading(false)
    }
  }

  async function saveSetting(key, value) {
    const { error } = await supabase
      .from('homepage_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) throw error
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Called from CategoriesEditor when an image is updated inline
  function updateCategoryImage(id, url) {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, image_url: url } : c))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="text-tz-gold animate-spin" size={24} />
      </div>
    )
  }

  const sharedProps = { settings, products, categories, onSave: saveSetting }

  const ActiveEditor = {
    hero:         HeroEditor,
    featured:     FeaturedEditor,
    trending:     TrendingEditor,
    categories:   (props) => <CategoriesEditor {...props} onCategoryImageUpdate={updateCategoryImage} />,
    testimonials: TestimonialsEditor,
    announcement: AnnouncementEditor,
  }[tab]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-tz-white font-light">Homepage Editor</h1>
        <p className="text-xs text-tz-muted font-body mt-1">
          All changes go live immediately when saved. Visit the homepage to preview.
        </p>
      </div>

      <div className="flex gap-5">
        {/* Sidebar */}
        <aside className="w-44 shrink-0">
          <div className="bg-tz-dark border border-tz-border overflow-hidden sticky top-6">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-3.5 text-left text-xs font-body transition-all border-b border-tz-border/60 last:border-0 ${
                  tab === t.key
                    ? 'bg-tz-gold/10 text-tz-gold border-l-2 border-l-tz-gold'
                    : 'text-tz-muted hover:text-tz-text hover:bg-tz-surface/30 border-l-2 border-l-transparent'
                }`}
              >
                <t.icon size={12} className="shrink-0" />
                {t.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Editor panel */}
        <div className="flex-1 min-w-0">
          <ActiveEditor {...sharedProps} />
        </div>
      </div>
    </div>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────
function SectionCard({ title, description, children }) {
  return (
    <div className="bg-tz-dark border border-tz-border p-6 space-y-5">
      <div className="pb-4 border-b border-tz-border">
        <h2 className="font-body text-base font-semibold text-tz-white">{title}</h2>
        {description && <p className="text-xs text-tz-muted font-body mt-1">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SaveBtn({ saving, onClick, disabled }) {
  return (
    <div className="pt-4 border-t border-tz-border">
      <button
        onClick={onClick}
        disabled={saving || disabled}
        className="btn-primary flex items-center gap-2 disabled:opacity-50 text-sm"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

// ─── Hero editor ──────────────────────────────────────────────────────────────
function HeroEditor({ settings, products, onSave }) {
  const init = settings.hero ?? {}
  const [form, setForm] = useState({
    product_id:    init.product_id    ?? '',
    headline:      init.headline      ?? '',
    subheading:    init.subheading    ?? '',
    badge:         init.badge         ?? '',
    season:        init.season        ?? '',
    discount_text: init.discount_text ?? '',
    cta_text:      init.cta_text      ?? 'Shop Now',
    // Link override — 'product' (default), 'collection', 'url'
    link_type:     init.link_type     ?? 'product',
    link_url:      init.link_url      ?? '',
  })
  const [search,  setSearch]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [showAll, setShowAll] = useState(false)

  const selected    = products.find(p => p.id === form.product_id) ?? null
  const displayList = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : showAll ? products.slice(0, 20) : []

  async function handleSave() {
    setSaving(true)
    try {
      await onSave('hero', form)
      toast.success('Hero banner saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Hero Banner"
        description="The full-width banner at the top of your homepage. Select a product for its image, then choose where clicking the banner leads."
      >
        {/* ── Product picker ── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-tz-white font-body">
            Hero Image Source <span className="text-tz-muted font-normal">(select a product to use its photo)</span>
          </p>

          {selected ? (
            <div className="flex items-center gap-3 p-3 bg-tz-surface border border-tz-gold/40">
              {selected.images?.[0] && (
                <img src={selected.images[0]} alt={selected.name}
                  className="w-14 h-16 object-cover border border-tz-border shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-tz-white font-body line-clamp-1">{selected.name}</p>
                <p className="text-[10px] text-tz-gold font-body mt-0.5">
                  ₹{(selected.sale_price ?? selected.base_price)?.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, product_id: '' }))}
                className="text-tz-muted hover:text-tz-accent transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-tz-border bg-tz-surface/30 text-center">
              <p className="text-xs text-tz-muted font-body">No product selected — search and pick one below</p>
            </div>
          )}

          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowAll(false) }}
              onFocus={() => { if (!search) setShowAll(true) }}
              placeholder="Search products by name…"
              className="input-base w-full pl-8 text-xs"
            />
            {(search || showAll) && (
              <button
                onClick={() => { setSearch(''); setShowAll(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-muted hover:text-tz-text"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {(search || showAll) && displayList.length > 0 && (
            <div className="border border-tz-border bg-tz-dark max-h-52 overflow-y-auto divide-y divide-tz-border/40">
              {displayList.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setForm(f => ({ ...f, product_id: p.id })); setSearch(''); setShowAll(false) }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-tz-surface/50 transition-colors text-left"
                >
                  {p.images?.[0] && (
                    <img src={p.images[0]} alt={p.name}
                      className="w-9 h-10 object-cover border border-tz-border/50 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-tz-text font-body line-clamp-1">{p.name}</p>
                    <p className="text-[10px] text-tz-muted font-body">
                      ₹{(p.sale_price ?? p.base_price)?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {p.id === form.product_id && <Check size={11} className="text-tz-gold ml-auto shrink-0" />}
                </button>
              ))}
              {products.length > 20 && !search && (
                <p className="p-2.5 text-xs text-tz-muted text-center font-body">
                  Showing first 20 — type to search all {products.length}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Text overlays ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-base">Headline</label>
            <input className="input-base w-full" value={form.headline}
              onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
              placeholder="New Season Arrivals" />
          </div>
          <div>
            <label className="label-base">Subheading</label>
            <input className="input-base w-full" value={form.subheading}
              onChange={e => setForm(f => ({ ...f, subheading: e.target.value }))}
              placeholder="Premium fashion, delivered direct" />
          </div>
          <div>
            <label className="label-base">Top Badge <span className="text-tz-muted">(e.g. "NEW DROP")</span></label>
            <input className="input-base w-full" value={form.badge}
              onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
              placeholder="NEW DROP" />
          </div>
          <div>
            <label className="label-base">Season Label</label>
            <input className="input-base w-full" value={form.season}
              onChange={e => setForm(f => ({ ...f, season: e.target.value }))}
              placeholder="Summer '25" />
          </div>
          <div>
            <label className="label-base">Discount Badge <span className="text-tz-muted">(top-left, red)</span></label>
            <input className="input-base w-full" value={form.discount_text}
              onChange={e => setForm(f => ({ ...f, discount_text: e.target.value }))}
              placeholder="UPTO 50% OFF" />
          </div>
          <div>
            <label className="label-base">CTA Button Text</label>
            <input className="input-base w-full" value={form.cta_text}
              onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))}
              placeholder="Shop Now" />
          </div>
        </div>

        <SaveBtn saving={saving} onClick={handleSave} />
      </SectionCard>

      {/* ── Hero click destination (separate card) ── */}
      <HeroLinkEditor form={form} setForm={setForm} onSave={onSave} />
    </div>
  )
}

// ─── Hero Link / Festive Offer Editor ────────────────────────────────────────
function HeroLinkEditor({ form, setForm, onSave }) {
  const [saving, setSaving] = useState(false)

  const LINK_TYPES = [
    {
      value: 'product',
      label: 'Product Page',
      icon: ArrowRight,
      desc: 'Clicking the hero goes to the selected product\'s page',
    },
    {
      value: 'collection',
      label: 'Collection Page',
      icon: Tag,
      desc: 'Link to /new-in, /trending, /sale — or any /c/:slug',
    },
    {
      value: 'url',
      label: 'Custom URL / Offer',
      icon: Sparkles,
      desc: 'Link to a festive offer, catalog page, or any URL',
    },
  ]

  const COLLECTION_SHORTCUTS = [
    { label: 'New In',  value: '/c/new-in'   },
    { label: 'Trending',value: '/c/trending' },
    { label: 'Sale',    value: '/c/sale'     },
  ]

  async function handleSave() {
    setSaving(true)
    try {
      await onSave('hero', {
        ...form,
        link_type: form.link_type,
        link_url:  form.link_url,
      })
      toast.success('Hero link saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard
      title="Hero Click Destination"
      description="Where does clicking the hero banner take the customer? Use 'Custom URL / Offer' for festive sales, Diwali offers, etc."
    >
      {/* Link type selector */}
      <div className="grid sm:grid-cols-3 gap-3">
        {LINK_TYPES.map(lt => (
          <button
            key={lt.value}
            onClick={() => setForm(f => ({ ...f, link_type: lt.value }))}
            className={`p-3.5 border text-left transition-all rounded-lg ${
              form.link_type === lt.value
                ? 'border-tz-gold/60 bg-tz-gold/5 text-tz-gold'
                : 'border-tz-border text-tz-muted hover:border-tz-muted hover:text-tz-text'
            }`}
          >
            <lt.icon size={14} className="mb-2" />
            <p className="text-xs font-semibold font-body">{lt.label}</p>
            <p className="text-[10px] mt-0.5 leading-relaxed opacity-70">{lt.desc}</p>
          </button>
        ))}
      </div>

      {/* Conditional inputs */}
      {form.link_type === 'collection' && (
        <div className="space-y-3">
          <div>
            <label className="label-base">Collection URL</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {COLLECTION_SHORTCUTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setForm(f => ({ ...f, link_url: s.value }))}
                  className={`px-3 py-1.5 text-xs border rounded-full transition-all ${
                    form.link_url === s.value
                      ? 'border-tz-gold text-tz-gold bg-tz-gold/10'
                      : 'border-tz-border text-tz-muted hover:border-tz-muted'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <input
              className="input-base w-full text-sm"
              value={form.link_url}
              onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
              placeholder="/c/new-in  or  /c/festive-diwali"
            />
            <p className="text-[10px] text-tz-muted font-body mt-1">
              To create a custom collection (e.g. /c/festive-diwali), go to Admin → Collections.
            </p>
          </div>
          {form.link_url && (
            <a href={form.link_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-tz-gold hover:underline">
              <ExternalLink size={11} /> Preview: {form.link_url}
            </a>
          )}
        </div>
      )}

      {form.link_type === 'url' && (
        <div className="space-y-3">
          <div className="bg-tz-gold/5 border border-tz-gold/20 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-tz-gold font-body flex items-center gap-2">
              <Sparkles size={13} /> Festive / Special Offer Tip
            </p>
            <p className="text-[11px] text-tz-muted font-body leading-relaxed">
              Create a collection in <strong className="text-tz-text">Admin → Collections</strong> with
              a slug like <code className="text-tz-gold bg-tz-black/40 px-1 rounded">festive-diwali-2025</code>.
              Then set the link below to <code className="text-tz-gold bg-tz-black/40 px-1 rounded">/c/festive-diwali-2025</code>.
              The collection page lets you pin curated products for the offer.
            </p>
          </div>
          <div>
            <label className="label-base">Custom URL</label>
            <input
              className="input-base w-full text-sm"
              value={form.link_url}
              onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
              placeholder="/c/festive-diwali-2025  or  /catalog?tags=festive"
            />
          </div>
          {form.link_url && (
            <a href={form.link_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-tz-gold hover:underline">
              <ExternalLink size={11} /> Preview: {form.link_url}
            </a>
          )}
        </div>
      )}

      {form.link_type === 'product' && (
        <p className="text-xs text-tz-muted font-body bg-tz-surface/30 border border-tz-border/50 p-3 rounded-lg">
          Clicking the hero goes to the selected product's page. Select a product in the Hero Banner section above.
        </p>
      )}

      <SaveBtn saving={saving} onClick={handleSave} />
    </SectionCard>
  )
}

// ─── Product multi-select (Featured & Trending) ───────────────────────────────
function ProductsEditor({ settingKey, maxItems, title, description, settings, products, onSave }) {
  const current   = settings[settingKey] ?? {}
  const [ids,     setIds]    = useState(current.product_ids ?? [])
  const [search,  setSearch] = useState('')
  const [saving,  setSaving] = useState(false)

  const selected  = ids.map(id => products.find(p => p.id === id)).filter(Boolean)
  const available = products.filter(p =>
    !ids.includes(p.id) &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  function add(id) {
    if (ids.includes(id)) return
    if (ids.length >= maxItems) { toast.error(`Max ${maxItems} products`); return }
    setIds(prev => [...prev, id])
  }
  function remove(id)  { setIds(prev => prev.filter(i => i !== id)) }
  function moveUp(i)   { if (i === 0) return; const a = [...ids]; [a[i-1], a[i]] = [a[i], a[i-1]]; setIds(a) }
  function moveDown(i) { if (i === ids.length-1) return; const a = [...ids]; [a[i], a[i+1]] = [a[i+1], a[i]]; setIds(a) }

  async function handleSave() {
    setSaving(true)
    try { await onSave(settingKey, { product_ids: ids }); toast.success('Saved!') }
    catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <SectionCard title={title} description={description}>
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <p className="text-xs font-semibold text-tz-white font-body mb-2">
            Selected ({ids.length}/{maxItems})
          </p>
          {selected.length === 0 ? (
            <div className="border border-dashed border-tz-border p-8 text-center">
              <p className="text-xs text-tz-muted font-body">No products selected yet</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {selected.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 p-2 bg-tz-surface border border-tz-border">
                  <span className="text-[10px] text-tz-muted w-4 text-center shrink-0 font-body">{i + 1}</span>
                  {p.images?.[0] && (
                    <img src={p.images[0]} alt={p.name}
                      className="w-8 h-9 object-cover border border-tz-border/50 shrink-0" />
                  )}
                  <p className="text-xs text-tz-text font-body flex-1 line-clamp-1">{p.name}</p>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => moveUp(i)} disabled={i === 0}
                      className="p-1 text-tz-muted hover:text-tz-gold disabled:opacity-25 transition-colors">
                      <ChevronUp size={11} />
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === selected.length - 1}
                      className="p-1 text-tz-muted hover:text-tz-gold disabled:opacity-25 transition-colors">
                      <ChevronDown size={11} />
                    </button>
                    <button onClick={() => remove(p.id)}
                      className="p-1 text-tz-muted hover:text-tz-accent transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-tz-white font-body mb-2">Available Products</p>
          <div className="relative mb-2">
            <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter…" className="input-base w-full pl-8 text-xs py-2"
            />
          </div>
          <div className="border border-tz-border max-h-72 overflow-y-auto divide-y divide-tz-border/40">
            {available.slice(0, 25).map(p => (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                disabled={ids.length >= maxItems}
                className="w-full flex items-center gap-2 p-2 hover:bg-tz-surface/50 transition-colors text-left disabled:opacity-40"
              >
                {p.images?.[0] && (
                  <img src={p.images[0]} alt={p.name}
                    className="w-8 h-9 object-cover border border-tz-border/40 shrink-0" />
                )}
                <p className="text-xs text-tz-text font-body line-clamp-1 flex-1">{p.name}</p>
                <Plus size={11} className="text-tz-muted shrink-0" />
              </button>
            ))}
            {available.length === 0 && (
              <p className="p-4 text-xs text-tz-muted font-body text-center">
                {search ? 'No matching products' : 'All products already selected'}
              </p>
            )}
          </div>
        </div>
      </div>
      <SaveBtn saving={saving} onClick={handleSave} />
    </SectionCard>
  )
}

function FeaturedEditor(props) {
  return (
    <ProductsEditor {...props} settingKey="featured_products" maxItems={8}
      title="Featured Products"
      description="Shown in the 'Handpicked for You' grid. Select up to 8 products and drag to reorder."
    />
  )
}

function TrendingEditor(props) {
  return (
    <ProductsEditor {...props} settingKey="trending_products" maxItems={6}
      title="Trending Now"
      description="Shown in the 'Trending Now' section. Select up to 6 products."
    />
  )
}

// ─── Inline category image modal ──────────────────────────────────────────────
function CategoryImageModal({ cat, onClose, onSaved }) {
  const [url,       setUrl]       = useState(cat.image_url ?? '')
  const [mode,      setMode]      = useState('url')
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setUploading(true)
    try {
      const ext      = file.name.split('.').pop()
      const fileName = `categories/${cat.slug}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('category-images').upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('category-images').getPublicUrl(fileName)
      setUrl(publicUrl)
      toast.success('Uploaded!')
    } catch {
      toast.error('Upload failed — try pasting a URL')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('categories')
      .update({ image_url: url || null })
      .eq('id', cat.id)
    setSaving(false)
    if (error) { toast.error('Failed to save image'); return }
    onSaved(cat.id, url || null)
    toast.success('Category image updated!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-tz-dark border border-tz-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-tz-white font-semibold text-sm">Set Category Image</h3>
            <p className="text-tz-muted text-xs mt-0.5">{cat.name}</p>
          </div>
          <button onClick={onClose} className="text-tz-muted hover:text-tz-white"><X size={16} /></button>
        </div>

        {/* Preview */}
        <div className="w-full h-36 rounded-xl overflow-hidden bg-tz-black/50 border border-tz-border mb-5 flex items-center justify-center">
          {url
            ? <img src={url} alt={cat.name} className="w-full h-full object-cover" />
            : <div className="text-center text-tz-muted">
                <Image size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No image set</p>
              </div>
          }
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 mb-4 bg-tz-black/40 border border-tz-border rounded-lg p-1">
          {[['url', Link2, 'Paste URL'], ['upload', Upload, 'Upload File']].map(([m, Icon, lbl]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all ${
                mode === m ? 'bg-tz-dark text-tz-white' : 'text-tz-muted hover:text-tz-white'
              }`}
            >
              <Icon size={11} /> {lbl}
            </button>
          ))}
        </div>

        {mode === 'url' ? (
          <input
            type="url"
            className="input-base w-full text-sm"
            placeholder="https://example.com/image.jpg"
            value={url}
            onChange={e => setUrl(e.target.value)}
            autoFocus
          />
        ) : (
          <label className={`flex items-center justify-center gap-2 w-full h-10 border border-dashed rounded-lg cursor-pointer transition-colors ${
            uploading ? 'border-tz-gold/40 text-tz-gold' : 'border-tz-border text-tz-muted hover:border-tz-muted hover:text-tz-white'
          }`}>
            {uploading
              ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
              : <><Upload size={14} /> <span className="text-xs">Click to upload</span></>
            }
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { setUrl(''); setSaving(true); supabase.from('categories').update({ image_url: null }).eq('id', cat.id).then(() => { onSaved(cat.id, null); setSaving(false); onClose() }) }}
            disabled={saving || !cat.image_url}
            className="btn-secondary text-xs px-3 py-2 disabled:opacity-40"
          >
            Remove
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> Save Image</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Categories editor ────────────────────────────────────────────────────────
function CategoriesEditor({ settings, categories, onSave, onCategoryImageUpdate }) {
  const current   = settings.featured_categories ?? {}
  const [ids,     setIds]        = useState(current.category_ids ?? [])
  const [saving,  setSaving]     = useState(false)
  const [imgEdit, setImgEdit]    = useState(null) // category being image-edited

  function toggle(id) {
    setIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  async function handleSave() {
    setSaving(true)
    try { await onSave('featured_categories', { category_ids: ids }); toast.success('Saved!') }
    catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <SectionCard
      title="Shop by Category"
      description="Choose which categories appear in the homepage grid. Click the image thumbnail to set a category image without leaving this page."
    >
      {categories.length === 0 ? (
        <p className="text-xs text-tz-muted font-body py-4">
          No categories found. Create categories in Admin → Categories first.
        </p>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => {
            const checked = ids.includes(cat.id)
            return (
              <div
                key={cat.id}
                className={`flex items-center gap-3 p-3 border transition-all ${
                  checked ? 'border-tz-gold/50 bg-tz-gold/5' : 'border-tz-border'
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(cat.id)}
                  className="accent-tz-gold shrink-0"
                />

                {/* Image thumbnail — click to edit */}
                <button
                  onClick={() => setImgEdit(cat)}
                  title="Click to set image"
                  className="w-12 h-14 shrink-0 border border-tz-border rounded-lg overflow-hidden bg-tz-black/50 hover:border-tz-gold/50 transition-colors relative group"
                >
                  {cat.image_url ? (
                    <>
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Image size={12} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                      <Image size={14} className="text-tz-muted group-hover:text-tz-gold transition-colors" />
                      <span className="text-[8px] text-tz-muted group-hover:text-tz-gold">Set</span>
                    </div>
                  )}
                </button>

                {/* Category info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(cat.id)}>
                  <p className="text-xs font-medium text-tz-white font-body">{cat.name}</p>
                  <p className="text-[10px] text-tz-muted font-body">{cat.slug}</p>
                  {!cat.image_url && (
                    <p className="text-[10px] text-amber-400 font-body mt-0.5">⚠ No image — click thumbnail to add</p>
                  )}
                </div>

                {/* Image status */}
                <button
                  onClick={() => setImgEdit(cat)}
                  className="text-[10px] shrink-0 transition-colors hover:text-tz-gold"
                  style={{ color: cat.image_url ? '#10b981' : '#6b7280' }}
                >
                  {cat.image_url ? '✓ Image' : 'Add Image'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <SaveBtn saving={saving} onClick={handleSave} />

      {/* Inline image editor modal */}
      {imgEdit && (
        <CategoryImageModal
          cat={imgEdit}
          onClose={() => setImgEdit(null)}
          onSaved={(id, url) => { onCategoryImageUpdate(id, url); setImgEdit(null) }}
        />
      )}
    </SectionCard>
  )
}

// ─── Testimonials editor ──────────────────────────────────────────────────────
function TestimonialsEditor({ settings, onSave }) {
  const current  = settings.testimonials ?? {}
  const [items,  setItems]  = useState(current.items ?? [])
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState({ name: '', location: '', rating: 5, text: '' })

  function addItem() {
    if (!form.name.trim() || !form.text.trim()) { toast.error('Name and review text are required'); return }
    setItems(prev => [...prev, { ...form, id: `t-${Date.now()}` }])
    setForm({ name: '', location: '', rating: 5, text: '' })
  }

  async function handleSave() {
    setSaving(true)
    try { await onSave('testimonials', { items }); toast.success('Testimonials saved!') }
    catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <SectionCard
      title="Customer Testimonials"
      description="These appear in the 'What Our Customers Say' section."
    >
      {items.length > 0 && (
        <div className="space-y-2 mb-4">
          {items.map(t => (
            <div key={t.id} className="flex items-start gap-3 p-3 bg-tz-surface border border-tz-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-xs font-semibold text-tz-white font-body">{t.name}</p>
                  {t.location && <p className="text-[10px] text-tz-muted font-body">· {t.location}</p>}
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={9} className={n <= t.rating ? 'text-tz-gold fill-tz-gold' : 'text-tz-border'} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-tz-muted font-body line-clamp-2">{t.text}</p>
              </div>
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== t.id))}
                className="text-tz-muted hover:text-tz-accent transition-colors shrink-0 mt-0.5">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border border-tz-border/60 p-4 bg-tz-black/30 space-y-3">
        <p className="text-xs font-semibold text-tz-white font-body">Add a Testimonial</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-base">Customer Name *</label>
            <input className="input-base w-full" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Priya Sharma" />
          </div>
          <div>
            <label className="label-base">City / Location</label>
            <input className="input-base w-full" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Mumbai" />
          </div>
        </div>
        <div>
          <label className="label-base">Rating</label>
          <div className="flex items-center gap-1.5 mt-1.5">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}>
                <Star size={22} className={n <= form.rating ? 'text-tz-gold fill-tz-gold' : 'text-tz-border'} />
              </button>
            ))}
            <span className="text-xs text-tz-muted font-body ml-2">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][form.rating]}
            </span>
          </div>
        </div>
        <div>
          <label className="label-base">Review Text *</label>
          <textarea className="input-base w-full resize-none" rows={3}
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="What the customer said…" />
        </div>
        <button onClick={addItem} disabled={!form.name.trim() || !form.text.trim()}
          className="btn-secondary text-xs flex items-center gap-2 disabled:opacity-40">
          <Plus size={12} /> Add to List
        </button>
      </div>
      <SaveBtn saving={saving} onClick={handleSave} />
    </SectionCard>
  )
}

// ─── Announcement bar editor ──────────────────────────────────────────────────
function AnnouncementEditor({ settings, onSave }) {
  const current  = settings.announcement_bar ?? {}
  const [text,   setText]   = useState(current.text   ?? '')
  const [active, setActive] = useState(current.active ?? false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try { await onSave('announcement_bar', { text, active }); toast.success('Saved!') }
    catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <SectionCard
      title="Announcement Bar"
      description="A full-width strip shown at the top of the homepage. Use for promotions, sale announcements, or free shipping thresholds."
    >
      <div onClick={() => setActive(a => !a)}
        className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${active ? 'border-tz-gold/40 bg-tz-gold/5' : 'border-tz-border'}`}
      >
        <div className={`relative w-10 rounded-full transition-colors shrink-0 ${active ? 'bg-tz-gold' : 'bg-tz-border'}`} style={{ height: 22 }}>
          <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
            style={{ transform: active ? 'translateX(22px)' : 'translateX(2px)' }} />
        </div>
        <p className="text-xs font-semibold text-tz-white font-body">
          {active ? 'Announcement bar is VISIBLE' : 'Announcement bar is hidden'}
        </p>
        {active ? <Eye size={13} className="text-tz-gold ml-auto shrink-0" /> : <EyeOff size={13} className="text-tz-muted ml-auto shrink-0" />}
      </div>

      <div>
        <label className="label-base">Announcement Text</label>
        <input className="input-base w-full" value={text} onChange={e => setText(e.target.value)}
          placeholder="FREE SHIPPING on orders above ₹999 · Use code SUMMER10 for 10% off" />
      </div>

      {text && (
        <div>
          <p className="text-[10px] text-tz-muted font-body mb-2">Preview:</p>
          <div className={`py-2.5 px-4 text-center ${active ? 'bg-tz-gold' : 'bg-tz-surface border border-dashed border-tz-border opacity-50'}`}>
            <p className={`text-xs font-bold font-body ${active ? 'text-tz-black' : 'text-tz-muted'}`}>{text}</p>
          </div>
        </div>
      )}

      <SaveBtn saving={saving} onClick={handleSave} />
    </SectionCard>
  )
}