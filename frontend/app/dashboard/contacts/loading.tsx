export default function ContactsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 bg-slate-700/50 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-slate-700/30 rounded w-64 animate-pulse" />
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-slate-700/50 rounded w-32 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 bg-slate-700/50 rounded w-32 animate-pulse" />
            <div className="h-10 bg-slate-700/50 rounded w-24 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="p-4 bg-slate-700/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-slate-700/50 rounded-full animate-pulse" />
                <div>
                  <div className="h-4 bg-slate-700/50 rounded w-24 mb-1 animate-pulse" />
                  <div className="h-3 bg-slate-700/30 rounded w-16 animate-pulse" />
                </div>
              </div>
              <div className="h-3 bg-slate-700/30 rounded w-32 mb-2 animate-pulse" />
              <div className="h-8 bg-slate-700/50 rounded w-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
