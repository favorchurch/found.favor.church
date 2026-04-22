export default function CatalogLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <div className="h-14 border-b border-border-main bg-surface animate-pulse" />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-surface-active rounded-lg" />
            <div className="h-4 w-80 bg-surface-active rounded" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 bg-surface-active rounded-xl border border-border-main animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
