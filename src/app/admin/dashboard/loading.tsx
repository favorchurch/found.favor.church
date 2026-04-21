export default function DashboardLoading() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-64 bg-surface-active rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-surface-active rounded-xl border border-border-main" />
        ))}
      </div>
      <div className="h-20 bg-surface-active rounded-xl border border-border-main" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-72 bg-surface-active rounded-xl border border-border-main" />
        ))}
      </div>
    </div>
  );
}
