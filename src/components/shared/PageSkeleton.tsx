import { Skeleton } from "@/components/ui/skeleton";

// Shown by the (app) route segments' loading.tsx while a page's data streams in.
export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <main className="flex-1 space-y-6 p-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    </main>
  );
}
