// src/App.jsx — production-safe
// Single Toaster lives in main.jsx — NEVER add another one here

import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Layout          from '@/components/layout/Layout'
import AdminLayout     from '@/components/layout/AdminLayout'
import useAuthStore    from '@/store/authStore'
import useCartTracking from '@/hooks/useCartTracking'
import { initGA, trackPageView } from '@/lib/analytics'

// ─── Loader ───────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-tz-black">
      <div className="w-8 h-8 border-2 border-tz-border border-t-tz-gold rounded-full animate-spin" />
    </div>
  )
}

// ─── GA4 tracker ──────────────────────────────────────────────────────────────
function GAPageTracker() {
  const location = useLocation()
  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search])
  return null
}

// ─── Lazy pages ───────────────────────────────────────────────────────────────
const Home           = lazy(() => import('@/pages/Home'))
const Catalog        = lazy(() => import('@/pages/Catalog'))
const ProductDetail  = lazy(() => import('@/pages/ProductDetail'))
const Cart           = lazy(() => import('@/pages/Cart'))
const Wishlist       = lazy(() => import('@/pages/Wishlist'))
const Checkout       = lazy(() => import('@/pages/Checkout'))
const Profile        = lazy(() => import('@/pages/Profile'))
const Orders         = lazy(() => import('@/pages/Orders'))
const OrderDetail    = lazy(() => import('@/pages/OrderDetail'))
const AuthCallback   = lazy(() => import('@/pages/AuthCallback'))
const ResetPassword  = lazy(() => import('@/pages/ResetPassword'))
const NotFound       = lazy(() => import('@/pages/NotFound'))
const CollectionPage = lazy(() => import('@/pages/CollectionPage'))

const Privacy        = lazy(() => import('@/pages/Privacy'))
const TermsOfService = lazy(() => import('@/pages/TermsOfService'))
const CookiePolicy   = lazy(() => import('@/pages/CookiePolicy'))
const About          = lazy(() => import('@/pages/About'))
const Careers        = lazy(() => import('@/pages/Careers'))
const Press          = lazy(() => import('@/pages/Press'))
const Blog           = lazy(() => import('@/pages/Blog'))
const Returns        = lazy(() => import('@/pages/Returns'))
const HelpCenter     = lazy(() => import('@/pages/HelpCenter'))
const Contact        = lazy(() => import('@/pages/Contact'))
const SizeGuide      = lazy(() => import('@/pages/SizeGuide'))

const AdminDashboard         = lazy(() => import('@/pages/admin/Dashboard'))
const AdminProducts          = lazy(() => import('@/pages/admin/Products'))
const AdminProductEdit       = lazy(() => import('@/pages/admin/ProductEdit'))
const AdminOrders            = lazy(() => import('@/pages/admin/Orders'))
const AdminOrderDetail       = lazy(() => import('@/pages/admin/OrderDetail'))
const AdminUsers             = lazy(() => import('@/pages/admin/Users'))
const AdminCategories        = lazy(() => import('@/pages/admin/Categories'))
const AdminAnalytics         = lazy(() => import('@/pages/admin/Analytics'))
const HomepageEditor         = lazy(() => import('@/pages/admin/HomepageEditor'))
const CouponManager          = lazy(() => import('@/pages/admin/CouponManager'))
const ReviewModeration       = lazy(() => import('@/pages/admin/ReviewModeration'))
const AdminReturnRequests    = lazy(() => import('@/pages/admin/ReturnRequests'))
const AdminCollectionManager = lazy(() => import('@/pages/admin/CollectionManager'))

// ─── RequireAuth ──────────────────────────────────────────────────────────────
function RequireAuth() {
  const user      = useAuthStore(s => s.user)
  const isLoading = useAuthStore(s => s.isLoading)
  const openAuth  = useAuthStore(s => s.openAuth)

  if (isLoading) return <PageLoader />

  if (!user) {
    sessionStorage.setItem('returnTo', window.location.pathname)
    openAuth('login')
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

// ─── RequireAdmin ─────────────────────────────────────────────────────────────
function RequireAdmin() {
  const isInitialized = useAuthStore(s => s.isInitialized)
  const user          = useAuthStore(s => s.user)
  const profile       = useAuthStore(s => s.profile)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (isInitialized) return
    const t = setTimeout(() => setTimedOut(true), 8000)
    return () => clearTimeout(t)
  }, [isInitialized])

  if (!isInitialized && !timedOut) return <PageLoader />

  const isAdmin = profile?.role === 'admin'
  if (!user || !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const init = useAuthStore(s => s.init)

  useEffect(() => {
    const unsub = init()
    initGA()
    return unsub
  }, []) // eslint-disable-line

  useCartTracking()

  return (
    <>
      {/* ✅ NO <Toaster> here — it lives in main.jsx only. Having two causes double notifications. */}

      <GAPageTracker />

      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── Public ── */}
          <Route element={<Layout />}>
            <Route index               element={<Home />} />
            <Route path="catalog"      element={<Catalog />} />
            <Route path="products"     element={<Catalog />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="cart"         element={<Cart />} />
            <Route path="wishlist"     element={<Wishlist />} />
            <Route path="size-guide"   element={<SizeGuide />} />

            <Route path="c/:collection" element={<CollectionPage />} />
            <Route path="new-in"        element={<Navigate to="/c/new-in" replace />} />
            <Route path="trending"      element={<Navigate to="/c/trending" replace />} />
            <Route path="sale"          element={<Navigate to="/c/sale" replace />} />
            <Route path="account"       element={<Navigate to="/profile" replace />} />

            <Route path="privacy"       element={<Privacy />} />
            <Route path="terms"         element={<TermsOfService />} />
            <Route path="cookie-policy" element={<CookiePolicy />} />
            <Route path="about"         element={<About />} />
            <Route path="careers"       element={<Careers />} />
            <Route path="press"         element={<Press />} />
            <Route path="blog"          element={<Blog />} />
            <Route path="returns"       element={<Returns />} />
            <Route path="help"          element={<HelpCenter />} />
            <Route path="contact"       element={<Contact />} />

            <Route element={<RequireAuth />}>
              <Route path="checkout"   element={<Checkout />} />
              <Route path="profile"    element={<Profile />} />
              <Route path="orders"     element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
            </Route>
          </Route>

          {/* ── Auth ── */}
          <Route path="auth/callback"  element={<AuthCallback />} />
          <Route path="reset-password" element={<ResetPassword />} />

          {/* ── Admin ── */}
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="admin"              element={<AdminDashboard />} />
              <Route path="admin/products"     element={<AdminProducts />} />
              <Route path="admin/products/new" element={<AdminProductEdit />} />
              <Route path="admin/products/:id" element={<AdminProductEdit />} />
              <Route path="admin/orders"       element={<AdminOrders />} />
              <Route path="admin/orders/:id"   element={<AdminOrderDetail />} />
              <Route path="admin/users"        element={<AdminUsers />} />
              <Route path="admin/categories"   element={<AdminCategories />} />
              <Route path="admin/analytics"    element={<AdminAnalytics />} />
              <Route path="admin/homepage"     element={<HomepageEditor />} />
              <Route path="admin/coupons"      element={<CouponManager />} />
              <Route path="admin/reviews"      element={<ReviewModeration />} />
              <Route path="admin/collections"  element={<AdminCollectionManager />} />
              <Route path="admin/returns"      element={<AdminReturnRequests />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Suspense>
    </>
  )
}