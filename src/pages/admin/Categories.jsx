// src/pages/admin/Categories.jsx
// ADDED: image_url editing — paste a URL or upload file to Supabase Storage

import { useState, useEffect }      from 'react'
import { motion, AnimatePresence }   from 'framer-motion'
import {
  Tag, Plus, Edit2, Trash2, Check,
  X, AlertTriangle, RefreshCw, Image, Upload, Link2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast        from 'react-hot-toast'

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-tz-gold' : 'bg-tz-surface-2'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

// ─── Image editor modal ───────────────────────────────────────────────────────
function ImageModal({ cat, onClose, onSave }) {
  const [url,        setUrl]        = useState(cat.image_url ?? '')
  const [uploading,  setUploading]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [mode,       setMode]       = useState('url') // 'url' | 'upload'

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return }
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }

    setUploading(true)
    try {
      const ext      = file.name.split('.').pop()
      const fileName = `categories/${cat.slug}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('category-images')
        .upload(fileName, file, { upsert: true })

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(fileName)

      setUrl(publicUrl)
      toast.success('Image uploaded!')
    } catch (err) {
      toast.error('Upload failed — try pasting a URL instead')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('categories')
      .update({ image_url: url || null })
      .eq('id', cat.id)
    setSaving(false)
    if (error) { toast.error('Failed to save image'); return }
    onSave(cat.id, url || null)
    toast.success('Category image updated!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-tz-dark border border-tz-border rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-tz-white font-semibold">Category Image</h3>
            <p className="text-tz-muted text-xs mt-0.5">{cat.name}</p>
          </div>
          <button onClick={onClose} className="text-tz-muted hover:text-tz-white">
            <X size={16} />
          </button>
        </div>

        {/* Preview */}
        <div className="w-full h-40 rounded-xl overflow-hidden bg-tz-black/50 border border-tz-border mb-5 flex items-center justify-center">
          {url ? (
            <img src={url} alt={cat.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-tz-muted">
              <Image size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No image set</p>
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 mb-4 bg-tz-black/40 border border-tz-border rounded-lg p-1">
          <button
            onClick={() => setMode('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all ${
              mode === 'url' ? 'bg-tz-dark text-tz-white' : 'text-tz-muted hover:text-tz-white'
            }`}
          >
            <Link2 size={11} /> Paste URL
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all ${
              mode === 'upload' ? 'bg-tz-dark text-tz-white' : 'text-tz-muted hover:text-tz-white'
            }`}
          >
            <Upload size={11} /> Upload File
          </button>
        </div>

        {mode === 'url' ? (
          <div>
            <label className="label-base">Image URL</label>
            <input
              type="url"
              className="input-base w-full text-sm"
              placeholder="https://example.com/image.jpg"
              value={url}
              onChange={e => setUrl(e.target.value)}
              autoFocus
            />
            <p className="text-tz-muted text-xs mt-1.5">
              Paste any image URL — Unsplash, Cloudinary, Imgbb, etc.
            </p>
          </div>
        ) : (
          <div>
            <label className="label-base">Upload Image (max 5MB)</label>
            <label className={`flex items-center justify-center gap-2 w-full h-10 border border-dashed rounded-lg cursor-pointer transition-colors ${
              uploading ? 'border-tz-gold/40 text-tz-gold' : 'border-tz-border text-tz-muted hover:border-tz-muted hover:text-tz-white'
            }`}>
              {uploading
                ? <><motion.div className="w-4 h-4 border-2 border-tz-gold border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} /> Uploading…</>
                : <><Upload size={14} /> <span className="text-xs">Click to upload</span></>
              }
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
            <p className="text-tz-muted text-xs mt-1.5">
              Uploads to Supabase Storage — ensure 'images' bucket exists and is public.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { setUrl(''); handleSave() }}
            disabled={saving || !cat.image_url}
            className="btn-secondary text-xs px-3 py-2 disabled:opacity-40"
          >
            Remove
          </button>
          <button
            onClick={handleSave}
            disabled={saving || url === (cat.image_url ?? '')}
            className="btn-primary flex-1 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <><motion.div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} /> Saving…</>
              : <><Check size={14} /> Save Image</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminCategories() {
  const [categories,    setCategories]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [isAdding,      setIsAdding]      = useState(false)
  const [newName,       setNewName]       = useState('')
  const [addError,      setAddError]      = useState('')
  const [adding,        setAdding]        = useState(false)
  const [editingId,     setEditingId]     = useState(null)
  const [editName,      setEditName]      = useState('')
  const [editSaving,    setEditSaving]    = useState(false)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)
  const [imageTarget,   setImageTarget]   = useState(null) // category being image-edited
  const [productCounts, setProductCounts] = useState({})

  async function loadCategories() {
    setLoading(true); setError(null)
    const [{ data: cats, error: catErr }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('category_slug').eq('is_active', true),
    ])
    if (catErr) { setError(catErr.message); setLoading(false); return }
    setCategories(cats ?? [])
    const counts = {}
    ;(prods ?? []).forEach(p => {
      if (p.category_slug) counts[p.category_slug] = (counts[p.category_slug] ?? 0) + 1
    })
    setProductCounts(counts)
    setLoading(false)
  }

  useEffect(() => { loadCategories() }, [])

  // ── Add ───────────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!newName.trim()) { setAddError('Name is required'); return }
    const slug = slugify(newName)
    if (categories.some(c => c.slug === slug)) { setAddError('Already exists'); return }
    setAdding(true)
    const { data, error: err } = await supabase
      .from('categories')
      .insert({ name: newName.trim(), slug, is_active: true, sort_order: categories.length + 1 })
      .select().single()
    if (err) { setAddError(err.message); setAdding(false); return }
    setCategories(prev => [...prev, data])
    setNewName(''); setIsAdding(false); setAddError(''); setAdding(false)
  }

  // ── Edit name ─────────────────────────────────────────────────────────────
  function startEdit(cat) { setEditingId(cat.id); setEditName(cat.name) }

  async function saveEdit(cat) {
    if (!editName.trim()) return
    setEditSaving(true)
    const { data, error: err } = await supabase
      .from('categories')
      .update({ name: editName.trim(), slug: slugify(editName) })
      .eq('id', cat.id).select().single()
    if (!err && data) setCategories(prev => prev.map(c => c.id === cat.id ? data : c))
    setEditingId(null); setEditSaving(false)
  }

  // ── Toggle ────────────────────────────────────────────────────────────────
  async function handleToggle(cat) {
    const { data, error: err } = await supabase
      .from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id).select().single()
    if (!err && data) setCategories(prev => prev.map(c => c.id === cat.id ? data : c))
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function confirmDelete() {
    setDeleting(true)
    const { error: err } = await supabase.from('categories').delete().eq('id', deleteTarget.id)
    if (!err) setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDeleteTarget(null); setDeleting(false)
  }

  // ── Image save callback ───────────────────────────────────────────────────
  const handleImageSave = (id, newUrl) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, image_url: newUrl } : c))
  }

  const activeCount   = categories.filter(c => c.is_active).length
  const inactiveCount = categories.filter(c => !c.is_active).length

  return (
    <div className="max-w-3xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-tz-white font-light">Categories</h1>
          <p className="text-xs text-tz-muted font-body mt-0.5">
            {loading ? 'Loading…' : `${categories.length} categories · ${activeCount} active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadCategories} className="btn-icon" title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setIsAdding(true); setNewName(''); setAddError('') }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> Add Category
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',    value: categories.length, color: 'text-tz-white'    },
          { label: 'Active',   value: activeCount,       color: 'text-green-400'  },
          { label: 'Inactive', value: inactiveCount,     color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-tz-dark border border-tz-border p-4 text-center">
            <p className={`font-display text-2xl font-light ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-tz-muted font-body uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-tz-accent/10 border border-tz-accent/30 text-xs text-tz-accent font-body">
          {error}
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-tz-dark border border-tz-gold/30 p-4"
          >
            <p className="text-xs font-semibold text-tz-white font-body mb-3 flex items-center gap-2">
              <Tag size={13} className="text-tz-gold" /> New Category
            </p>
            <div className="flex items-center gap-3">
              <input
                autoFocus type="text" value={newName}
                onChange={e => { setNewName(e.target.value); setAddError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false) }}
                placeholder="Category name…"
                className="input-base flex-1 h-9 text-xs"
              />
              <p className="text-[10px] text-tz-muted font-body w-40 hidden sm:block">
                Slug: {newName ? slugify(newName) : '—'}
              </p>
              <button onClick={handleAdd} disabled={adding}
                className="w-9 h-9 flex items-center justify-center bg-tz-gold text-tz-black hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {adding
                  ? <span className="w-3 h-3 border-2 border-tz-black/30 border-t-tz-black rounded-full animate-spin" />
                  : <Check size={14} />
                }
              </button>
              <button onClick={() => setIsAdding(false)}
                className="w-9 h-9 flex items-center justify-center text-tz-muted hover:text-tz-text border border-tz-border transition-all"
              >
                <X size={14} />
              </button>
            </div>
            {addError && <p className="text-xs text-tz-accent font-body mt-2">{addError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories list — updated columns to include Image */}
      <div className="bg-tz-dark border border-tz-border overflow-hidden">
        <div className="grid grid-cols-[48px_1fr_72px_80px_80px_108px] gap-3 px-5 py-3 border-b border-tz-border bg-tz-surface/40">
          {['Img', 'Category', 'Products', 'Status', '', 'Actions'].map(h => (
            <p key={h} className="text-[10px] text-tz-muted font-body font-semibold tracking-wider uppercase">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-tz-border/20 rounded animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center">
            <Tag size={24} className="text-tz-muted mx-auto mb-3" />
            <p className="text-sm text-tz-muted font-body">No categories yet.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {categories.map(cat => (
              <motion.div
                key={cat.id} layout
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-[48px_1fr_72px_80px_80px_108px] gap-3 items-center px-5 py-3.5 border-b border-tz-border/50 last:border-0 hover:bg-tz-surface/20 transition-colors"
              >
                {/* Image thumbnail */}
                <button
                  onClick={() => setImageTarget(cat)}
                  className="w-10 h-12 rounded-lg overflow-hidden bg-tz-black/50 border border-tz-border hover:border-tz-gold/50 transition-colors flex items-center justify-center group relative"
                  title="Edit image"
                >
                  {cat.image_url ? (
                    <>
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Image size={12} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <Image size={14} className="text-tz-muted group-hover:text-tz-gold transition-colors" />
                  )}
                </button>

                {/* Name / edit */}
                <div className="flex items-center gap-2 min-w-0">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        autoFocus type="text" value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(cat); if (e.key === 'Escape') setEditingId(null) }}
                        className="input-base flex-1 h-8 text-xs"
                      />
                      <button onClick={() => saveEdit(cat)} disabled={editSaving}
                        className="w-7 h-7 flex items-center justify-center bg-tz-gold text-tz-black hover:brightness-110 disabled:opacity-50"
                      >
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="w-7 h-7 flex items-center justify-center border border-tz-border text-tz-muted hover:text-tz-text"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-tz-text font-body">{cat.name}</p>
                      <p className="text-[10px] text-tz-muted font-body">{cat.slug}</p>
                    </div>
                  )}
                </div>

                {/* Product count */}
                <p className="text-xs text-tz-muted font-body">{productCounts[cat.slug] ?? 0} items</p>

                {/* Toggle */}
                <Toggle checked={cat.is_active} onChange={() => handleToggle(cat)} />

                {/* Image indicator */}
                <div className="flex items-center">
                  {cat.image_url
                    ? <span className="text-[10px] text-emerald-400 font-body">✓ Image</span>
                    : <span className="text-[10px] text-tz-muted font-body">No img</span>
                  }
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setImageTarget(cat)}
                    className="w-7 h-7 flex items-center justify-center text-tz-muted hover:text-tz-gold hover:bg-tz-gold/10 transition-all"
                    title="Edit image"
                  >
                    <Image size={12} />
                  </button>
                  <button
                    onClick={() => startEdit(cat)}
                    className="w-7 h-7 flex items-center justify-center text-tz-muted hover:text-tz-gold hover:bg-tz-gold/10 transition-all"
                    title="Edit name"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="w-7 h-7 flex items-center justify-center text-tz-muted hover:text-tz-accent hover:bg-tz-accent/10 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Image modal */}
      <AnimatePresence>
        {imageTarget && (
          <ImageModal
            cat={imageTarget}
            onClose={() => setImageTarget(null)}
            onSave={handleImageSave}
          />
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/80" onClick={() => setDeleteTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
              className="relative bg-tz-dark border border-tz-border p-6 max-w-sm w-full rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-tz-accent/10 border border-tz-accent/30 flex items-center justify-center rounded-xl">
                  <AlertTriangle size={18} className="text-tz-accent" />
                </div>
                <h3 className="font-display text-lg text-tz-white font-light">Delete Category</h3>
              </div>
              <p className="text-sm text-tz-muted font-body mb-2">
                Delete <strong className="text-tz-white">"{deleteTarget.name}"</strong>?
              </p>
              <p className="text-xs text-tz-muted font-body mb-6">
                Products in this category will have their category set to null. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-tz-accent text-white text-sm font-body py-2.5 hover:bg-red-600 transition-colors disabled:opacity-50 rounded-xl"
                >
                  {deleting
                    ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
                    : 'Delete'
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}