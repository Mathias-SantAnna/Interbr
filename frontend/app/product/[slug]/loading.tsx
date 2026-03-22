export default function ProductDetailsLoading() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="aspect-square w-full animate-pulse rounded-xl border bg-muted" />
        <div className="rounded-xl border p-4">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="rounded-xl border bg-muted/30 p-5">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-lg border bg-muted" />
        <div className="flex gap-3">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-36 animate-pulse rounded-lg border bg-muted" />
        </div>
      </div>
    </div>
  );
}
