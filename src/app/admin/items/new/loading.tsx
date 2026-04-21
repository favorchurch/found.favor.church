export default function ItemFormLoading() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 bg-surface-active rounded-lg" />
        <div className="space-y-2">
          <div className="h-7 w-40 bg-surface-active rounded-lg" />
          <div className="h-4 w-56 bg-surface-active rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-active rounded-xl" />
          ))}
        </div>
        <div className="aspect-square bg-surface-active rounded-xl" />
      </div>
    </div>
  );
}
