export default function SystemLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 bg-slate-700/50 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-slate-700/30 rounded w-64 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="h-6 bg-slate-700/50 rounded w-32 mb-4 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-700/20 rounded">
                <div className="h-4 bg-slate-700/50 rounded w-24 animate-pulse" />
                <div className="h-6 bg-slate-700/50 rounded w-16 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="h-6 bg-slate-700/50 rounded w-32 mb-4 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-700/20 rounded">
                <div className="h-4 bg-slate-700/50 rounded w-24 animate-pulse" />
                <div className="h-6 bg-slate-700/50 rounded w-16 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="h-6 bg-slate-700/50 rounded w-48 mb-6 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-700/20 rounded-lg">
              <div>
                <div className="h-4 bg-slate-700/50 rounded w-32 mb-2 animate-pulse" />
                <div className="h-3 bg-slate-700/30 rounded w-48 animate-pulse" />
              </div>
              <div className="h-8 bg-slate-700/50 rounded w-20 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
