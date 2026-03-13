import { useState }                          from 'react'
import { Link, useLocation, useNavigate }    from 'react-router-dom'
import {
  Shield, LayoutDashboard, Package,
  ShoppingCart, Users, X, Edit2,
  ExternalLink, Home,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { supabase } from '@/lib/supabase'

const LINKS = [
  { label: 'Dashboard',  to: '/admin',           icon: LayoutDashboard },
  { label: 'Homepage',   to: '/admin/homepage',   icon: Home            },
  { label: 'Products',   to: '/admin/products',   icon: Package         },
  { label: 'Orders',     to: '/admin/orders',     icon: ShoppingCart    },
  { label: 'Users',      to: '/admin/users',      icon: Users           },
]

export default function AdminBar() {
  // ── FIX: subscribe to `profile` directly for full reactivity ─────────────
  const profile  = useAuthStore(s => s.profile)
  const isAdmin  = profile?.role === 'admin'
  // ──────────────────────────────────────────────────────────────────────────

  const navigate     = useNavigate()
  const { pathname } = useLocation()

  const [hidden, setHidden] = useState(
    () => sessionStorage.getItem('tz-adminbar') === 'hidden'
  )

  if (!isAdmin || hidden) return null

  // Contextual "Edit Product" when viewing a product page
  const productMatch = pathname.match(/^\/products\/(.+)$/)
  const slug         = productMatch?.[1]

  async function editCurrentProduct() {
    if (!slug) return
    const { data } = await supabase
      .from('products').select('id').eq('slug', slug).single()
    if (data?.id) navigate(`/admin/products/${data.id}`)
  }

  function dismiss() {
    sessionStorage.setItem('tz-adminbar', 'hidden')
    setHidden(true)
  }

  return (
    <div
      className="w-full bg-tz-surface border-b border-tz-gold/20 flex items-center px-3 sm:px-5 gap-2 sm:gap-3 shrink-0"
      style={{ height: 36, fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Badge */}
      <div className="flex items-center gap-1.5 text-tz-gold text-[10px] font-bold tracking-widest uppercase shrink-0">
        <Shield size={11} />
        <span className="hidden sm:block">Admin</span>
      </div>

      <div className="w-px h-4 bg-tz-border shrink-0" />

      {/* Nav links */}
      <nav className="flex items-center overflow-x-auto scrollbar-none flex-1">
        {LINKS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-body whitespace-nowrap transition-all ${
              pathname === item.to
                ? 'text-tz-gold bg-tz-gold/10'
                : 'text-tz-muted hover:text-tz-gold hover:bg-tz-gold/5'
            }`}
          >
            <item.icon size={11} />
            <span className="hidden sm:block">{item.label}</span>
          </Link>
        ))}

        {/* Contextual edit product */}
        {slug && (
          <>
            <div className="w-px h-3 bg-tz-border mx-1 shrink-0" />
            <button
              onClick={editCurrentProduct}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] text-tz-gold hover:bg-tz-gold/10 transition-all whitespace-nowrap border border-tz-gold/30 font-body"
            >
              <Edit2 size={10} />Edit Product
            </button>
          </>
        )}
      </nav>

      {/* Open admin in new tab */}
      <a
        href="/admin"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:flex items-center gap-1 text-[10px] text-tz-muted hover:text-tz-gold transition-colors px-2"
        title="Open admin in new tab"
      >
        <ExternalLink size={10} />
      </a>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="w-6 h-6 flex items-center justify-center text-tz-muted hover:text-tz-white transition-colors shrink-0"
        title="Hide admin bar"
      >
        <X size={12} />
      </button>
    </div>
  )
}