const ITEMS = [
    'New Arrivals',
    'Premium Quality',
    'Free Shipping ₹999+',
    'Easy Returns',
    'COD Available',
    'Trending Now',
    'Exclusive Drops',
    'Made for India',
  ]
  
  export default function MarqueeBanner() {
    // Duplicate items for seamless loop
    const doubled = [...ITEMS, ...ITEMS]
  
    return (
      <div className="bg-tz-gold py-3 overflow-hidden" aria-hidden="true">
        <div
          className="flex gap-0 whitespace-nowrap"
          style={{
            animation: 'marquee 22s linear infinite',
            width: 'max-content',
          }}
        >
          {doubled.map((item, i) => (
            <span
              key={i}
              className="font-body text-tz-black text-xs font-semibold tracking-[0.2em] uppercase px-6 flex items-center gap-6"
            >
              {item}
              <span className="w-1 h-1 rounded-full bg-tz-black/30 inline-block" />
            </span>
          ))}
        </div>
      </div>
    )
  }