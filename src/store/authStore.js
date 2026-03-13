// src/store/authStore.js
// v2 — Production-grade. Uses INITIAL_SESSION as the single bootstrap trigger.
//
// KEY FIX: Supabase fires onAuthStateChange('INITIAL_SESSION', session) exactly
// once when the listener is first attached — with the current session or null.
// This replaces the dual-trigger pattern (getSession + SIGNED_IN) that caused
// race conditions where _loadProfile ran twice with non-deterministic results,
// making the admin role disappear until refresh.
//
// isInitialized: set to true ONLY after both auth check + profile fetch settle.
// RequireAdmin waits for this flag — never redirects mid-fetch.

import { create }   from 'zustand'
import { supabase } from '@/lib/supabase'

const useAuthStore = create((set, get) => ({
  user:             null,
  profile:          null,
  isLoading:        true,
  isProfileLoading: false,
  isInitialized:    false,   // true = auth + profile fully settled
  isAuthOpen:       false,
  authView:         'login',

  // ─── Bootstrap ───────────────────────────────────────────────────────────────
  init: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        // ── INITIAL_SESSION: fired exactly once on page load ──
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            set({ user: session.user, isLoading: false })
            await get()._loadProfile(session.user.id)
          } else {
            set({ isLoading: false, isInitialized: true })
          }
          return
        }

        // ── SIGNED_IN: only for new logins (modal sign-in, OAuth callback) ──
        if (event === 'SIGNED_IN') {
          const currentUserId = get().user?.id
          if (session?.user && session.user.id !== currentUserId) {
            set({ user: session.user, isLoading: false })
            await get()._loadProfile(session.user.id)
          }
          get().closeAuth()

          // Redirect to original destination if RequireAuth stashed it
          const returnTo = sessionStorage.getItem('returnTo')
          if (returnTo) {
            sessionStorage.removeItem('returnTo')
            if (returnTo !== window.location.pathname) {
              window.location.href = returnTo
            }
          }
          return
        }

        // ── TOKEN_REFRESHED ──
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          set({ user: session.user })
          // Re-fetch profile if somehow missing (e.g. long-idle tab)
          if (!get().profile) {
            await get()._loadProfile(session.user.id)
          }
          return
        }

        // ── PASSWORD_RECOVERY ──
        if (event === 'PASSWORD_RECOVERY') {
          set({ user: session?.user ?? null, isLoading: false, isInitialized: true })
          return
        }

        // ── SIGNED_OUT ──
        if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, isLoading: false, isProfileLoading: false, isInitialized: true })
          window.dispatchEvent(new CustomEvent('auth:signout'))
        }
      }
    )

    return () => subscription.unsubscribe()
  },

  // ─── Internal: fetch profile from DB ────────────────────────────────────────
  // Protected by a fetch-ID so a stale concurrent call cannot overwrite a newer one.
  _loadProfile: async (userId) => {
    const fetchId = Date.now()
    set({ isProfileLoading: true, _lastFetchId: fetchId })

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // Abort if a newer fetch has started
      if (get()._lastFetchId !== fetchId) return

      if (profile) {
        set({ profile })
      } else {
        // First-time user (Google OAuth etc.) — create their row
        const user = get().user
        if (!user) return

        const newProfile = {
          id:         userId,
          email:      user.email,
          full_name:  user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          role:       'customer',
          status:     'active',
        }
        const { data: created } = await supabase
          .from('users').insert(newProfile).select('*').single()

        if (get()._lastFetchId !== fetchId) return
        set({ profile: created ?? newProfile })
      }
    } catch (err) {
      console.error('[authStore] _loadProfile error:', err)
    } finally {
      if (get()._lastFetchId === fetchId) {
        set({ isProfileLoading: false, isInitialized: true })
      }
    }
  },

  fetchProfile: (userId) => get()._loadProfile(userId),

  openAuth:    (view = 'login') => set({ isAuthOpen: true,  authView: view }),
  closeAuth:   ()               => set({ isAuthOpen: false }),
  setAuthView: (view)           => set({ authView: view }),

  isAdmin: () => get().profile?.role === 'admin',

  signOut: async () => {
    set({ user: null, profile: null, isLoading: false, isProfileLoading: false, isInitialized: true })
    window.dispatchEvent(new CustomEvent('auth:signout'))
    try { await supabase.auth.signOut() } catch (_) {}
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('users').update(updates).eq('id', user.id).select('*').single()
    if (error) throw error
    set({ profile: data })
    return data
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
}))

export default useAuthStore