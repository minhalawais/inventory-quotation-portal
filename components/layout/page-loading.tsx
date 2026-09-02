import { Skeleton } from "@/components/ui/skeleton"

/** Compact placeholder while a route segment is loading. */
export function PageLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite" aria-label="Loading page">
      <div className="space-y-2 border-b border-border pb-5">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20 hidden lg:block" />
        <Skeleton className="h-20 hidden lg:block" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <Skeleton className="h-10 w-full rounded-none" />
        <div className="space-y-0 divide-y divide-border">
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
        </div>
      </div>
    </div>
  )
}
