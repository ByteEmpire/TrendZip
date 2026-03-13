// src/pages/admin/CollectionManager.jsx
// FIXED: upsert now handles case where DB row doesn't exist yet
// FIXED: saveHeroImage/savePinned/saveExcluded use upsert (not update) to avoid silent failures
// ADDED: Custom collection creator — for festive offers, special events, etc.

import { useState, useEffect }    from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Sparkles, Tag, Save, Loader2, Search,
  X, Plus, Pin, EyeOff as EyeOffIcon, RefreshCw,
  ChevronDown, Image, Link2, Upload, ExternalLink,
  Check, Trash2, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast        from 'react-hot-toast'

const CORE_COLLECTIONS = [
  { id: 'new-in',   label: 'New In',   icon: Sparkles,  hint: '/c/new-in'   },
  { id: 'trending', label: 'Trending', icon: TrendingUp, hint: '/c/trending' },
  { id: 'sale',     label: 'Sale',     icon: Tag,        hint: '/c/sale'     },
]

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest First'       },
  { value: 'rating_desc',     label: 'Top Rated'          },
  { value: 'price_asc',       label: 'Price: Low → High'  },
  { value: 'price_desc',      label: 'Price: High → Low'  },
  { value: 'discount_desc',   label: 'Biggest Discount'   },
]

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Safe upsert helper ───────────────────────────────────────────────────────
// Uses upsert (not update) so it works whether the row exists or not
async function upsertCollection(id, patch) {
  const { error } = await supabase
    .from('collection_pages')
    .upsert({ id, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw error
}

// ─── Image Modal ──────────────────────────────────────────────────────────────
function HeroImageModal({ current, onClose, onSave, collectionId }) {
  const [url,       setUrl]      = useState(current ?? '')
  const [mode,      setMode]     = useState('url')
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]   = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { toast.error('Max 8MB'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `collections/${collectionId}-hero-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
      setUrl(publicUrl)
      toast.success('Uploaded!')
    } catch { toast.error('Upload failed — try pasting a URL') }
    finally { setUploading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(url || null)
      onClose()
    } catch { toast.error('Failed to save image') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-tz-dark border border-tz-border rounded-2xl p-6 w-full max-w-lg"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-tz-white font-semibold">Hero Background Image</h3>
          <button onClick={onClose} className="text-tz-muted hover:text-tz-white"><X size={16} /></button>
        </div>

        <div className="w-full h-36 rounded-xl overflow-hidden bg-tz-black/50 border border-tz-border mb-5 flex items-center justify-center">
          {url
            ? <img src={url} alt="hero preview" className="w-full h-full object-cover" />
            : <div className="text-center text-tz-muted"><Image size={28} className="mx-auto mb-2 opacity-30" /><p className="text-xs">No image set</p></div>
          }
        </div>

        <div className="flex gap-1 mb-4 bg-tz-black/40 border border-tz-border rounded-lg p-1">
          {[['url', Link2, 'Paste URL'], ['upload', Upload, 'Upload']].map(([m, Icon, lbl]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all ${mode === m ? 'bg-tz-dark text-tz-white' : 'text-tz-muted hover:text-tz-white'}`}
            >
              <Icon size={11} /> {lbl}
            </button>
          ))}
        </div>

        {mode === 'url' ? (
          <input type="url" className="input-base w-full text-sm" placeholder="https://…" value={url}
            onChange={e => setUrl(e.target.value)} autoFocus />
        ) : (
          <label className={`flex items-center justify-center gap-2 w-full h-10 border border-dashed rounded-lg cursor-pointer transition-colors ${uploading ? 'border-tz-gold/40 text-tz-gold' : 'border-tz-border text-tz-muted hover:border-tz-muted'}`}>
            {uploading
              ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
              : <><Upload size={14} /> <span className="text-xs">Click to upload (max 8MB)</span></>
            }
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={() => { setUrl(''); onSave(null); onClose() }}
            disabled={!current} className="btn-secondary text-xs px-3 py-2 disabled:opacity-40">
            Remove
          </button>
          <button onClick={handleSave}
            disabled={saving || uploading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving…' : 'Save Image'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Product picker modal ─────────────────────────────────────────────────────
function ProductPickerModal({ allProducts, currentIds, title, onClose, onSave }) {
  const [selected, setSelected] = useState(new Set(currentIds))
  const [search,   setSearch]   = useState('')
  const [saving,   setSaving]   = useState(false)

  const filtered = allProducts.filter(p =>
    search === '' || p.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const handleSave = async () => {
    setSaving(true)
    try { await onSave([...selected]); onClose() }
    catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-tz-dark border border-tz-border rounded-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-tz-border">
          <h3 className="text-tz-white font-semibold text-sm">{title}</h3>
          <button onClick={onClose} className="text-tz-muted hover:text-tz-white"><X size={16} /></button>
        </div>
        <div className="p-4 border-b border-tz-border">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input-base w-full pl-8 text-xs" placeholder="Search products…" autoFocus />
          </div>
          <p className="text-tz-muted text-xs mt-2">{selected.size} selected</p>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-tz-border/40 px-2">
          {filtered.slice(0, 50).map(p => {
            const isSelected = selected.has(p.id)
            return (
              <button key={p.id} onClick={() => toggle(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${isSelected ? 'bg-tz-gold/5' : 'hover:bg-tz-surface/30'}`}
              >
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} className="w-9 h-10 object-cover border border-tz-border/50 shrink-0" />
                  : <div className="w-9 h-10 bg-tz-surface border border-tz-border shrink-0" />
                }
                <p className="text-xs text-tz-text font-body flex-1 line-clamp-1">{p.name}</p>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-tz-gold border-tz-gold' : 'border-tz-border'}`}>
                  {isSelected && <Check size={10} className="text-tz-black" />}
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="p-4 text-xs text-tz-muted text-center font-body">No products found</p>
          )}
        </div>
        <div className="p-4 border-t border-tz-border flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {saving ? 'Saving…' : `Save (${selected.size})`}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Single collection editor ─────────────────────────────────────────────────
function CollectionEditor({ col, allProducts, onDeleted }) {
  const [cfg,     setCfg]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [picker,  setPicker]  = useState(null)
  const [deleting,setDeleting]= useState(false)

  useEffect(() => { loadCfg() }, [col.id]) // eslint-disable-line

  async function loadCfg() {
    setLoading(true)
    const { data } = await supabase
      .from('collection_pages').select('*').eq('id', col.id).single()

    // Use DB data if exists, otherwise start with sensible defaults
    setCfg(data ?? {
      id:              col.id,
      label:           col.label ?? col.id,
      hero_headline:   '',
      hero_subheading: '',
      hero_badge:      '',
      hero_image_url:  null,
      auto_filter:     { sort: 'created_at_desc', limit: 60 },
      pinned_ids:      [],
      excluded_ids:    [],
      is_active:       true,
    })
    setLoading(false)
  }

  function update(field, value) {
    setCfg(prev => ({ ...prev, [field]: value }))
  }

  function updateFilter(field, value) {
    setCfg(prev => ({ ...prev, auto_filter: { ...(prev.auto_filter ?? {}), [field]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await upsertCollection(cfg.id, cfg)
      toast.success(`${cfg.label ?? col.id} page saved!`)
    } catch (err) {
      toast.error('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveHeroImage(url) {
    update('hero_image_url', url)
    try {
      await upsertCollection(col.id, { ...cfg, hero_image_url: url })
      toast.success('Hero image saved')
    } catch { toast.error('Failed to save image') }
  }

  async function savePinned(ids) {
    update('pinned_ids', ids)
    try {
      await upsertCollection(col.id, { ...cfg, pinned_ids: ids })
      toast.success(`${ids.length} products pinned`)
    } catch { toast.error('Failed to save') }
  }

  async function saveExcluded(ids) {
    update('excluded_ids', ids)
    try {
      await upsertCollection(col.id, { ...cfg, excluded_ids: ids })
      toast.success(`${ids.length} products excluded`)
    } catch { toast.error('Failed to save') }
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('collection_pages').delete().eq('id', col.id)
    setDeleting(false)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Collection deleted')
    onDeleted?.(col.id)
  }

  if (loading || !cfg) {
    return <div className="flex items-center justify-center h-48"><Loader2 className="text-tz-gold animate-spin" size={22} /></div>
  }

  const f = cfg.auto_filter ?? {}

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => update('is_active', !cfg.is_active)}
            className="relative w-10 rounded-full transition-colors shrink-0"
            style={{ height: 22, background: cfg.is_active ? 'var(--tz-gold)' : 'var(--tz-border)' }}
          >
            <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ transform: cfg.is_active ? 'translateX(22px)' : 'translateX(2px)' }} />
          </button>
          <p className="text-xs text-tz-muted font-body">
            {cfg.is_active ? <span className="text-emerald-400">Page is live</span> : 'Page is hidden'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/c/${col.id}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-tz-muted hover:text-tz-gold transition-colors">
            <ExternalLink size={12} /> Preview
          </a>
          {/* Only allow delete on custom (non-core) collections */}
          {!CORE_COLLECTIONS.find(c => c.id === col.id) && (
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-50">
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Hero section */}
      <div className="bg-tz-dark border border-tz-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-tz-white font-body border-b border-tz-border pb-3">Hero Banner</h3>

        <div>
          <label className="label-base">Collection Label <span className="text-tz-muted">(displayed as page title)</span></label>
          <input className="input-base w-full text-sm" value={cfg.label ?? ''}
            onChange={e => update('label', e.target.value)} placeholder="e.g. Festive Sale" />
        </div>

        <div>
          <label className="label-base">Background Image</label>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="w-24 h-16 bg-tz-black/50 border border-tz-border rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
              {cfg.hero_image_url
                ? <img src={cfg.hero_image_url} alt="hero" className="w-full h-full object-cover" />
                : <Image size={18} className="text-tz-muted opacity-40" />
              }
            </div>
            <div className="flex-1 space-y-1.5">
              <button onClick={() => setPicker('image')}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                <Image size={12} /> {cfg.hero_image_url ? 'Change Image' : 'Set Image'}
              </button>
              {cfg.hero_image_url && (
                <button onClick={() => saveHeroImage(null)}
                  className="text-xs text-tz-muted hover:text-tz-accent transition-colors flex items-center gap-1">
                  <X size={10} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-base">Headline</label>
            <input className="input-base w-full text-sm" value={cfg.hero_headline ?? ''}
              onChange={e => update('hero_headline', e.target.value)} placeholder="e.g. Festive Sale" />
          </div>
          <div>
            <label className="label-base">Subheading</label>
            <input className="input-base w-full text-sm" value={cfg.hero_subheading ?? ''}
              onChange={e => update('hero_subheading', e.target.value)} placeholder="e.g. Up to 40% off this Diwali" />
          </div>
          <div>
            <label className="label-base">Badge <span className="text-tz-muted">(pill above headline)</span></label>
            <input className="input-base w-full text-sm" value={cfg.hero_badge ?? ''}
              onChange={e => update('hero_badge', e.target.value)} placeholder="e.g. DIWALI, HOT, SALE" />
          </div>
        </div>
      </div>

      {/* Auto-filter rules */}
      <div className="bg-tz-dark border border-tz-border p-5 space-y-4">
        <div className="border-b border-tz-border pb-3">
          <h3 className="text-sm font-semibold text-tz-white font-body">Auto-Population Rules</h3>
          <p className="text-xs text-tz-muted font-body mt-0.5">
            Products auto-fetched based on these rules. Pin specific products below to always show them first.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-base">Default Sort</label>
            <div className="relative">
              <select
                className="input-base w-full text-sm appearance-none pr-7"
                value={f.sort ?? 'created_at_desc'}
                onChange={e => updateFilter('sort', e.target.value)}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="label-base">Max Products</label>
            <input type="number" min={4} max={200} step={4}
              className="input-base w-full text-sm"
              value={f.limit ?? 60}
              onChange={e => updateFilter('limit', Number(e.target.value))} />
          </div>

          <div>
            <label className="label-base">Required Tags <span className="text-tz-muted">(comma separated)</span></label>
            <input className="input-base w-full text-sm"
              value={(f.tags ?? []).join(', ')}
              onChange={e => updateFilter('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="e.g. festive, diwali (leave blank for all products)" />
          </div>

          <div>
            <label className="label-base">Gender Filter</label>
            <div className="relative">
              <select className="input-base w-full text-sm appearance-none pr-7"
                value={f.gender ?? ''}
                onChange={e => updateFilter('gender', e.target.value || undefined)}>
                <option value="">All genders</option>
                <option value="men">Men only</option>
                <option value="women">Women only</option>
                <option value="unisex">Unisex only</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => updateFilter('on_sale', !f.on_sale)}
            className="relative w-9 rounded-full transition-colors shrink-0"
            style={{ height: 20, background: f.on_sale ? 'var(--tz-gold)' : 'var(--tz-border)' }}>
            <div className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform"
              style={{ transform: f.on_sale ? 'translateX(18px)' : 'translateX(2px)' }} />
          </div>
          <div>
            <p className="text-xs font-medium text-tz-white font-body">Sale items only</p>
            <p className="text-[10px] text-tz-muted font-body">Only show products with a sale_price set</p>
          </div>
        </label>
      </div>

      {/* Manual overrides */}
      <div className="bg-tz-dark border border-tz-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-tz-white font-body border-b border-tz-border pb-3">Manual Overrides</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-tz-white font-body flex items-center gap-1.5">
                  <Pin size={11} className="text-tz-gold" /> Pinned Products
                </p>
                <p className="text-[10px] text-tz-muted font-body mt-0.5">Always shown first, regardless of filters</p>
              </div>
              <button onClick={() => setPicker('pin')} className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1">
                <Plus size={11} /> Edit
              </button>
            </div>
            {(cfg.pinned_ids ?? []).length === 0
              ? <p className="text-xs text-tz-muted font-body">None pinned</p>
              : (
                <div className="space-y-1">
                  {(cfg.pinned_ids ?? []).slice(0, 4).map(id => {
                    const p = allProducts.find(x => x.id === id)
                    if (!p) return null
                    return (
                      <div key={id} className="flex items-center gap-2 py-1">
                        {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-7 h-8 object-cover border border-tz-border shrink-0" />}
                        <p className="text-xs text-tz-text font-body line-clamp-1 flex-1">{p.name}</p>
                      </div>
                    )
                  })}
                  {cfg.pinned_ids.length > 4 && (
                    <p className="text-[10px] text-tz-muted font-body">+{cfg.pinned_ids.length - 4} more</p>
                  )}
                </div>
              )
            }
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-tz-white font-body flex items-center gap-1.5">
                  <EyeOffIcon size={11} className="text-tz-accent" /> Excluded Products
                </p>
                <p className="text-[10px] text-tz-muted font-body mt-0.5">Never shown even if they match filters</p>
              </div>
              <button onClick={() => setPicker('exclude')} className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1">
                <Plus size={11} /> Edit
              </button>
            </div>
            {(cfg.excluded_ids ?? []).length === 0
              ? <p className="text-xs text-tz-muted font-body">None excluded</p>
              : (
                <div className="space-y-1">
                  {(cfg.excluded_ids ?? []).slice(0, 4).map(id => {
                    const p = allProducts.find(x => x.id === id)
                    if (!p) return null
                    return (
                      <div key={id} className="flex items-center gap-2 py-1">
                        {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-7 h-8 object-cover border border-tz-border shrink-0 opacity-40" />}
                        <p className="text-xs text-tz-muted font-body line-clamp-1 flex-1 line-through">{p.name}</p>
                      </div>
                    )
                  })}
                  {cfg.excluded_ids.length > 4 && (
                    <p className="text-[10px] text-tz-muted font-body">+{cfg.excluded_ids.length - 4} more</p>
                  )}
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="btn-primary flex items-center gap-2 disabled:opacity-50 text-sm">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saving ? 'Saving…' : 'Save All Changes'}
      </button>

      <AnimatePresence>
        {picker === 'image' && (
          <HeroImageModal
            current={cfg.hero_image_url}
            collectionId={col.id}
            onClose={() => setPicker(null)}
            onSave={saveHeroImage}
          />
        )}
        {picker === 'pin' && (
          <ProductPickerModal
            allProducts={allProducts}
            currentIds={cfg.pinned_ids ?? []}
            title="Select Pinned Products"
            onClose={() => setPicker(null)}
            onSave={savePinned}
          />
        )}
        {picker === 'exclude' && (
          <ProductPickerModal
            allProducts={allProducts}
            currentIds={cfg.excluded_ids ?? []}
            title="Select Excluded Products"
            onClose={() => setPicker(null)}
            onSave={saveExcluded}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── New custom collection creator ───────────────────────────────────────────
function NewCollectionForm({ onCreated }) {
  const [label,   setLabel]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  async function handleCreate() {
    if (!label.trim()) { setError('Label required'); return }
    const id = slugify(label)
    if (!id) { setError('Invalid name — use letters and spaces'); return }
    setSaving(true)
    try {
      const { error: err } = await supabase
        .from('collection_pages')
        .insert({
          id,
          label: label.trim(),
          hero_headline:   label.trim(),
          hero_subheading: '',
          hero_badge:      '',
          hero_image_url:  null,
          auto_filter:     { sort: 'created_at_desc', limit: 60 },
          pinned_ids:      [],
          excluded_ids:    [],
          is_active:       false, // starts hidden
          updated_at:      new Date().toISOString(),
        })
      if (err) {
        if (err.code === '23505') setError(`Slug "${id}" already exists — choose a different name`)
        else throw err
        setSaving(false)
        return
      }
      toast.success(`Collection "${label}" created! It starts hidden — enable it after setup.`)
      onCreated({ id, label: label.trim() })
      setLabel('')
    } catch (err) {
      toast.error('Failed to create: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-tz-dark border border-tz-border/60 border-dashed rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-tz-white font-body flex items-center gap-2">
        <Sparkles size={13} className="text-tz-gold" /> Create Festive / Custom Collection
      </p>
      <p className="text-[11px] text-tz-muted font-body">
        Creates a new collection page at <code className="text-tz-gold bg-tz-black/40 px-1 rounded">/c/your-slug</code>.
        Link from Hero Banner → Destination for special offers.
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            className="input-base w-full text-sm"
            value={label}
            onChange={e => { setLabel(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Diwali 2025, Summer Sale…"
          />
          {label && <p className="text-[10px] text-tz-muted mt-0.5 font-body">→ /c/{slugify(label)}</p>}
          {error && <p className="text-[10px] text-tz-accent mt-0.5 font-body">{error}</p>}
        </div>
        <button
          onClick={handleCreate}
          disabled={saving || !label.trim()}
          className="btn-primary flex items-center gap-1.5 text-sm px-4 disabled:opacity-50 shrink-0"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          {saving ? 'Creating…' : 'Create'}
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminCollectionManager() {
  const [activeCol,    setActiveCol]    = useState('new-in')
  const [allProducts,  setAllProducts]  = useState([])
  const [customCols,   setCustomCols]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showNewForm,  setShowNewForm]  = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id, name, slug, images, base_price, sale_price, is_active').eq('is_active', true).order('name'),
      supabase.from('collection_pages').select('id, label').not('id', 'in', '("new-in","trending","sale")').order('id'),
    ]).then(([{ data: prods }, { data: customs }]) => {
      setAllProducts(prods ?? [])
      setCustomCols((customs ?? []).map(c => ({ id: c.id, label: c.label ?? c.id, icon: Sparkles, hint: `/c/${c.id}` })))
      setLoading(false)
    })
  }, [])

  const allCollections = [...CORE_COLLECTIONS, ...customCols]
  const active = allCollections.find(c => c.id === activeCol) ?? CORE_COLLECTIONS[0]

  function handleCustomCreated(col) {
    const newCol = { id: col.id, label: col.label, icon: Sparkles, hint: `/c/${col.id}` }
    setCustomCols(prev => [...prev, newCol])
    setActiveCol(col.id)
    setShowNewForm(false)
  }

  function handleDeleted(id) {
    setCustomCols(prev => prev.filter(c => c.id !== id))
    setActiveCol('new-in')
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-tz-white font-light">Collection Pages</h1>
          <p className="text-xs text-tz-muted font-body mt-0.5">
            Manage product listing pages at /c/:slug
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(v => !v)}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <Plus size={12} /> New Collection
        </button>
      </div>

      {/* New collection form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <NewCollectionForm onCreated={handleCustomCreated} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-tz-black/40 border border-tz-border rounded-xl p-1 flex-wrap">
        {allCollections.map(col => (
          <button
            key={col.id}
            onClick={() => setActiveCol(col.id)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeCol === col.id
                ? 'bg-tz-dark text-tz-white shadow'
                : 'text-tz-muted hover:text-tz-white'
            }`}
          >
            <col.icon size={12} />
            {col.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="text-tz-gold animate-spin" size={22} />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCol}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <CollectionEditor
              col={active}
              allProducts={allProducts}
              onDeleted={handleDeleted}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}