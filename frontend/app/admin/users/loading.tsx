export default function UsersLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 bg-slate-700/50 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-slate-700/30 rounded w-64 animate-pulse" />
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-slate-700/50 rounded w-32 animate-pulse" />
          <div className="h-10 bg-slate-700/50 rounded w-32 animate-pulse" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-700/20 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-700/50 rounded-full animate-pulse" />
                <div>
                  <div className="h-4 bg-slate-700/50 rounded w-32 mb-2 animate-pulse" />
                  <div className="h-3 bg-slate-700/30 rounded w-48 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-6 bg-slate-700/50 rounded w-16 animate-pulse" />
                <div className="h-8 bg-slate-700/50 rounded w-20 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
