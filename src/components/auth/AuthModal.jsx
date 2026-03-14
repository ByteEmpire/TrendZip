import { useState }              from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Eye, EyeOff, Mail, Lock,
  AlertCircle, Loader2, Check, Chrome
} from 'lucide-react'
import { supabase }     from '@/lib/supabase'
import useAuthStore     from '@/store/authStore'

const VIEWS = { LOGIN: 'login', REGISTER: 'register', FORGOT: 'forgot' }

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label-base">{label}</label>
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

export default function AuthModal() {
  const isOpen     = useAuthStore(s => s.isAuthOpen)
  const view       = useAuthStore(s => s.authView)
  const setView    = useAuthStore(s => s.setAuthView)
  const closeAuth  = useAuthStore(s => s.closeAuth)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [message,  setMessage]  = useState(null)

  function reset() {
    setEmail(''); setPassword(''); setName('')
    setError(null); setMessage(null); setLoading(false)
  }

  function switchView(v) { reset(); setView(v) }

  // ─── Google OAuth ─────────────────────────────────────────
  async function handleGoogle() {
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
         redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (err) {
      if (err.message?.includes('provider') || err.message?.includes('not enabled')) {
        setError('Google sign-in is not configured yet. Please use email & password, or contact support.')
      } else {
        setError(err.message)
      }
      setLoading(false)
    }
    // On success, browser redirects — no cleanup needed
  }

  // ─── Email sign in ────────────────────────────────────────
  async function handleLogin(e) {
    e?.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(
        err.message.includes('Invalid login')
          ? 'Incorrect email or password'
          : err.message
      )
    }
    setLoading(false)
  }

  // ─── Register ─────────────────────────────────────────────
  async function handleRegister(e) {
    e?.preventDefault()
    if (!name.trim())    { setError('Please enter your name'); return }
    if (!email)          { setError('Please enter your email'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError(null)

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (err) { setError(err.message); setLoading(false); return }

    // Insert profile row
    if (data.user) {
      await supabase.from('users').upsert({
        id:        data.user.id,
        email,
        full_name: name,
        role:      'customer',
        status:    'active',
      }, { onConflict: 'id' })
    }

    setMessage('Account created! Check your email to confirm, then sign in.')
    setLoading(false)
  }

  // ─── Forgot password ──────────────────────────────────────
  async function handleForgot(e) {
    e?.preventDefault()
    if (!email) { setError('Please enter your email address'); return }
    setLoading(true); setError(null)

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      // KEY FIX: redirect to our reset page, not the home page
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (err) { setError(err.message); setLoading(false); return }
    setMessage('Password reset link sent! Check your inbox.')
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={() => { reset(); closeAuth() }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{ opacity: 0,  scale: 0.96, y: 16  }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-tz-dark border border-tz-border shadow-modal z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div>
              <h2 className="font-display text-xl text-tz-white font-light">
                {view === VIEWS.LOGIN    ? 'Welcome Back'    : ''}
                {view === VIEWS.REGISTER ? 'Create Account'  : ''}
                {view === VIEWS.FORGOT   ? 'Reset Password'  : ''}
              </h2>
              <p className="text-xs text-tz-muted font-body mt-0.5">
                {view === VIEWS.LOGIN    ? 'Sign in to your TrendZip account'   : ''}
                {view === VIEWS.REGISTER ? 'Start shopping in seconds'          : ''}
                {view === VIEWS.FORGOT   ? "We'll email you a reset link"       : ''}
              </p>
            </div>
            <button
              onClick={() => { reset(); closeAuth() }}
              className="btn-icon"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-6 pb-6 space-y-4">

            {/* Success message */}
            {message && (
              <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 text-xs text-green-400 font-body">
                <Check size={13} className="shrink-0 mt-0.5" />
                {message}
              </div>
            )}

            {/* Error */}
            {error && !message && (
              <div className="flex items-start gap-2 p-3 bg-tz-accent/10 border border-tz-accent/30 text-xs text-tz-accent font-body">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* ── LOGIN ─────────────────────────────────── */}
            {view === VIEWS.LOGIN && !message && (
              <>
                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 border border-tz-border text-tz-text text-sm font-body py-2.5 hover:border-tz-border-2 hover:bg-tz-surface/50 transition-all disabled:opacity-60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-tz-border" />
                  <span className="text-[10px] text-tz-muted font-body uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-tz-border" />
                </div>

                <Field label="Email" error={null}>
                  <input
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(null) }}
                    placeholder="you@example.com"
                    className="input-base w-full"
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                </Field>

                <Field label="Password" error={null}>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'} value={password}
                      onChange={e => { setPassword(e.target.value); setError(null) }}
                      placeholder="Your password"
                      className="input-base w-full pr-10"
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-muted hover:text-tz-text"
                    >
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>

                <div className="flex justify-end">
                  <button
                    onClick={() => switchView(VIEWS.FORGOT)}
                    className="text-xs text-tz-gold hover:text-tz-gold-light font-body transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-tz-gold text-tz-black text-sm font-body font-semibold py-3 hover:brightness-110 disabled:opacity-60 transition-all"
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" />Signing in…</> : 'Sign In'}
                </button>

                <p className="text-center text-xs text-tz-muted font-body">
                  No account?{' '}
                  <button
                    onClick={() => switchView(VIEWS.REGISTER)}
                    className="text-tz-gold hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </>
            )}

            {/* ── REGISTER ──────────────────────────────── */}
            {view === VIEWS.REGISTER && !message && (
              <>
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 border border-tz-border text-tz-text text-sm font-body py-2.5 hover:border-tz-border-2 hover:bg-tz-surface/50 transition-all disabled:opacity-60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-tz-border" />
                  <span className="text-[10px] text-tz-muted font-body uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-tz-border" />
                </div>

                <Field label="Full Name">
                  <input
                    type="text" value={name}
                    onChange={e => { setName(e.target.value); setError(null) }}
                    placeholder="Arjun Sharma"
                    className="input-base w-full"
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(null) }}
                    placeholder="you@example.com"
                    className="input-base w-full"
                  />
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'} value={password}
                      onChange={e => { setPassword(e.target.value); setError(null) }}
                      placeholder="At least 8 characters"
                      className="input-base w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-muted hover:text-tz-text"
                    >
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-tz-gold text-tz-black text-sm font-body font-semibold py-3 hover:brightness-110 disabled:opacity-60 transition-all"
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" />Creating…</> : 'Create Account'}
                </button>

                <p className="text-center text-xs text-tz-muted font-body">
                  Already have an account?{' '}
                  <button onClick={() => switchView(VIEWS.LOGIN)} className="text-tz-gold hover:underline">
                    Sign in
                  </button>
                </p>
              </>
            )}

            {/* ── FORGOT ────────────────────────────────── */}
            {view === VIEWS.FORGOT && !message && (
              <>
                <Field label="Email address">
                  <input
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(null) }}
                    placeholder="you@example.com"
                    className="input-base w-full"
                    onKeyDown={e => e.key === 'Enter' && handleForgot()}
                    autoFocus
                  />
                </Field>

                <button
                  onClick={handleForgot}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-tz-gold text-tz-black text-sm font-body font-semibold py-3 hover:brightness-110 disabled:opacity-60 transition-all"
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" />Sending…</>
                    : <><Mail size={15} />Send Reset Link</>
                  }
                </button>

                <p className="text-center text-xs text-tz-muted font-body">
                  <button onClick={() => switchView(VIEWS.LOGIN)} className="text-tz-gold hover:underline">
                    ← Back to Sign In
                  </button>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}