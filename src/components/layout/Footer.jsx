import { Link }    from 'react-router-dom'
import { Zap, Instagram, Twitter, Facebook, Youtube, Mail, MapPin, Phone } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export default function Footer() {
  const year = new Date().getFullYear()

  const socials = [
    { label: 'Instagram', Icon: Instagram, href: 'https://instagram.com' },
    { label: 'Twitter',   Icon: Twitter,   href: 'https://twitter.com'   },
    { label: 'Facebook',  Icon: Facebook,  href: 'https://facebook.com'  },
    { label: 'YouTube',   Icon: Youtube,   href: 'https://youtube.com'   },
  ]

  const contacts = [
    { Icon: Mail,   text: 'support@trendzip.in' },
    { Icon: Phone,  text: '+91 98765 43210'      },
    { Icon: MapPin, text: 'Mumbai, India'         },
  ]

  const company = [
    { label: 'About Us', href: '/about'   },
    { label: 'Blog',     href: '/blog'    },
    { label: 'Careers',  href: '/careers' },
    { label: 'Press',    href: '/press'   },
  ]

  const support = [
    { label: 'Help Center',       href: '/help'       },
    { label: 'Contact Us',        href: '/contact'    },
    { label: 'Returns & Refunds', href: '/returns'    },
    { label: 'Size Guide',        href: '/size-guide' },
    { label: 'Track Order',       href: '/orders'     },
  ]

  const legal = [
    { label: 'Privacy Policy',   href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms'          },
    { label: 'Cookie Policy',    href: '/cookie-policy'  },
  ]

  return (
    <footer className="bg-tz-dark border-t border-tz-border mt-auto">

      {/* Newsletter */}
      <div className="border-b border-tz-border">
        <div className="page-container py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12">
            <div className="flex-1">
              <p className="eyebrow mb-2">Stay in the loop</p>
              <h3 className="font-display text-2xl text-tz-white font-light">
                Get exclusive access to new drops
              </h3>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="input-base flex-1 md:w-72 border-r-0"
                aria-label="Email for newsletter"
              />
              <button type="button" className="btn-primary shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="page-container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-tz-gold flex items-center justify-center">
                <Zap size={14} className="text-tz-black" fill="currentColor" />
              </div>
              <span className="font-display text-xl text-tz-white font-light tracking-wider">
                {APP_NAME}
              </span>
            </Link>
            <p className="text-sm text-tz-muted leading-relaxed mb-6 max-w-[220px]">
              Premium D2C fashion for the modern Indian. Quality that moves with you.
            </p>
            <div className="flex items-center gap-3">
              {socials.map((item) => (
                
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="w-9 h-9 border border-tz-border text-tz-muted hover:text-tz-gold hover:border-tz-gold/40 flex items-center justify-center transition-all duration-200"
                >
                  <item.Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-tz-white mb-5">
              Company
            </h4>
            <ul className="space-y-3">
              {company.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-tz-muted hover:text-tz-gold transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-tz-white mb-5">
              Support
            </h4>
            <ul className="space-y-3">
              {support.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-tz-muted hover:text-tz-gold transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-tz-white mb-5">
              Contact
            </h4>
            <ul className="space-y-3">
              {contacts.map((item) => (
                <li key={item.text} className="flex items-center gap-2.5 text-sm text-tz-muted">
                  <item.Icon size={14} className="text-tz-gold shrink-0" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-tz-border">
        <div className="page-container py-5 flex flex-col sm:flex-row items-center gap-3">
          <p className="text-xs text-tz-muted">
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <div className="sm:ml-auto flex items-center gap-5 flex-wrap justify-center">
            {legal.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-xs text-tz-muted hover:text-tz-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  )
}