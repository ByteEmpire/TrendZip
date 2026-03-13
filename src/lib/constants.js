// ─── App Meta ─────────────────────────────────────────────────────────────────
export const APP_NAME    = 'TrendZip'
export const APP_TAGLINE = 'Wear the Trend'
export const APP_URL     = import.meta.env.VITE_APP_URL || 'https://trendzip.in'

// ─── Currency ─────────────────────────────────────────────────────────────────
export const CURRENCY_CODE   = 'INR'
export const CURRENCY_SYMBOL = '₹'

// ─── Pagination ───────────────────────────────────────────────────────────────
export const PRODUCTS_PER_PAGE    = 20
export const ORDERS_PER_PAGE      = 10
export const ADMIN_PER_PAGE       = 25

// ─── Product Sorting Options ──────────────────────────────────────────────────
export const SORT_OPTIONS = [
  { value: 'created_at:desc',  label: 'Newest First'    },
  { value: 'created_at:asc',   label: 'Oldest First'    },
  { value: 'sale_price:asc',   label: 'Price: Low to High' },
  { value: 'sale_price:desc',  label: 'Price: High to Low' },
  { value: 'name:asc',         label: 'Name: A to Z'    },
  { value: 'name:desc',        label: 'Name: Z to A'    },
]

// ─── Sizes ────────────────────────────────────────────────────────────────────
export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
export const FOOTWEAR_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12']

// ─── Product Tags ─────────────────────────────────────────────────────────────
export const PRODUCT_TAGS = [
  'new-arrival',
  'best-seller',
  'limited-edition',
  'sale',
  'sustainable',
  'premium',
]

// ─── Order Statuses ───────────────────────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  PROCESSING: 'processing',
  SHIPPED:    'shipped',
  DELIVERED:  'delivered',
  CANCELLED:  'cancelled',
  REFUNDED:   'refunded',
}

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]:    'Pending',
  [ORDER_STATUS.CONFIRMED]:  'Confirmed',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.SHIPPED]:    'Shipped',
  [ORDER_STATUS.DELIVERED]:  'Delivered',
  [ORDER_STATUS.CANCELLED]:  'Cancelled',
  [ORDER_STATUS.REFUNDED]:   'Refunded',
}

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  [ORDER_STATUS.CONFIRMED]:  'text-blue-400 bg-blue-400/10 border-blue-400/20',
  [ORDER_STATUS.PROCESSING]: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  [ORDER_STATUS.SHIPPED]:    'text-tz-info bg-tz-info/10 border-tz-info/20',
  [ORDER_STATUS.DELIVERED]:  'text-tz-success bg-tz-success/10 border-tz-success/20',
  [ORDER_STATUS.CANCELLED]:  'text-tz-accent bg-tz-accent/10 border-tz-accent/20',
  [ORDER_STATUS.REFUNDED]:   'text-tz-muted bg-tz-surface border-tz-border',
}

// ─── Payment Methods ──────────────────────────────────────────────────────────
export const PAYMENT_METHODS = {
  COD:        'cod',
  RAZORPAY:   'razorpay',
  UPI:        'upi',
}

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.COD]:      'Cash on Delivery',
  [PAYMENT_METHODS.RAZORPAY]: 'Card / Net Banking',
  [PAYMENT_METHODS.UPI]:      'UPI',
}

// ─── User Roles ───────────────────────────────────────────────────────────────
export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN:    'admin',
}

// ─── Price Ranges (for filter UI) ────────────────────────────────────────────
export const PRICE_RANGES = [
  { label: 'Under ₹500',        min: 0,    max: 500   },
  { label: '₹500 – ₹1,000',    min: 500,  max: 1000  },
  { label: '₹1,000 – ₹2,500',  min: 1000, max: 2500  },
  { label: '₹2,500 – ₹5,000',  min: 2500, max: 5000  },
  { label: 'Above ₹5,000',      min: 5000, max: null  },
]

// ─── Navigation Links ─────────────────────────────────────────────────────────
export const NAV_LINKS = [
  { label: 'New Arrivals', href: '/catalog?tag=new-arrival' },
  { label: 'Men',          href: '/catalog?gender=men'      },
  { label: 'Women',        href: '/catalog?gender=women'    },
  { label: 'Accessories',  href: '/catalog?category=accessories' },
  { label: 'Sale',         href: '/catalog?tag=sale'        },
]

// ─── Footer Links ─────────────────────────────────────────────────────────────
export const FOOTER_LINKS = {
  company: [
    { label: 'About Us',   href: '/about'   },
    { label: 'Careers',    href: '/careers' },
    { label: 'Press',      href: '/press'   },
    { label: 'Blog',       href: '/blog'    },
  ],
  support: [
    { label: 'Help Center',       href: '/help'     },
    { label: 'Track Order',       href: '/orders'   },
    { label: 'Returns & Refunds', href: '/returns'  },
    { label: 'Size Guide',        href: '/size-guide' },
    { label: 'Contact Us',        href: '/contact'  },
  ],
  legal: [
    { label: 'Privacy Policy',    href: '/privacy'  },
    { label: 'Terms of Service',  href: '/terms'    },
    { label: 'Cookie Policy',     href: '/cookies'  },
  ],
}

// ─── Social Links ─────────────────────────────────────────────────────────────
export const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com/trendzip', icon: 'Instagram' },
  { label: 'Twitter',   href: 'https://twitter.com/trendzip',   icon: 'Twitter'   },
  { label: 'Facebook',  href: 'https://facebook.com/trendzip',  icon: 'Facebook'  },
  { label: 'YouTube',   href: 'https://youtube.com/@trendzip',  icon: 'Youtube'   },
]

// ─── Indian States (for address form) ────────────────────────────────────────
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
]

// ─── Local Storage Keys ───────────────────────────────────────────────────────
export const LS_KEYS = {
  CART:     'trendzip_cart',
  WISHLIST: 'trendzip_wishlist',
  THEME:    'trendzip_theme',
}

// ─── Query Keys (for future React Query integration) ─────────────────────────
export const QUERY_KEYS = {
  PRODUCTS:    'products',
  PRODUCT:     'product',
  CATEGORIES:  'categories',
  ORDERS:      'orders',
  ORDER:       'order',
  USER:        'user',
  WISHLIST:    'wishlist',
}

// ─── Toast Duration ───────────────────────────────────────────────────────────
export const TOAST_DURATION = {
  SHORT:  2000,
  MEDIUM: 3500,
  LONG:   5000,
}