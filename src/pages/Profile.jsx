// src/pages/Profile.jsx
// FIXED: ProfileTab.handleSave now only sends { full_name, avatar_url } to updateProfile.
// Removed phone + city from the save payload — those columns don't exist in the users table.
// The Addresses tab already stores phone/city correctly in the separate `addresses` table.
// Everything else (tabs, UI, AddressesTab, SecurityTab) is identical to your original.

import { useState, useEffect, useRef }  from 'react'
import { motion, AnimatePresence }       from 'framer-motion'
import {
  User, MapPin, Lock, Camera, Save,
  Plus, Edit2, Trash2, Check, AlertCircle,
  Loader2, Home, Briefcase, MoreHorizontal,
  Eye, EyeOff, Shield
} from 'lucide-react'
import useAuthStore  from '@/store/authStore'
import { supabase }  from '@/lib/supabase'
import { getInitials } from '@/lib/utils'

const TABS = [
  { id: 'profile',   label: 'Profile',   icon: User    },
  { id: 'addresses', label: 'Addresses', icon: MapPin  },
  { id: 'security',  label: 'Security',  icon: Lock    },
]

// ─── Reusable Field ───────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="label-base">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-tz-accent mt-1.5 font-body">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ msg, type = 'success' }) {
  if (!msg) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 border shadow-modal text-xs font-body ${
        type === 'success'
          ? 'bg-tz-dark border-tz-success/30 text-tz-success'
          : 'bg-tz-dark border-tz-accent/30 text-tz-accent'
      }`}
    >
      {type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
      {msg}
    </motion.div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────
function ProfileTab() {
  const user          = useAuthStore(s => s.user)
  const profile       = useAuthStore(s => s.profile)
  const updateProfile = useAuthStore(s => s.updateProfile)

  const [fullName,  setFullName]  = useState(profile?.full_name ?? '')
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
    }
  }, [profile])

  // ── Save — only columns that exist in the users table ──────
  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile({
        full_name:  fullName.trim() || null,
        // avatar_url is saved immediately on upload, no need to resend here
        // phone and city are NOT columns in the users table — save those in Addresses
      })
      setToast('Profile updated successfully')
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      setToast('Failed to update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Avatar upload ──────────────────────────────────────────
  async function handleAvatarUpload(file) {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 3 * 1024 * 1024) { setToast('Max avatar size is 3MB'); return }
    setUploading(true)

    const ext      = file.name.split('.').pop()
    const filename = `${user.id}/avatar-${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(filename, file, { upsert: true, contentType: file.type })

    if (upErr) {
      setToast('Avatar upload failed: ' + upErr.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filename)
    await updateProfile({ avatar_url: publicUrl })
    setToast('Avatar updated!')
    setTimeout(() => setToast(null), 3000)
    setUploading(false)
  }

  const initials = getInitials(profile?.full_name ?? user?.email ?? 'U')

  return (
    <div className="space-y-6">
      <AnimatePresence><Toast msg={toast} /></AnimatePresence>

      {/* Avatar */}
      <div className="bg-tz-dark border border-tz-border p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 bg-tz-gold/10 border border-tz-gold/30 overflow-hidden flex items-center justify-center">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="font-display text-2xl text-tz-gold font-light">{initials}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-tz-gold text-tz-black flex items-center justify-center hover:brightness-110 transition-all"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleAvatarUpload(e.target.files[0])}
            />
          </div>
          <div>
            <h3 className="font-body text-base font-semibold text-tz-white">
              {profile?.full_name ?? 'Your Name'}
            </h3>
            <p className="text-xs text-tz-muted font-body">{user?.email}</p>
            {profile?.role === 'admin' && (
              <span className="inline-block mt-1.5 text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 bg-tz-gold/10 border border-tz-gold/30 text-tz-gold">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-tz-dark border border-tz-border p-6 space-y-4">
        <h3 className="font-body text-sm font-semibold text-tz-white">Personal Information</h3>

        <Field label="Full Name">
          <input
            className="input-base w-full"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Arjun Sharma"
          />
        </Field>

        <Field label="Email">
          <input
            className="input-base w-full opacity-60 cursor-not-allowed"
            value={user?.email ?? ''}
            readOnly
          />
          <p className="text-[10px] text-tz-muted font-body mt-1">Email cannot be changed here</p>
        </Field>

        <p className="text-[11px] text-tz-muted font-body border border-tz-border/50 bg-tz-surface/20 px-3 py-2 rounded">
          💡 Phone number and address can be saved in the <strong className="text-tz-text">Addresses</strong> tab below.
        </p>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 text-sm font-body bg-tz-gold text-tz-black px-5 py-2.5 hover:brightness-110 disabled:opacity-60 transition-all"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><Save size={14} />Save Changes</>}
        </button>
      </div>
    </div>
  )
}

// ─── Addresses Tab ────────────────────────────────────────────
function AddressesTab() {
  const user = useAuthStore(s => s.user)

  const [addresses,  setAddresses]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editingId,  setEditingId]  = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState(null)

  const emptyForm = { full_name:'', phone:'', address_line:'', city:'', state:'', pincode:'', type:'home', is_default:false }
  const [form,       setForm]       = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})

  function showMsg(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function loadAddresses() {
    setLoading(true)
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
    setAddresses(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadAddresses() }, []) // eslint-disable-line

  function validateForm() {
    const e = {}
    if (!form.full_name.trim())  e.full_name    = 'Name is required'
    if (!form.phone.trim() || form.phone.trim().length < 10) e.phone = 'Valid phone required'
    if (!form.address_line.trim()) e.address_line = 'Address is required'
    if (!form.city.trim())       e.city         = 'City is required'
    if (!form.state.trim())      e.state        = 'State is required'
    if (form.pincode.trim().length !== 6) e.pincode = '6-digit pincode required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validateForm()) return
    setSaving(true)

    const payload = { ...form, user_id: user.id }

    if (editingId) {
      const { error } = await supabase.from('addresses').update(payload).eq('id', editingId)
      if (!error) {
        showMsg('Address updated')
        await loadAddresses()
        setShowForm(false); setEditingId(null)
      }
    } else {
      if (form.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
      }
      const { error } = await supabase.from('addresses').insert(payload)
      if (!error) {
        showMsg('Address added')
        await loadAddresses()
        setShowForm(false)
      }
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    setDeletingId(id)
    await supabase.from('addresses').delete().eq('id', id)
    setAddresses(prev => prev.filter(a => a.id !== id))
    setDeletingId(null)
    showMsg('Address removed')
  }

  async function setDefault(id) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true  }).eq('id', id)
    await loadAddresses()
  }

  function startEdit(addr) {
    setForm({
      full_name:    addr.full_name    ?? '',
      phone:        addr.phone        ?? '',
      address_line: addr.address_line ?? '',
      city:         addr.city         ?? '',
      state:        addr.state        ?? '',
      pincode:      addr.pincode      ?? '',
      type:         addr.type         ?? 'home',
      is_default:   addr.is_default   ?? false,
    })
    setEditingId(addr.id)
    setShowForm(true)
    setFormErrors({})
  }

  const TYPE_ICONS = { home: Home, work: Briefcase, other: MoreHorizontal }

  return (
    <div className="space-y-4">
      <AnimatePresence><Toast msg={toast} /></AnimatePresence>

      <div className="flex items-center justify-between">
        <h3 className="font-body text-sm font-semibold text-tz-white">Saved Addresses</h3>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setFormErrors({}); setShowForm(true) }}
          className="flex items-center gap-2 text-xs text-tz-gold hover:text-tz-gold-light font-body transition-colors"
        >
          <Plus size={13} />Add New
        </button>
      </div>

      {/* Address form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-tz-dark border border-tz-gold/30 p-5 space-y-4"
          >
            <p className="text-xs font-semibold text-tz-white font-body">
              {editingId ? 'Edit Address' : 'New Address'}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" error={formErrors.full_name}>
                <input className="input-base w-full" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Arjun Sharma" />
              </Field>
              <Field label="Phone" error={formErrors.phone}>
                <input className="input-base w-full" type="tel" maxLength={10}
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
              </Field>
            </div>

            <Field label="Address" error={formErrors.address_line}>
              <textarea className="input-base w-full resize-none" rows={2}
                value={form.address_line}
                onChange={e => setForm(f => ({ ...f, address_line: e.target.value }))}
                placeholder="Flat/House No., Street, Area" />
            </Field>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="City" error={formErrors.city}>
                <input className="input-base w-full" value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Mumbai" />
              </Field>
              <Field label="State" error={formErrors.state}>
                <input className="input-base w-full" value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="Maharashtra" />
              </Field>
              <Field label="Pincode" error={formErrors.pincode}>
                <input className="input-base w-full" type="tel" maxLength={6}
                  value={form.pincode}
                  onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="400001" />
              </Field>
            </div>

            {/* Type + default */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                {['home','work','other'].map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-body border-2 capitalize transition-all ${
                      form.type === t ? 'border-tz-gold bg-tz-gold/10 text-tz-gold' : 'border-tz-border text-tz-muted hover:border-tz-border-2'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-tz-muted font-body">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                  className="accent-tz-gold"
                />
                Set as default
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="btn-secondary flex-1 justify-center text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-tz-gold text-tz-black text-xs font-body py-2.5 hover:brightness-110 disabled:opacity-60 transition-all"
              >
                {saving ? <><Loader2 size={12} className="animate-spin" />Saving…</> : <><Check size={12} />Save Address</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-tz-dark border border-tz-border p-8 text-center">
          <MapPin size={28} className="text-tz-muted mx-auto mb-3" />
          <p className="text-sm text-tz-muted font-body">No saved addresses yet.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-xs text-tz-gold font-body underline">
            Add your first address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => {
            const Icon = TYPE_ICONS[addr.type ?? 'home'] ?? Home
            return (
              <motion.div
                key={addr.id} layout
                className={`bg-tz-dark border p-5 flex gap-4 transition-colors ${
                  addr.is_default ? 'border-tz-gold/40' : 'border-tz-border'
                }`}
              >
                <div className="w-9 h-9 bg-tz-gold/10 border border-tz-gold/20 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-tz-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-xs font-semibold text-tz-white font-body">{addr.full_name}</p>
                    <span className="text-[9px] capitalize text-tz-muted border border-tz-border px-1.5 py-0.5 font-body">
                      {addr.type}
                    </span>
                    {addr.is_default && (
                      <span className="text-[9px] text-tz-gold border border-tz-gold/30 bg-tz-gold/10 px-1.5 py-0.5 font-body font-bold tracking-wide">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-tz-muted font-body">{addr.phone}</p>
                  <p className="text-xs text-tz-muted font-body mt-0.5">
                    {[addr.address_line, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    {!addr.is_default && (
                      <button onClick={() => setDefault(addr.id)}
                        className="text-[10px] text-tz-gold hover:text-tz-gold-light font-body transition-colors">
                        Set as default
                      </button>
                    )}
                    <button onClick={() => startEdit(addr)}
                      className="text-[10px] text-tz-muted hover:text-tz-text font-body flex items-center gap-1 transition-colors">
                      <Edit2 size={10} />Edit
                    </button>
                    <button onClick={() => handleDelete(addr.id)} disabled={deletingId === addr.id}
                      className="text-[10px] text-tz-muted hover:text-tz-accent font-body flex items-center gap-1 transition-colors disabled:opacity-50">
                      {deletingId === addr.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Security Tab ─────────────────────────────────────────────
function SecurityTab() {
  const updatePassword = useAuthStore(s => s.updatePassword)

  const [current,   setCurrent]   = useState('')
  const [newPass,   setNewPass]   = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showCur,   setShowCur]   = useState(false)
  const [showNew,   setShowNew]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState(null)
  const [toastType, setToastType] = useState('success')
  const [errors,    setErrors]    = useState({})

  function validate() {
    const e = {}
    if (!current.trim())     e.current = 'Current password is required'
    if (newPass.length < 8)  e.newPass = 'New password must be at least 8 characters'
    if (newPass !== confirm)  e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleChange() {
    if (!validate()) return
    setSaving(true)

    // Reauthenticate with current password first
    const { data: { user } } = await supabase.auth.getUser()
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email:    user.email,
      password: current,
    })

    if (signInErr) {
      setErrors({ current: 'Current password is incorrect' })
      setSaving(false)
      return
    }

    try {
      await updatePassword(newPass)
      setToast('Password changed successfully')
      setToastType('success')
      setCurrent(''); setNewPass(''); setConfirm('')
    } catch (err) {
      setToast('Failed: ' + err.message)
      setToastType('error')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  function PasswordInput({ value, onChange, show, onToggle, placeholder, name }) {
    return (
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={name}
          className="input-base w-full pr-10"
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-muted hover:text-tz-text transition-colors">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatePresence><Toast msg={toast} type={toastType} /></AnimatePresence>

      <div className="bg-tz-dark border border-tz-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-tz-gold/10 border border-tz-gold/20 flex items-center justify-center">
            <Shield size={16} className="text-tz-gold" />
          </div>
          <div>
            <h3 className="font-body text-sm font-semibold text-tz-white">Change Password</h3>
            <p className="text-[10px] text-tz-muted font-body">Keep your account secure with a strong password</p>
          </div>
        </div>

        <Field label="Current Password" error={errors.current}>
          <PasswordInput
            value={current} onChange={e => setCurrent(e.target.value)}
            show={showCur} onToggle={() => setShowCur(s => !s)}
            placeholder="Enter current password" name="current-password"
          />
        </Field>

        <Field label="New Password" error={errors.newPass}>
          <PasswordInput
            value={newPass} onChange={e => setNewPass(e.target.value)}
            show={showNew} onToggle={() => setShowNew(s => !s)}
            placeholder="At least 8 characters" name="new-password"
          />
        </Field>

        <Field label="Confirm New Password" error={errors.confirm}>
          <PasswordInput
            value={confirm} onChange={e => setConfirm(e.target.value)}
            show={showNew} onToggle={() => setShowNew(s => !s)}
            placeholder="Repeat new password" name="confirm-password"
          />
        </Field>

        {/* Password strength */}
        {newPass.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[
                newPass.length >= 8,
                /[A-Z]/.test(newPass),
                /[0-9]/.test(newPass),
                /[^A-Za-z0-9]/.test(newPass),
              ].map((met, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${met ? 'bg-tz-gold' : 'bg-tz-border'}`} />
              ))}
            </div>
            <p className="text-[10px] text-tz-muted font-body">
              Strength: {
                [/[A-Z]/.test(newPass), /[0-9]/.test(newPass), /[^A-Za-z0-9]/.test(newPass), newPass.length >= 8]
                  .filter(Boolean).length >= 4 ? 'Strong' :
                [/[A-Z]/.test(newPass), /[0-9]/.test(newPass), newPass.length >= 8]
                  .filter(Boolean).length >= 2 ? 'Medium' : 'Weak'
              }
            </p>
          </div>
        )}

        <button
          onClick={handleChange}
          disabled={saving}
          className="flex items-center gap-2 text-sm font-body bg-tz-gold text-tz-black px-5 py-2.5 hover:brightness-110 disabled:opacity-60 transition-all"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" />Updating…</> : <><Lock size={14} />Change Password</>}
        </button>
      </div>
    </div>
  )
}

// ─── Main Profile Page ────────────────────────────────────────
export default function Profile() {
  const user     = useAuthStore(s => s.user)
  const openAuth = useAuthStore(s => s.openAuth)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (!user) openAuth('login')
  }, [user]) // eslint-disable-line

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <User size={32} className="text-tz-muted mx-auto mb-3" />
          <p className="text-sm text-tz-muted font-body">Sign in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-2xl text-tz-white font-light mb-8">My Profile</h1>

        {/* Tabs */}
        <div className="flex border-b border-tz-border mb-8">
          {TABS.map(tab => {
            const Icon  = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-body tracking-wide border-b-2 -mb-px transition-all ${
                  active
                    ? 'border-tz-gold text-tz-gold'
                    : 'border-transparent text-tz-muted hover:text-tz-text hover:border-tz-border'
                }`}
              >
                <Icon size={13} />{tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'profile'   && <ProfileTab />}
            {activeTab === 'addresses' && <AddressesTab />}
            {activeTab === 'security'  && <SecurityTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}