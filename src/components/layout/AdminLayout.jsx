// src/components/layout/AdminLayout.jsx
// BATCH 24: Added 'Returns' nav item (RotateCcw icon)

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Home,
  LogOut,
  X,
  Menu,
  ExternalLink,
  Tag,
  Star,
  Layers,
  RotateCcw,   // ← NEW (Returns)
} from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '@/store/authStore'

const NAV = [
  { label: 'Dashboard',   to: '/admin',              icon: LayoutDashboard, end: true },
  { label: 'Homepage',    to: '/admin/homepage',     icon: Home            },
  { label: 'Collections', to: '/admin/collections',  icon: Layers          },
  { label: 'Products',    to: '/admin/products',     icon: Package         },
  { label: 'Orders',      to: '/admin/orders',       icon: ShoppingCart    },
  { label: 'Returns',     to: '/admin/returns',      icon: RotateCcw       }, // ← NEW
  { label: 'Users',       to: '/admin/users',        icon: Users           },
  { label: 'Coupons',     to: '/admin/coupons',      icon: Tag             },
  { label: 'Reviews',     to: '/admin/reviews',      icon: Star            },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate  = useNavigate()
  const profile   = useAuthStore(s => s.profile)
  const signOut   = useAuthStore(s => s.signOut)
  const isAdmin   = profile?.role === 'admin'

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-tz-border">
        <span className="font-display text-xl font-bold text-tz-gold tracking-wide">TrendZip</span>
        <span className="text-xs text-tz-muted font-body uppercase tracking-widest mt-0.5">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${
                isActive
                  ? 'bg-tz-gold/10 text-tz-gold font-semibold'
                  : 'text-tz-muted hover:text-tz-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-tz-border space-y-0.5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-tz-muted hover:text-tz-white hover:bg-white/5 transition-colors"
        >
          <ExternalLink size={17} />
          Visit Site
        </a>
        {isAdmin && (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-tz-muted hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        )}
      </div>

      {/* Profile chip */}
      {profile && (
        <div className="px-4 py-3 border-t border-tz-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-tz-gold/20 flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name ?? 'Admin'}
                  className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-tz-gold leading-none select-none">
                  {(profile.full_name ?? profile.email ?? 'A')
                    .split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-tz-white truncate">{profile.full_name ?? 'Admin'}</p>
              <p className="text-[11px] text-tz-muted truncate">{profile.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-tz-black flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-tz-dark border-r border-tz-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex flex-col w-64 bg-tz-dark border-r border-tz-border">
            <button className="absolute top-4 right-4 text-tz-muted hover:text-tz-white" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-tz-dark border-b border-tz-border">
          <button className="text-tz-muted hover:text-tz-white transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <span className="font-display font-bold text-tz-gold tracking-wide">TrendZip Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}