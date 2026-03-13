import { create } from 'zustand'

/**
 * UI store — ephemeral UI state that does NOT need to be persisted.
 * Manages: search, mobile nav, modals, active filters, scroll state.
 */

const useUIStore = create((set, get) => ({
  // ─── Search ───────────────────────────────────────────────────────────────
  searchQuery:   '',
  isSearchOpen:  false,

  setSearchQuery:  (q) => set({ searchQuery: q }),
  openSearch:      ()  => set({ isSearchOpen: true  }),
  closeSearch:     ()  => set({ isSearchOpen: false }),
  clearSearch:     ()  => set({ searchQuery: '', isSearchOpen: false }),

  // ─── Mobile Navigation ────────────────────────────────────────────────────
  isMobileNavOpen: false,
  openMobileNav:   ()  => set({ isMobileNavOpen: true  }),
  closeMobileNav:  ()  => set({ isMobileNavOpen: false }),
  toggleMobileNav: ()  => set(s => ({ isMobileNavOpen: !s.isMobileNavOpen })),

  // ─── Filter Drawer (catalog page) ────────────────────────────────────────
  isFilterOpen: false,
  openFilter:   ()  => set({ isFilterOpen: true  }),
  closeFilter:  ()  => set({ isFilterOpen: false }),
  toggleFilter: ()  => set(s => ({ isFilterOpen: !s.isFilterOpen })),

  // ─── Quick View Modal ─────────────────────────────────────────────────────
  quickViewProduct: null,
  openQuickView:   (product) => set({ quickViewProduct: product }),
  closeQuickView:  ()        => set({ quickViewProduct: null   }),

  // ─── Page Loading (route transitions) ────────────────────────────────────
  isPageLoading: false,
  setPageLoading: (val) => set({ isPageLoading: val }),

  // ─── Scroll direction (used for header hide/show on scroll) ───────────────
  scrollY:         0,
  scrollDirection: 'up',    // 'up' | 'down'
  isScrolled:      false,

  updateScroll(scrollY) {
    const prev = get().scrollY
    set({
      scrollY,
      isScrolled:      scrollY > 60,
      scrollDirection: scrollY > prev ? 'down' : 'up',
    })
  },

  // ─── Active catalog filters (mirror of URL query params for UI) ───────────
  activeFilters: {
    category:  null,
    gender:    null,
    minPrice:  null,
    maxPrice:  null,
    sizes:     [],
    colors:    [],
    tags:      [],
    sort:      'created_at:desc',
    page:      1,
  },

  setFilter(key, value) {
    set(s => ({
      activeFilters: {
        ...s.activeFilters,
        [key]: value,
        // Reset to page 1 whenever a filter changes (except page itself)
        ...(key !== 'page' ? { page: 1 } : {}),
      },
    }))
  },

  resetFilters() {
    set({
      activeFilters: {
        category: null, gender: null,
        minPrice: null, maxPrice: null,
        sizes: [], colors: [], tags: [],
        sort: 'created_at:desc', page: 1,
      },
    })
  },

  // ─── Toast helper (for components that don't want to import toast) ────────
  // Note: actual toasting is done via react-hot-toast directly in most places.
  // This just tracks a pending notification to show after navigation.
  pendingToast: null,
  setPendingToast: (msg) => set({ pendingToast: msg }),
  clearPendingToast: ()  => set({ pendingToast: null }),
}))

export default useUIStore

// ─── Selector hooks ───────────────────────────────────────────────────────────
export const useSearchQuery    = () => useUIStore(s => s.searchQuery)
export const useIsSearchOpen   = () => useUIStore(s => s.isSearchOpen)
export const useIsMobileNav    = () => useUIStore(s => s.isMobileNavOpen)
export const useIsFilterOpen   = () => useUIStore(s => s.isFilterOpen)
export const useQuickView      = () => useUIStore(s => s.quickViewProduct)
export const useIsScrolled     = () => useUIStore(s => s.isScrolled)
export const useScrollDir      = () => useUIStore(s => s.scrollDirection)
export const useActiveFilters  = () => useUIStore(s => s.activeFilters)
export const useUIActions      = () => useUIStore(s => ({
  setSearchQuery:   s.setSearchQuery,
  openSearch:       s.openSearch,
  closeSearch:      s.closeSearch,
  clearSearch:      s.clearSearch,
  openMobileNav:    s.openMobileNav,
  closeMobileNav:   s.closeMobileNav,
  toggleMobileNav:  s.toggleMobileNav,
  openFilter:       s.openFilter,
  closeFilter:      s.closeFilter,
  openQuickView:    s.openQuickView,
  closeQuickView:   s.closeQuickView,
  setPageLoading:   s.setPageLoading,
  updateScroll:     s.updateScroll,
  setFilter:        s.setFilter,
  resetFilters:     s.resetFilters,
}))