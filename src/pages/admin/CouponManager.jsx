// import { useEffect, useState } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
// import {
//   Tag, Plus, Trash2, ToggleLeft, ToggleRight, Copy,
//   Check, X, Percent, Users
// } from 'lucide-react'
// import { supabase } from '@/lib/supabase'
// import toast from 'react-hot-toast'

// const EMPTY_FORM = {
//   code:            '',
//   type:            'percent',   // DB allows: 'percent' | 'flat'
//   value:           '',
//   min_order_value: '',
//   max_uses:        '',
//   expires_at:      '',
// }

// export default function CouponManager() {
//   const [coupons,  setCoupons]  = useState([])
//   const [loading,  setLoading]  = useState(true)
//   const [showForm, setShowForm] = useState(false)
//   const [form,     setForm]     = useState(EMPTY_FORM)
//   const [saving,   setSaving]   = useState(false)
//   const [copiedId, setCopiedId] = useState(null)

//   // ── Load ───────────────────────────────────────────────────────────────────
//   const load = async () => {
//     setLoading(true)
//     const { data } = await supabase
//       .from('coupons')
//       .select('*')
//       .order('created_at', { ascending: false })
//     if (data) setCoupons(data)
//     setLoading(false)
//   }

//   useEffect(() => { load() }, [])

//   // ── Create ─────────────────────────────────────────────────────────────────
//   const handleCreate = async () => {
//     if (!form.code.trim()) { toast.error('Enter a coupon code'); return }
//     if (!form.value || Number(form.value) <= 0) { toast.error('Enter a valid value'); return }
//     if (form.type === 'percent' && Number(form.value) > 100) {
//       toast.error('Percentage cannot exceed 100'); return
//     }

//     setSaving(true)
//     const payload = {
//       code:           form.code.trim().toUpperCase(),
//       discount_type:  form.type,
//       discount_value: Number(form.value),
//       min_order:      form.min_order_value ? Number(form.min_order_value) : 0,
//       max_uses:       form.max_uses ? Number(form.max_uses) : null,
//       expires_at:     form.expires_at || null,
//       is_active:      true,
//     }

//     const { error } = await supabase.from('coupons').insert(payload)
//     if (error) {
//       if (error.code === '23505') toast.error('Coupon code already exists')
//       else toast.error('Failed to create coupon')
//       console.error('Coupon insert error:', error)
//     } else {
//       toast.success('Coupon created!')
//       setForm(EMPTY_FORM)
//       setShowForm(false)
//       load()
//     }
//     setSaving(false)
//   }

//   // ── Toggle active ──────────────────────────────────────────────────────────
//   const handleToggle = async (coupon) => {
//     const { error } = await supabase
//       .from('coupons')
//       .update({ is_active: !coupon.is_active })
//       .eq('id', coupon.id)

//     if (error) toast.error('Failed to update')
//     else {
//       setCoupons(cs => cs.map(c =>
//         c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
//       ))
//     }
//   }

//   // ── Delete ─────────────────────────────────────────────────────────────────
//   const handleDelete = async (id) => {
//     if (!confirm('Delete this coupon? This cannot be undone.')) return
//     const { error } = await supabase.from('coupons').delete().eq('id', id)

//     if (error) toast.error('Failed to delete')
//     else {
//       setCoupons(cs => cs.filter(c => c.id !== id))
//       toast.success('Deleted')
//     }
//   }

//   // ── Copy code ──────────────────────────────────────────────────────────────
//   const handleCopy = (code, id) => {
//     navigator.clipboard.writeText(code)
//     setCopiedId(id)
//     setTimeout(() => setCopiedId(null), 2000)
//     toast.success('Code copied!')
//   }

//   // ── Status helper ──────────────────────────────────────────────────────────
//   const getStatus = (c) => {
//     if (!c.is_active) return { label: 'Inactive', cls: 'bg-tz-border/40 text-tz-muted' }
//     if (c.expires_at && new Date(c.expires_at) < new Date())
//       return { label: 'Expired', cls: 'bg-red-500/10 text-red-400' }
//     if (c.max_uses && c.uses_count >= c.max_uses)
//       return { label: 'Used up', cls: 'bg-amber-500/10 text-amber-400' }
//     return { label: 'Active', cls: 'bg-emerald-500/10 text-emerald-400' }
//   }

//   return (
//     <div className="p-6 max-w-5xl mx-auto">

//       {/* Header */}
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="font-display text-2xl font-bold text-tz-white mb-1">Coupons</h1>
//           <p className="text-tz-muted text-sm">Create and manage discount codes</p>
//         </div>
//         <button
//           onClick={() => setShowForm(o => !o)}
//           className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl"
//         >
//           <Plus className="w-4 h-4" />
//           New Coupon
//         </button>
//       </div>

//       {/* Create form */}
//       <AnimatePresence>
//         {showForm && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: 'auto' }}
//             exit={{ opacity: 0, height: 0 }}
//             className="overflow-hidden mb-6"
//           >
//             <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-6">

//               <div className="flex items-center justify-between mb-5">
//                 <h2 className="text-tz-white font-semibold">New Coupon</h2>
//                 <button onClick={() => setShowForm(false)} className="text-tz-muted hover:text-tz-white">
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>

//               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

//                 <div className="col-span-2 md:col-span-1">
//                   <label className="label-base">Code</label>
//                   <input
//                     className="input-base uppercase"
//                     placeholder="e.g. SAVE20"
//                     value={form.code}
//                     onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
//                   />
//                 </div>

//                 <div>
//                   <label className="label-base">Type</label>
//                   <select
//                     className="input-base"
//                     value={form.type}
//                     onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
//                   >
//                     <option value="percent">Percentage (%)</option>
//                     <option value="flat">Fixed Amount (₹)</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="label-base">
//                     {form.type === 'percent' ? 'Discount %' : 'Discount ₹'}
//                   </label>
//                   <input
//                     type="number"
//                     className="input-base"
//                     placeholder={form.type === 'percent' ? '20' : '200'}
//                     value={form.value}
//                     onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
//                   />
//                 </div>

//                 <div>
//                   <label className="label-base">Min Order (₹)</label>
//                   <input
//                     type="number"
//                     className="input-base"
//                     placeholder="0"
//                     value={form.min_order_value}
//                     onChange={e => setForm(f => ({ ...f, min_order_value: e.target.value }))}
//                   />
//                 </div>

//                 <div>
//                   <label className="label-base">Max Uses</label>
//                   <input
//                     type="number"
//                     className="input-base"
//                     placeholder="Unlimited"
//                     value={form.max_uses}
//                     onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
//                   />
//                 </div>

//                 <div>
//                   <label className="label-base">Expires At</label>
//                   <input
//                     type="datetime-local"
//                     className="input-base"
//                     value={form.expires_at}
//                     onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
//                   />
//                 </div>

//               </div>

//               <div className="flex justify-end gap-3 mt-5">
//                 <button
//                   onClick={() => { setForm(EMPTY_FORM); setShowForm(false) }}
//                   className="btn-secondary px-4 py-2 text-sm rounded-xl"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleCreate}
//                   disabled={saving}
//                   className="btn-primary px-4 py-2 text-sm rounded-xl disabled:opacity-60"
//                 >
//                   {saving ? 'Creating…' : 'Create Coupon'}
//                 </button>
//               </div>

//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Table */}
//       {loading ? (
//         <div className="flex items-center justify-center py-24">
//           <motion.div
//             className="w-8 h-8 rounded-full border-2 border-tz-gold border-t-transparent"
//             animate={{ rotate: 360 }}
//             transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
//           />
//         </div>
//       ) : coupons.length === 0 ? (
//         <div className="text-center py-24 text-tz-muted">
//           <Tag className="w-12 h-12 mx-auto mb-4 opacity-20" />
//           <p>No coupons yet. Create your first one above.</p>
//         </div>
//       ) : (
//         <div className="bg-tz-black/40 border border-tz-border rounded-2xl overflow-hidden">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-tz-border">
//                 <th className="text-left px-5 py-3.5 text-tz-muted text-xs uppercase tracking-wider font-medium">Code</th>
//                 <th className="text-left px-5 py-3.5 text-tz-muted text-xs uppercase tracking-wider font-medium">Discount</th>
//                 <th className="text-left px-5 py-3.5 text-tz-muted text-xs uppercase tracking-wider font-medium hidden md:table-cell">Min Order</th>
//                 <th className="text-left px-5 py-3.5 text-tz-muted text-xs uppercase tracking-wider font-medium hidden md:table-cell">Usage</th>
//                 <th className="text-left px-5 py-3.5 text-tz-muted text-xs uppercase tracking-wider font-medium hidden lg:table-cell">Expires</th>
//                 <th className="text-left px-5 py-3.5 text-tz-muted text-xs uppercase tracking-wider font-medium">Status</th>
//                 <th className="text-right px-5 py-3.5 text-tz-muted text-xs uppercase tracking-wider font-medium">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {coupons.map((c, i) => {
//                 const status = getStatus(c)
//                 return (
//                   <tr
//                     key={c.id}
//                     className={`border-b border-tz-border/40 ${i % 2 === 0 ? '' : 'bg-tz-black/20'}`}
//                   >
//                     {/* Code */}
//                     <td className="px-5 py-3.5">
//                       <div className="flex items-center gap-2">
//                         <code className="text-tz-gold font-mono font-bold text-sm bg-tz-gold/5 border border-tz-gold/20 px-2 py-0.5 rounded">
//                           {c.code}
//                         </code>
//                         <button
//                           onClick={() => handleCopy(c.code, c.id)}
//                           className="text-tz-muted hover:text-tz-white transition-colors"
//                         >
//                           {copiedId === c.id
//                             ? <Check className="w-3.5 h-3.5 text-emerald-400" />
//                             : <Copy className="w-3.5 h-3.5" />
//                           }
//                         </button>
//                       </div>
//                     </td>

//                     {/* Discount */}
//                     <td className="px-5 py-3.5">
//                       <div className="flex items-center gap-1.5">
//                         {c.discount_type === 'percent'
//                           ? <Percent className="w-3.5 h-3.5 text-tz-muted" />
//                           : <span className="text-tz-muted text-xs">₹</span>
//                         }
//                         <span className="text-tz-white font-semibold">
//                           {c.discount_type === 'percent'
//                             ? `${c.discount_value}% off`
//                             : `₹${c.discount_value} off`
//                           }
//                         </span>
//                       </div>
//                     </td>

//                     {/* Min order */}
//                     <td className="px-5 py-3.5 hidden md:table-cell text-tz-muted text-sm">
//                       {c.min_order > 0 ? `₹${c.min_order}` : '—'}
//                     </td>

//                     {/* Usage */}
//                     <td className="px-5 py-3.5 hidden md:table-cell text-tz-muted text-sm">
//                       <div className="flex items-center gap-1">
//                         <Users className="w-3.5 h-3.5" />
//                         {c.uses_count ?? 0}{c.max_uses ? ` / ${c.max_uses}` : ''}
//                       </div>
//                     </td>

//                     {/* Expires */}
//                     <td className="px-5 py-3.5 hidden lg:table-cell text-tz-muted text-sm">
//                       {c.expires_at
//                         ? new Date(c.expires_at).toLocaleDateString('en-IN', {
//                             day: '2-digit', month: 'short', year: 'numeric'
//                           })
//                         : 'Never'
//                       }
//                     </td>

//                     {/* Status */}
//                     <td className="px-5 py-3.5">
//                       <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.cls}`}>
//                         {status.label}
//                       </span>
//                     </td>

//                     {/* Actions */}
//                     <td className="px-5 py-3.5">
//                       <div className="flex items-center justify-end gap-2">
//                         <button
//                           onClick={() => handleToggle(c)}
//                           className="text-tz-muted hover:text-tz-white transition-colors"
//                           title={c.is_active ? 'Deactivate' : 'Activate'}
//                         >
//                           {c.is_active
//                             ? <ToggleRight className="w-5 h-5 text-emerald-400" />
//                             : <ToggleLeft className="w-5 h-5" />
//                           }
//                         </button>
//                         <button
//                           onClick={() => handleDelete(c.id)}
//                           className="text-tz-muted hover:text-red-400 transition-colors"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 )
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   )
// }



//new code-
// src/pages/admin/Coupons.jsx — v4 (Production-Grade)
//
// Security model:
//   • validate_coupon(code, subtotal) — SECURITY DEFINER RPC computes discount server-side.
//     Frontend receives discount_amount only; never calculates it.
//   • record_coupon_use() — called server-side after payment. DB enforces
//     unique(coupon_id, user_id, order_id) so no double-use even if frontend is bypassed.
//   • get_eligible_coupons(subtotal) — runs all eligibility checks server-side,
//     returns only coupons the current user can actually redeem.
//
// DB column names (confirmed schema):
//   code, type, value, min_order, max_uses,
//   expires_at, is_active, uses_count, first_order_only,
//   max_uses_per_user, min_orders_required, min_spent_required, description

import { useEffect, useState }     from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag, Plus, Trash2, ToggleLeft, ToggleRight,
  Copy, Check, X, Percent, Users, Info,
} from 'lucide-react'
import { supabase }  from '@/lib/supabase'
import AdminLayout   from '@/components/layout/AdminLayout'
import toast         from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────

const DISCOUNT_TYPES = [
  { value: 'percent', label: 'Percentage (%)' },
  { value: 'flat',    label: 'Fixed Amount (₹)' },
]

const EMPTY_FORM = {
  code:                '',
  discount_type:       'percent',   // form state key; maps to DB column `type` in payload
  discount_value:      '',          // form state key; maps to DB column `value` in payload
  description:         '',
  min_order_value:     '',          // form state key; maps to DB column `min_order` in payload
  max_uses:            '',
  expires_at:          '',
  first_order_only:    false,
  max_uses_per_user:   '',
  min_orders_required: '',
  min_spent_required:  '',
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex items-center">
      <Info
        size={12}
        className="text-tz-muted ml-1 cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52
          bg-tz-surface border border-tz-border text-tz-muted text-[10px] font-body
          px-2.5 py-1.5 rounded z-50 pointer-events-none leading-relaxed shadow-xl">
          {text}
        </span>
      )}
    </span>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label, tip }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors
          ${value ? 'bg-tz-gold' : 'bg-tz-border'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
          transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </div>
      <span className="text-tz-text text-sm font-body flex items-center">
        {label}
        {tip && <Tip text={tip} />}
      </span>
    </label>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CouponManager() {

  const [coupons,  setCoupons]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error('Failed to load coupons')
    else setCoupons(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    if (!form.code.trim()) {
      toast.error('Enter a coupon code'); return false
    }
    if (!form.discount_value || Number(form.discount_value) <= 0) {
      toast.error('Enter a valid discount value'); return false
    }
    if (form.discount_type === 'percent' && Number(form.discount_value) > 100) {
      toast.error('Percentage discount cannot exceed 100%'); return false
    }
    return true
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (saving) return
    if (!validate()) return
    setSaving(true)

    // DB column names: type, value, min_order (not discount_type, discount_value, min_order_value)
    const payload = {
      code:                form.code.trim().toUpperCase(),
      type:                form.discount_type,
      value:               Number(form.discount_value),
      description:         form.description.trim() || null,
      min_order:           form.min_order_value     ? parseInt(form.min_order_value, 10)    : 0,
      max_uses:            form.max_uses             ? parseInt(form.max_uses, 10)            : null,
      expires_at:          form.expires_at           || null,
      first_order_only:    form.first_order_only,
      max_uses_per_user:   form.max_uses_per_user    ? parseInt(form.max_uses_per_user, 10)  : null,
      min_orders_required: form.min_orders_required  ? parseInt(form.min_orders_required, 10) : 0,
      min_spent_required:  form.min_spent_required   ? parseInt(form.min_spent_required, 10)  : 0,
      is_active:           true,
    }

    const { error } = await supabase.from('coupons').insert(payload)

    if (error) {
      console.error('Coupon insert error:', error)
      if (error.code === '23505') toast.error('Coupon code already exists')
      else toast.error(error.message || 'Failed to create coupon')
    } else {
      toast.success('Coupon created!')
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    }
    setSaving(false)
  }

  // ── Toggle Active ──────────────────────────────────────────────────────────

  const handleToggle = async (coupon) => {
    if (!coupon?.id) return
    const next = !coupon.is_active
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: next })
      .eq('id', coupon.id)
    if (error) toast.error('Failed to update')
    else setCoupons(cs => cs.map(c => c.id === coupon.id ? { ...c, is_active: next } : c))
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon? Usage history will also be removed.')) return
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) toast.error('Failed to delete')
    else { setCoupons(cs => cs.filter(c => c.id !== id)); toast.success('Deleted') }
  }

  // ── Copy Code ──────────────────────────────────────────────────────────────

  const handleCopy = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Code copied!')
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getStatus = (c) => {
    if (!c.is_active)
      return { label: 'Inactive', cls: 'bg-tz-border/40 text-tz-muted' }
    if (c.expires_at && new Date(c.expires_at) < new Date())
      return { label: 'Expired',  cls: 'bg-red-500/10 text-red-400' }
    if (c.max_uses != null && c.uses_count >= c.max_uses)
      return { label: 'Used up',  cls: 'bg-amber-500/10 text-amber-400' }
    return   { label: 'Active',   cls: 'bg-emerald-500/10 text-emerald-400' }
  }

  // Uses actual DB column names: c.type, c.value, c.min_order
  const getEligibilityTags = (c) => {
    const tags = []
    if (c.first_order_only)                  tags.push('1st order')
    if (c.max_uses_per_user === 1)           tags.push('1 use/user')
    else if (c.max_uses_per_user > 1)        tags.push(`${c.max_uses_per_user}×/user`)
    if (c.min_orders_required > 0)           tags.push(`≥${c.min_orders_required} orders`)
    if (c.min_spent_required  > 0)           tags.push(`≥₹${c.min_spent_required} spent`)
    if (c.min_order           > 0)           tags.push(`Min ₹${c.min_order}`)
    return tags
  }

  // Live eligibility summary while filling the form
  const formEligibilitySummary = [
    form.first_order_only                                    && 'First order only',
    form.max_uses_per_user  && `Max ${form.max_uses_per_user} use(s) per user`,
    form.min_order_value    && `Min cart ₹${form.min_order_value}`,
    form.min_orders_required && `User must have ≥${form.min_orders_required} past order(s)`,
    form.min_spent_required  && `User must have spent ≥₹${form.min_spent_required}`,
  ].filter(Boolean)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-tz-white mb-1">Coupons</h1>
            <p className="text-tz-muted text-sm">
              Create and manage discount codes with eligibility rules
            </p>
          </div>
          <button
            onClick={() => { setForm(EMPTY_FORM); setShowForm(o => !o) }}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl"
          >
            <Plus className="w-4 h-4" />
            New Coupon
          </button>
        </div>

        {/* ── Create Form ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-tz-black/40 border border-tz-border rounded-2xl p-6 space-y-6">

                <div className="flex items-center justify-between">
                  <h2 className="text-tz-white font-semibold text-lg">New Coupon</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-tz-muted hover:text-tz-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Section 1 — Core */}
                <div>
                  <p className="text-[10px] font-bold text-tz-muted uppercase tracking-widest mb-3">
                    Core Settings
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                    <div className="col-span-2 md:col-span-1">
                      <label className="label-base">Code *</label>
                      <input
                        className="input-base uppercase tracking-widest"
                        placeholder="e.g. SAVE20"
                        value={form.code}
                        onChange={e => set('code', e.target.value.replace(/\s+/g, '').toUpperCase())}
                      />
                    </div>

                    <div>
                      <label className="label-base">Type *</label>
                      <select
                        className="input-base"
                        value={form.discount_type}
                        onChange={e => set('discount_type', e.target.value)}
                      >
                        {DISCOUNT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label-base">
                        {form.discount_type === 'percent' ? 'Discount %' : 'Discount ₹'} *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="input-base"
                        placeholder={form.discount_type === 'percent' ? '20' : '200'}
                        value={form.discount_value}
                        onChange={e => set('discount_value', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label-base">Expires At</label>
                      <input
                        type="datetime-local"
                        className="input-base"
                        value={form.expires_at}
                        onChange={e => set('expires_at', e.target.value)}
                      />
                    </div>

                    <div className="col-span-2 md:col-span-4">
                      <label className="label-base">
                        Description{' '}
                        <span className="text-tz-muted/60">(shown to user at checkout)</span>
                      </label>
                      <input
                        className="input-base"
                        placeholder="e.g. Welcome offer — 20% off your first order"
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                      />
                    </div>

                  </div>
                </div>

                {/* Section 2 — Usage Limits */}
                <div>
                  <p className="text-[10px] font-bold text-tz-muted uppercase tracking-widest mb-3">
                    Usage Limits
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                    <div>
                      <label className="label-base flex items-center">
                        Global Max Uses
                        <Tip text="Maximum total uses across all users. Leave blank for unlimited." />
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="input-base"
                        placeholder="Unlimited"
                        value={form.max_uses}
                        onChange={e => set('max_uses', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label-base flex items-center">
                        Max Uses Per User
                        <Tip text="How many times a single account can use this coupon. Set to 1 for one-time use per user." />
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="input-base"
                        placeholder="Unlimited"
                        value={form.max_uses_per_user}
                        onChange={e => set('max_uses_per_user', e.target.value)}
                      />
                    </div>

                    <div className="flex items-end pb-1">
                      <Toggle
                        value={form.first_order_only}
                        onChange={v => set('first_order_only', v)}
                        label="First Order Only"
                        tip="Coupon can only be redeemed by users who have never placed an order."
                      />
                    </div>

                  </div>
                </div>

                {/* Section 3 — Customer Eligibility */}
                <div>
                  <p className="text-[10px] font-bold text-tz-muted uppercase tracking-widest mb-3">
                    Customer Eligibility
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                    <div>
                      <label className="label-base flex items-center">
                        Min Order Value (₹)
                        <Tip text="Cart subtotal must be at least this amount for the coupon to apply." />
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="input-base"
                        placeholder="0 = no minimum"
                        value={form.min_order_value}
                        onChange={e => set('min_order_value', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label-base flex items-center">
                        Min Past Orders
                        <Tip text="User must have completed at least this many orders. Use for loyalty rewards (e.g. set to 5)." />
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="input-base"
                        placeholder="0 = no requirement"
                        value={form.min_orders_required}
                        onChange={e => set('min_orders_required', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label-base flex items-center">
                        Min Historical Spend (₹)
                        <Tip text="User must have spent at least this amount total across all past orders." />
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="input-base"
                        placeholder="0 = no requirement"
                        value={form.min_spent_required}
                        onChange={e => set('min_spent_required', e.target.value)}
                      />
                    </div>

                  </div>

                  {/* Live eligibility preview */}
                  {formEligibilitySummary.length > 0 && (
                    <div className="mt-3 bg-tz-black/40 border border-tz-border px-4 py-3 rounded-xl
                      text-xs text-tz-muted font-body leading-relaxed">
                      <span className="text-tz-white font-semibold">Eligibility preview: </span>
                      {formEligibilitySummary.join(' · ')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-tz-border">
                  <button
                    onClick={() => { setForm(EMPTY_FORM); setShowForm(false) }}
                    className="btn-secondary px-5 py-2.5 text-sm rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="btn-primary px-5 py-2.5 text-sm rounded-xl
                      disabled:opacity-60 flex items-center gap-2"
                  >
                    {saving && (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white
                        rounded-full animate-spin" />
                    )}
                    {saving ? 'Creating…' : 'Create Coupon'}
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <motion.div
              className="w-8 h-8 rounded-full border-2 border-tz-gold border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
          </div>

        ) : coupons.length === 0 ? (
          <div className="text-center py-24 text-tz-muted">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No coupons yet. Create your first one above.</p>
          </div>

        ) : (
          <div className="bg-tz-black/40 border border-tz-border rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-tz-border">
                  {['Code', 'Discount', 'Eligibility', 'Usage', 'Expires', 'Status', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-tz-muted text-xs uppercase tracking-wider font-medium
                        ${i === 6 ? 'text-right' : 'text-left'}
                        ${h === 'Expires' ? 'hidden lg:table-cell' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => {
                  const status   = getStatus(c)
                  const eligTags = getEligibilityTags(c)

                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-tz-border/40 hover:bg-tz-gold/[0.02] transition-colors
                        ${i % 2 === 1 ? 'bg-tz-black/20' : ''}`}
                    >

                      {/* Code + description */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <code className="text-tz-gold font-mono font-bold text-sm
                            bg-tz-gold/5 border border-tz-gold/20 px-2 py-0.5 rounded">
                            {c.code}
                          </code>
                          <button
                            onClick={() => handleCopy(c.code, c.id)}
                            className="text-tz-muted hover:text-tz-white transition-colors"
                            title="Copy code"
                          >
                            {copiedId === c.id
                              ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                              : <Copy  className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                        {c.description && (
                          <p className="text-tz-muted text-[10px] font-body mt-1
                            max-w-[200px] leading-snug">
                            {c.description}
                          </p>
                        )}
                      </td>

                      {/* Discount — DB columns: c.type, c.value */}
                      <td className="px-5 py-3.5">
                        <span className="text-tz-white font-semibold text-sm">
                          {c.type === 'percent'
                            ? `${c.value}%`
                            : `₹${c.value}`}
                        </span>
                        <span className="text-tz-muted text-xs ml-1">off</span>
                      </td>

                      {/* Eligibility */}
                      <td className="px-5 py-3.5">
                        {eligTags.length === 0 ? (
                          <span className="text-tz-muted text-xs">Anyone</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {eligTags.map(tag => (
                              <span
                                key={tag}
                                className="text-[9px] font-bold font-body px-2 py-0.5 rounded
                                  bg-tz-gold/10 text-tz-gold border border-tz-gold/20 whitespace-nowrap"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="px-5 py-3.5 text-tz-muted text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {c.uses_count ?? 0}
                          {c.max_uses != null ? ` / ${c.max_uses}` : ''}
                        </div>
                      </td>

                      {/* Expires */}
                      <td className="px-5 py-3.5 hidden lg:table-cell text-tz-muted text-sm">
                        {c.expires_at
                          ? new Date(c.expires_at).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : 'Never'
                        }
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(c)}
                            className="text-tz-muted hover:text-tz-white transition-colors"
                            title={c.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {c.is_active
                              ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                              : <ToggleLeft  className="w-5 h-5" />
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-tz-muted hover:text-red-400 transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    
  )
}
