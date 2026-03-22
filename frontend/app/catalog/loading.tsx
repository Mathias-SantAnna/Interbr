export default function CatalogLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="ml-auto h-6 w-32 animate-pulse rounded-full bg-muted" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
      </div>

      <div className="flex gap-6">
        {/* Sidebar skeleton */}
        <aside className="hidden w-56 shrink-0 space-y-4 lg:block">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </aside>

        {/* Product grid skeleton */}
        <div className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border bg-card">
                {/* Image placeholder */}
                <div className="aspect-square w-full animate-pulse bg-muted" />
                <div className="space-y-2 p-4">
                  {/* Category badge */}
                  <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                  {/* Product name */}
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  {/* Price */}
                  <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                  {/* Button */}
                  <div className="mt-2 h-9 w-full animate-pulse rounded-lg bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
