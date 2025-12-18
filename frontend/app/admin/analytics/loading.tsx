export default function AnalyticsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 bg-slate-700/50 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-slate-700/30 rounded w-64 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-slate-700/30 rounded w-24 mb-2 animate-pulse" />
                <div className="h-8 bg-slate-700/50 rounded w-16 animate-pulse" />
              </div>
              <div className="w-8 h-8 bg-slate-700/50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="h-6 bg-slate-700/50 rounded w-32 mb-4 animate-pulse" />
          <div className="h-64 bg-slate-700/20 rounded animate-pulse" />
        </div>
        <div className="card">
          <div className="h-6 bg-slate-700/50 rounded w-32 mb-4 animate-pulse" />
          <div className="h-64 bg-slate-700/20 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
