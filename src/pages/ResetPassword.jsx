import { useState, useEffect } from 'react'
import { Link, useNavigate }   from 'react-router-dom'
import { motion }              from 'framer-motion'
import {
  Lock, Check, Eye, EyeOff,
  AlertCircle, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()

  const [ready,    setReady]    = useState(false)
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(false)

  useEffect(() => {
    // Supabase v2 fires PASSWORD_RECOVERY from the URL hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setReady(true)
        }
      }
    )
    // Also handles page reload with active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit() {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm)  { setError('Passwords do not match'); return }

    setSaving(true)
    setError(null)

    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setSaving(false); return }

    setSuccess(true)
    setTimeout(async () => {
      await supabase.auth.signOut()
      navigate('/')
    }, 3000)
  }

  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-tz-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl text-tz-white tracking-widest">
            TRENDZIP
          </Link>
          <h1 className="font-display text-xl text-tz-white font-light mt-4">
            {success ? 'Password Updated!' : 'Create New Password'}
          </h1>
          <p className="text-xs text-tz-muted font-body mt-1">
            {success
              ? 'Signing you out and redirecting…'
              : 'Choose a strong password for your account'
            }
          </p>
        </div>

        {!ready && !success && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-tz-border border-t-tz-gold rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-tz-muted font-body">Verifying reset link…</p>
          </div>
        )}

        {success && (
          <div className="flex flex-col items-center gap-4 py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-16 h-16 bg-green-500/10 border border-green-500/30 flex items-center justify-center"
            >
              <Check size={28} className="text-green-400" />
            </motion.div>
            <p className="text-sm text-tz-muted font-body text-center">
              Password changed successfully. Redirecting to homepage in 3s…
            </p>
          </div>
        )}

        {ready && !success && (
          <div className="bg-tz-dark border border-tz-border p-6 space-y-4">
            {/* New password */}
            <div>
              <label className="label-base">New Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="At least 8 characters"
                  className="input-base w-full pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-muted hover:text-tz-text"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Strength meter */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={`flex-1 h-1 transition-colors ${
                          strength >= i
                            ? strength <= 1 ? 'bg-red-400'
                            : strength === 2 ? 'bg-yellow-400'
                            : 'bg-green-400'
                            : 'bg-tz-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-tz-muted font-body mt-1">
                    {strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="label-base">Confirm Password</label>
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(null) }}
                placeholder="Repeat new password"
                className="input-base w-full"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-tz-accent/10 border border-tz-accent/30 text-xs text-tz-accent font-body">
                <AlertCircle size={12} />{error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving || !password || !confirm}
              className="w-full flex items-center justify-center gap-2 bg-tz-gold text-tz-black text-sm font-body font-semibold py-3 hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {saving
                ? <><Loader2 size={15} className="animate-spin" />Updating…</>
                : <><Lock size={15} />Set New Password</>
              }
            </button>
          </div>
        )}

        <p className="text-center text-xs text-tz-muted font-body mt-5">
          <Link to="/" className="text-tz-gold hover:underline">← Back to TrendZip</Link>
        </p>
      </motion.div>
    </div>
  )
}