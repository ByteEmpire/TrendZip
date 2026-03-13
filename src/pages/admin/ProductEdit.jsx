import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link }              from 'react-router-dom'
import { motion, AnimatePresence }                   from 'framer-motion'
import {
  ArrowLeft, Save, Check, AlertCircle,
  X, Plus, Eye, Upload, Loader2, Bug
} from 'lucide-react'
import { supabase }      from '@/lib/supabase'
import useAuthStore      from '@/store/authStore'

// ─── Constants ────────────────────────────────────────────────
const CATEGORIES = [
  'tops','bottoms','dresses','outerwear',
  'co-ords','knitwear','accessories','footwear'
]
const TAGS = [
  'new-arrival','best-seller','limited-edition',
  'sale','sustainable','premium'
]
const CLOTHING_SIZES = ['XS','S','M','L','XL','XXL','3XL']

// ─── Helpers ──────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── Sub-components ───────────────────────────────────────────
function FormField({ label, hint, error, required, children }) {
  return (
    <div>
      <label className="label-base flex items-center gap-1 flex-wrap">
        {label}
        {required && <span className="text-tz-accent">*</span>}
        {hint && <span className="text-[10px] text-tz-muted font-normal ml-1">({hint})</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-xs text-tz-accent mt-1.5 font-body"
          >
            <AlertCircle size={11} />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none shrink-0 ${
        checked ? 'bg-tz-gold' : 'bg-tz-surface-2 border border-tz-border'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  )
}

// ─── Debug panel (only shows when there are errors) ───────────
function DebugPanel({ logs }) {
  const [open, setOpen] = useState(false)
  if (logs.length === 0) return null
  return (
    <div className="border border-yellow-500/30 bg-yellow-500/5 p-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs text-yellow-400 font-body w-full"
      >
        <Bug size={12} />
        Debug logs ({logs.length})
        <span className="ml-auto">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
          {logs.map((log, i) => (
            <p key={i} className={`text-[10px] font-mono ${
              log.type === 'error' ? 'text-red-400' :
              log.type === 'warn'  ? 'text-yellow-400' :
              'text-tz-muted'
            }`}>
              [{log.type?.toUpperCase() ?? 'LOG'}] {log.msg}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function ProductEdit() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const user         = useAuthStore(s => s.user)
  const profile      = useAuthStore(s => s.profile)
  const isNew        = !id || id === 'new'
  const fileRef      = useRef(null)

  const [loading,    setLoading]    = useState(!isNew)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [errors,     setErrors]     = useState({})
  const [debugLogs,  setDebugLogs]  = useState([])

  // Form state
  const [name,        setName]        = useState('')
  const [slug,        setSlug]        = useState('')
  const [slugEdited,  setSlugEdited]  = useState(false)
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('')
  const [gender,      setGender]      = useState('unisex')
  const [basePrice,   setBasePrice]   = useState('')
  const [salePrice,   setSalePrice]   = useState('')
  const [stock,       setStock]       = useState('0')
  const [sizes,       setSizes]       = useState([])
  const [tags,        setTags]        = useState([])
  const [material,    setMaterial]    = useState('')
  const [care,        setCare]        = useState('')
  const [fit,         setFit]         = useState('')
  const [isActive,    setIsActive]    = useState(true)
  const [isFeatured,  setIsFeatured]  = useState(false)
  const [images,      setImages]      = useState([])
  const [uploading,   setUploading]   = useState(false)
  const [uploadMsg,   setUploadMsg]   = useState('')

  // ─── Logging ───────────────────────────────────────────────
  function log(msg, type = 'info') {
    console.log(`[ProductEdit][${type}]`, msg)
    setDebugLogs(prev => [...prev, { msg: typeof msg === 'object' ? JSON.stringify(msg) : msg, type }])
  }

  // ─── Auto-slug ─────────────────────────────────────────────
  useEffect(() => {
    if (!slugEdited && name) setSlug(slugify(name))
  }, [name, slugEdited])

  // ─── Load existing ─────────────────────────────────────────
  useEffect(() => {
    if (isNew) return
    async function load() {
      setLoading(true)
      log(`Loading product id=${id}`)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        log('Load error: ' + error.message, 'error')
        navigate('/admin/products')
        return
      }

      log('Loaded: ' + data.name)
      setName(data.name ?? '')
      setSlug(data.slug ?? '')
      setSlugEdited(true)
      setDescription(data.description ?? '')
      setCategory(data.category_slug ?? '')
      setGender(data.gender ?? 'unisex')
      setBasePrice(String(data.base_price ?? ''))
      setSalePrice(String(data.sale_price ?? ''))
      setStock(String(data.stock_count ?? 0))
      setSizes(data.available_sizes ?? [])
      setTags(data.tags ?? [])
      setMaterial(data.material ?? '')
      setCare(data.care ?? '')
      setFit(data.fit ?? '')
      setIsActive(data.is_active ?? true)
      setIsFeatured(data.is_featured ?? false)
      setImages((data.images ?? []).map(url => ({ url })))
      setLoading(false)
    }
    load()
  }, [id, isNew])

  // ─── Image upload ──────────────────────────────────────────
  async function handleImageFiles(files) {
    if (!files || files.length === 0) return

    const toProcess = Array.from(files).slice(0, 6 - images.length)
    if (toProcess.length === 0) {
      setUploadMsg('Maximum 6 images allowed.')
      return
    }

    setUploading(true)
    setUploadMsg('')

    for (const file of toProcess) {
      log(`Uploading: ${file.name} (${file.type}, ${(file.size/1024).toFixed(0)}KB)`)

      // Validate
      if (!file.type.startsWith('image/')) {
        log(`Skipped non-image: ${file.name}`, 'warn')
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        log(`File too large: ${file.name}`, 'warn')
        setUploadMsg(`${file.name} is too large (max 5MB)`)
        continue
      }

      // Build unique path
      const ext  = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '')
      const path = `products/${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`
      log(`Storage path: ${path}`)

      // Upload
      const { data: uploadData, error: uploadErr } = await supabase
        .storage
        .from('product-images')
        .upload(path, file, {
          contentType:  file.type,
          cacheControl: '3600',
          upsert:       false,
        })

      if (uploadErr) {
        log(`Upload failed: ${uploadErr.message}`, 'error')
        setUploadMsg(`Upload failed: ${uploadErr.message}`)
        continue
      }

      log(`Upload success: ${uploadData.path}`)

      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(uploadData.path)

      const publicUrl = urlData.publicUrl
      log(`Public URL: ${publicUrl}`)

      setImages(prev => [...prev, { url: publicUrl }])
      setUploadMsg('')
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(i) {
    setImages(prev => prev.filter((_, idx) => idx !== i))
  }

  // ─── Validation ────────────────────────────────────────────
  function validate() {
    const e = {}
    if (!name.trim())                          e.name      = 'Product name is required'
    if (!slug.trim())                          e.slug      = 'Slug is required'
    if (!category)                             e.category  = 'Category is required'
    const bp = parseInt(basePrice)
    const sp = parseInt(salePrice)
    const st = parseInt(stock)
    if (!basePrice || isNaN(bp) || bp <= 0)   e.basePrice = 'Valid original price required'
    if (!salePrice || isNaN(sp) || sp <= 0)   e.salePrice = 'Valid sale price required'
    if (sp > bp)                              e.salePrice = 'Sale price must be ≤ original price'
    if (stock === '' || isNaN(st) || st < 0)  e.stock     = 'Stock must be 0 or more'
    setErrors(e)
    if (Object.keys(e).length > 0) {
      log('Validation failed: ' + JSON.stringify(e), 'warn')
    }
    return Object.keys(e).length === 0
  }

  // ─── Save ──────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return

    setSaving(true)
    setErrors({})
    setDebugLogs([])

    // Verify we have a session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      log('No session — user is not authenticated', 'error')
      setErrors({ form: 'You are not logged in. Please sign in and try again.' })
      setSaving(false)
      return
    }
    log(`Session OK: user=${session.user.id}`)

    // Verify admin
    const { data: adminCheck, error: adminErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (adminErr) {
      log(`Admin check error: ${adminErr.message}`, 'error')
      setErrors({ form: 'Could not verify admin status: ' + adminErr.message })
      setSaving(false)
      return
    }

    log(`User role: ${adminCheck?.role}`)
    if (adminCheck?.role !== 'admin') {
      log('User is not admin!', 'error')
      setErrors({ form: 'You must be an admin to create/edit products. Update your role in Supabase.' })
      setSaving(false)
      return
    }

    // Build payload — only include columns that definitely exist
    const payload = {
      name:            name.trim(),
      slug:            slug.trim(),
      description:     description.trim() || null,
      category_slug:   category,
      gender:          gender,
      base_price:      parseInt(basePrice),
      sale_price:      parseInt(salePrice),
      stock_count:     parseInt(stock),
      available_sizes: sizes,
      tags:            tags,
      material:        material.trim() || null,
      care:            care.trim()     || null,
      fit:             fit.trim()      || null,
      is_active:       isActive,
      is_featured:     isFeatured,
      images:          images.map(i => i.url),
    }

    log('Payload: ' + JSON.stringify(payload))

    try {
      if (isNew) {
        log('Inserting new product…')
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select('id, name')
          .single()

        if (error) {
          log(`Insert error: code=${error.code} msg=${error.message} details=${error.details} hint=${error.hint}`, 'error')
          throw error
        }

        log(`Insert success! id=${data.id}`)
        setSaved(true)
        setTimeout(() => navigate(`/admin/products/${data.id}`), 1200)

      } else {
        log(`Updating product id=${id}…`)
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id)
          .select('id, name')
          .single()

        if (error) {
          log(`Update error: code=${error.code} msg=${error.message}`, 'error')
          throw error
        }

        log(`Update success! id=${data.id}`)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }

    } catch (err) {
      let msg = err.message ?? 'Unknown error'
      if (err.code === '23505') msg = `Slug "${slug}" already exists. Change the slug and try again.`
      if (err.code === '42501') msg = 'Permission denied. Make sure your account has the admin role in the users table.'
      if (err.code === '23502') msg = `A required field is missing. Details: ${err.details}`
      if (err.code === 'PGRST204') msg = 'No rows returned — the insert may have succeeded but RLS blocked the select. Check your products table.'
      setErrors({ form: msg })
      log(`Final error: ${msg}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ─── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="skeleton h-10 w-48" />
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16" />)}
      </div>
    )
  }

  const discount = basePrice && salePrice
    ? Math.max(0, Math.round(((parseInt(basePrice) - parseInt(salePrice)) / parseInt(basePrice)) * 100))
    : 0

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="btn-icon" aria-label="Back">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-display text-2xl text-tz-white font-light">
              {isNew ? 'Add New Product' : 'Edit Product'}
            </h1>
            {slug && (
              <p className="text-[10px] text-tz-muted font-body mt-0.5">
                /products/{slug}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && slug && (
            
            <a
              href={`/products/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <Eye size={13} />View on Site
            </a>
          )}
          <button
            onClick={() => navigate('/admin/products')}
            className="btn-secondary text-xs"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex items-center gap-2 text-sm font-body px-5 py-2.5 transition-all disabled:cursor-not-allowed ${
              saved   ? 'bg-green-500 text-white'
              : saving ? 'bg-tz-gold/60 text-tz-black cursor-wait'
              :          'bg-tz-gold text-tz-black hover:brightness-110'
            }`}
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" />Saving…</>
            ) : saved ? (
              <><Check size={14} />Saved!</>
            ) : (
              <><Save size={14} />{isNew ? 'Create Product' : 'Save Changes'}</>
            )}
          </button>
        </div>
      </div>

      {/* ── Form error ─────────────────────────────────────── */}
      <AnimatePresence>
        {errors.form && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 bg-tz-accent/10 border border-tz-accent/30 text-sm text-tz-accent font-body"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Save failed</p>
              <p className="text-xs mt-0.5 opacity-80">{errors.form}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Debug panel ────────────────────────────────────── */}
      <DebugPanel logs={debugLogs} />

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">

        {/* ── Left column ──────────────────────────────────── */}
        <div className="space-y-5">

          {/* Basic info */}
          <section className="bg-tz-dark border border-tz-border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-tz-white font-body border-b border-tz-border pb-3">
              Basic Information
            </h2>

            <FormField label="Product Name" required error={errors.name}>
              <input
                className="input-base w-full"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Onyx Oversized Tee"
                autoFocus={isNew}
              />
            </FormField>

            <FormField label="Slug" hint="auto-generated, must be unique" error={errors.slug}>
              <input
                className="input-base w-full font-mono text-xs"
                value={slug}
                onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true) }}
                placeholder="onyx-oversized-tee"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                className="input-base w-full resize-none"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the product — materials, fit, styling tips…"
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Category" required error={errors.category}>
                <select
                  className="input-base w-full cursor-pointer"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Gender">
                <div className="flex gap-2 h-[42px]">
                  {['men','women','unisex'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 text-xs font-body border-2 capitalize transition-all ${
                        gender === g
                          ? 'bg-tz-gold text-tz-black border-tz-gold font-semibold'
                          : 'border-tz-border text-tz-muted hover:border-tz-border-2 hover:text-tz-text'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-tz-dark border border-tz-border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-tz-white font-body border-b border-tz-border pb-3">
              Pricing & Inventory
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Original Price (₹)" required error={errors.basePrice}>
                <input
                  className="input-base w-full"
                  type="number"
                  min="1"
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  placeholder="1299"
                />
              </FormField>

              <FormField label="Sale Price (₹)" required error={errors.salePrice}>
                <input
                  className="input-base w-full"
                  type="number"
                  min="1"
                  value={salePrice}
                  onChange={e => setSalePrice(e.target.value)}
                  placeholder="899"
                />
              </FormField>

              <FormField label="Stock Qty" required error={errors.stock}>
                <input
                  className="input-base w-full"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  placeholder="50"
                />
              </FormField>
            </div>

            {discount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 text-xs text-green-400 font-body">
                <Check size={12} />
                Customers save {discount}% — sale price is {discount}% off original
              </div>
            )}
          </section>

          {/* Sizes */}
          <section className="bg-tz-dark border border-tz-border p-5 space-y-3">
            <h2 className="text-sm font-semibold text-tz-white font-body border-b border-tz-border pb-3">
              Available Sizes
            </h2>
            <div className="flex flex-wrap gap-2">
              {CLOTHING_SIZES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSizes(prev =>
                    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                  )}
                  className={`w-12 h-10 text-xs font-body border-2 transition-all ${
                    sizes.includes(s)
                      ? 'border-tz-gold bg-tz-gold/10 text-tz-gold font-semibold'
                      : 'border-tz-border text-tz-muted hover:border-tz-border-2 hover:text-tz-text'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {sizes.length > 0 && (
              <p className="text-[10px] text-tz-muted font-body">Selected: {sizes.join(', ')}</p>
            )}
          </section>

          {/* Material */}
          <section className="bg-tz-dark border border-tz-border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-tz-white font-body border-b border-tz-border pb-3">
              Material & Care
            </h2>
            <FormField label="Material">
              <input
                className="input-base w-full"
                value={material}
                onChange={e => setMaterial(e.target.value)}
                placeholder="e.g. 100% Ring-Spun Cotton, 240 GSM"
              />
            </FormField>
            <FormField label="Care Instructions">
              <input
                className="input-base w-full"
                value={care}
                onChange={e => setCare(e.target.value)}
                placeholder="e.g. Machine wash cold. Do not bleach."
              />
            </FormField>
            <FormField label="Fit">
              <input
                className="input-base w-full"
                value={fit}
                onChange={e => setFit(e.target.value)}
                placeholder="e.g. Oversized. Model is 6'1&quot; wearing M."
              />
            </FormField>
          </section>
        </div>

        {/* ── Right column ─────────────────────────────────── */}
        <div className="space-y-5">

          {/* Images */}
          <section className="bg-tz-dark border border-tz-border p-5 space-y-3">
            <h2 className="text-sm font-semibold text-tz-white font-body border-b border-tz-border pb-3 flex items-center justify-between">
              Images
              <span className="text-[10px] text-tz-muted font-normal">{images.length}/6</span>
            </h2>

            {/* Drop zone */}
            {images.length < 6 && (
              <div
                onClick={() => !uploading && fileRef.current?.click()}
                onDrop={e => { e.preventDefault(); if (!uploading) handleImageFiles(e.dataTransfer.files) }}
                onDragOver={e => e.preventDefault()}
                className={`border-2 border-dashed p-6 text-center transition-colors ${
                  uploading
                    ? 'border-tz-gold/50 cursor-wait'
                    : 'border-tz-border hover:border-tz-gold/50 cursor-pointer'
                } group`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="text-tz-gold animate-spin" />
                    <p className="text-xs text-tz-gold font-body">Uploading to Supabase Storage…</p>
                    <p className="text-[10px] text-tz-muted font-body">Please wait</p>
                  </div>
                ) : (
                  <>
                    <Upload size={22} className="text-tz-muted mx-auto mb-2 group-hover:text-tz-gold transition-colors" />
                    <p className="text-xs text-tz-muted font-body">
                      Drop images here or <span className="text-tz-gold">click to browse</span>
                    </p>
                    <p className="text-[10px] text-tz-muted/60 font-body mt-1">
                      JPG, PNG, WEBP · Max 5MB each · Up to 6 images
                    </p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={e => handleImageFiles(e.target.files)}
                />
              </div>
            )}

            {/* Upload message */}
            {uploadMsg && (
              <div className="flex items-start gap-2 p-3 bg-tz-accent/10 border border-tz-accent/30 text-xs text-tz-accent font-body">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span className="flex-1">{uploadMsg}</span>
                <button onClick={() => setUploadMsg('')}><X size={11} /></button>
              </div>
            )}

            {/* Image grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-[3/4] bg-tz-surface overflow-hidden group border border-tz-border/50"
                  >
                    <img
                      src={img.url}
                      alt={`Product image ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[8px] bg-tz-gold text-tz-black px-1 py-0.5 font-bold">
                        MAIN
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {images.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="aspect-[3/4] border-2 border-dashed border-tz-border hover:border-tz-gold/50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Plus size={16} className="text-tz-muted" />
                    <span className="text-[9px] text-tz-muted font-body">Add</span>
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Tags */}
          <section className="bg-tz-dark border border-tz-border p-5 space-y-3">
            <h2 className="text-sm font-semibold text-tz-white font-body border-b border-tz-border pb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTags(prev =>
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                  )}
                  className={`px-3 py-1.5 text-[10px] font-body border transition-all ${
                    tags.includes(tag)
                      ? 'bg-tz-gold/10 border-tz-gold text-tz-gold'
                      : 'border-tz-border text-tz-muted hover:border-tz-border-2 hover:text-tz-text'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* Visibility */}
          <section className="bg-tz-dark border border-tz-border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-tz-white font-body border-b border-tz-border pb-3">Visibility</h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-tz-text font-body">Active</p>
                <p className="text-[10px] text-tz-muted font-body">Visible in store</p>
              </div>
              <Toggle checked={isActive} onChange={setIsActive} label="Active" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-tz-text font-body">Featured</p>
                <p className="text-[10px] text-tz-muted font-body">Show on homepage</p>
              </div>
              <Toggle checked={isFeatured} onChange={setIsFeatured} label="Featured" />
            </div>
          </section>

          {/* Save button (mobile) */}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full flex items-center justify-center gap-2 text-sm font-body py-3 transition-all disabled:opacity-60 lg:hidden ${
              saved   ? 'bg-green-500 text-white'
              : saving ? 'bg-tz-gold/60 text-tz-black cursor-wait'
              :          'bg-tz-gold text-tz-black hover:brightness-110'
            }`}
          >
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</>
              : saved ? <><Check size={14} />Saved!</>
              : <><Save size={14} />{isNew ? 'Create Product' : 'Save Changes'}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}