import { useEffect }           from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header       from '@/components/layout/Header'
import Footer       from '@/components/layout/Footer'
import CartDrawer   from '@/components/cart/CartDrawer'
import AuthModal    from '@/components/auth/AuthModal'
import AdminBar     from '@/components/layout/AdminBar'
import useAuthStore from '@/store/authStore'
import { useWishlistSync } from '@/hooks/useWishlistSync'

export default function Layout() {
  const { pathname } = useLocation()
  const isAdmin      = useAuthStore(s => s.isAdmin())

  useWishlistSync()

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="min-h-screen bg-tz-black flex flex-col">
      {/* Admin bar sits above everything when admin is logged in */}
      <AdminBar />

      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Global overlays */}
      <CartDrawer />
      <AuthModal />
    </div>
  )
}