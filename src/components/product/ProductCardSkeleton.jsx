export default function ProductCardSkeleton({ view = 'grid' }) {
    if (view === 'list') {
      return (
        <div className="flex gap-4 p-3 bg-tz-dark border border-tz-border">
          <div className="w-24 sm:w-32 aspect-[3/4] skeleton shrink-0" />
          <div className="flex-1 py-1 space-y-3">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-5 w-24 mt-auto" />
          </div>
        </div>
      )
    }
  
    return (
      <div className="bg-tz-dark border border-tz-border overflow-hidden">
        <div className="skeleton aspect-[3/4]" />
        <div className="p-3 sm:p-4 space-y-2.5">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-4 w-20" />
        </div>
      </div>
    )
  }