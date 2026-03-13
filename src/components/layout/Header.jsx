// src/components/layout/Header.jsx

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate }           from 'react-router-dom'
import {
  ShoppingCart, Heart, Search, User, LogOut,
  Package, Settings, ChevronDown, X, Menu,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore                from '@/store/authStore'
import useCartStore                from '@/store/cartStore'
import useWishlistStore            from '@/store/wishlistStore'
import { trackSearch }             from '@/lib/analytics'

/* ─── Helper ────────────────────────────────────────────────────────────── */
function getInitials(name = '') {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

/* ─── Avatar ────────────────────────────────────────────────────────────── */
function Avatar({ profile, user, size = 32 }) {
  const fullName =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    ''
  const initials  = getInitials(fullName) || (user?.email?.[0] ?? 'U').toUpperCase()
  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url

  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={fullName || 'User'}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0" />
    )
  }

  return (
    <span style={{ width: size, height: size }}
      className="rounded-full bg-tz-gold/20 flex items-center justify-center flex-shrink-0">
      <span style={{ fontSize: 11, lineHeight: 1, letterSpacing: 0, fontWeight: 700 }}
        className="text-tz-gold select-none font-display">
        {initials}
      </span>
    </span>
  )
}

/* ─── Nav links ─────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Shop',     to: '/products' },
  { label: 'New In',   to: '/new-in'   },
  { label: 'Trending', to: '/trending' },
  { label: 'Sale',     to: '/sale'     },
]

/* ═══════════════════════════════════════════════════════════════════════════
   Header
═══════════════════════════════════════════════════════════════════════════ */
export default function Header() {
  const navigate = useNavigate()

  const user      = useAuthStore(s => s.user)
  const profile   = useAuthStore(s => s.profile)
  const isLoading = useAuthStore(s => s.isLoading)
  const openAuth  = useAuthStore(s => s.openAuth)
  const signOut   = useAuthStore(s => s.signOut)

  const isAdmin = profile?.role === 'admin'

  const cartCount     = useCartStore(s => s.items.reduce((a, i) => a + i.quantity, 0))
  const wishlistCount = useWishlistStore(s => s.items.length)

  const [menuOpen,    setMenuOpen]    = useState(false)
  const [dropOpen,    setDropOpen]    = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropRef   = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  async function handleSignOut() {
    setDropOpen(false)
    await signOut()
    navigate('/', { replace: true })
  }

  function handleSearch(e) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    trackSearch(q)
    setSearchOpen(false)
    setSearchQuery('')
    navigate(`/products?search=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-tz-dark/95 backdrop-blur-md border-b border-tz-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-4">

          {/* Hamburger (mobile) */}
          <button className="lg:hidden text-tz-muted hover:text-tz-white transition-colors p-1"
            onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link to="/" className="font-display text-xl font-bold text-tz-gold tracking-wide flex-shrink-0">
            TrendZip
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {NAV_LINKS.map(({ label, to }) => (
              <Link key={to} to={to}
                className="px-3 py-1.5 text-sm font-body text-tz-muted hover:text-tz-white transition-colors rounded-lg hover:bg-white/5">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Icon cluster */}
          <div className="flex items-center gap-1">

            {/* Search */}
            <button className="p-2 text-tz-muted hover:text-tz-white transition-colors rounded-lg hover:bg-white/5"
              onClick={() => setSearchOpen(v => !v)} aria-label="Search">
              <Search size={20} />
            </button>

            {/* Wishlist */}
            {user && (
              <Link to="/wishlist"
                className="relative p-2 text-tz-muted hover:text-tz-white transition-colors rounded-lg hover:bg-white/5"
                aria-label="Wishlist">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tz-gold text-tz-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart"
              className="relative p-2 text-tz-muted hover:text-tz-white transition-colors rounded-lg hover:bg-white/5"
              aria-label="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tz-gold text-tz-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User / Auth */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-tz-border animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropRef}>
                <button onClick={() => setDropOpen(v => !v)}
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="User menu">
                  <Avatar profile={profile} user={user} size={32} />
                  <ChevronDown size={14}
                    className={`text-tz-muted transition-transform hidden sm:block ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-tz-dark border border-tz-border rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {/* Profile header */}
                      <div className="px-4 py-3 border-b border-tz-border flex items-center gap-3">
                        <Avatar profile={profile} user={user} size={36} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-tz-white truncate">
                            {profile?.full_name ?? user.user_metadata?.full_name ?? 'Account'}
                          </p>
                          <p className="text-[11px] text-tz-muted truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="py-1">
                        {/* ✅ Same-tab navigation using React Router Link */}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setDropOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-body text-tz-gold hover:bg-tz-gold/10 transition-colors"
                          >
                            <Settings size={15} />
                            Admin Panel
                          </Link>
                        )}
                        <Link to="/orders" onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-body text-tz-muted hover:text-tz-white hover:bg-white/5 transition-colors">
                          <Package size={15} />
                          My Orders
                        </Link>
                        <Link to="/account" onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-body text-tz-muted hover:text-tz-white hover:bg-white/5 transition-colors">
                          <User size={15} />
                          Account Settings
                        </Link>
                      </div>

                      <div className="border-t border-tz-border py-1">
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-body text-tz-muted hover:text-red-400 hover:bg-red-400/5 transition-colors">
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <button onClick={() => openAuth('login')}
                  className="text-sm font-body text-tz-muted hover:text-tz-white transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5">
                  Log In
                </button>
                <button onClick={() => openAuth('register')} className="btn-primary text-sm px-4 py-1.5">
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search bar (expandable) */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-tz-border"
            >
              <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tz-muted pointer-events-none" />
                  <input ref={searchRef} type="text" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search for products, brands, categories…"
                    className="input-base w-full pl-9 pr-10 text-sm" />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-muted hover:text-tz-white">
                      <X size={15} />
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setMenuOpen(false)} />
            <motion.nav
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 left-0 h-full w-64 bg-tz-dark border-r border-tz-border z-40 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-tz-border">
                <span className="font-display text-lg font-bold text-tz-gold">TrendZip</span>
                <button onClick={() => setMenuOpen(false)} className="text-tz-muted hover:text-tz-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                {NAV_LINKS.map(({ label, to }) => (
                  <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-body text-tz-muted hover:text-tz-white hover:bg-white/5 rounded-lg transition-colors">
                    {label}
                  </Link>
                ))}
              </div>

              {user && (
                <div className="px-3 py-4 border-t border-tz-border space-y-0.5">
                  {/* ✅ Same-tab navigation using React Router Link */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-body text-tz-gold hover:bg-tz-gold/10 rounded-lg transition-colors"
                    >
                      <Settings size={16} />
                      Admin Panel
                    </Link>
                  )}
                  <Link to="/orders" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-body text-tz-muted hover:text-tz-white hover:bg-white/5 rounded-lg transition-colors">
                    <Package size={16} />
                    My Orders
                  </Link>
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-body text-tz-muted hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}