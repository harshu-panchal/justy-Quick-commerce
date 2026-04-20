import { Skeleton, SkeletonCircle } from "../../../components/ui/Skeleton";

export default function SkeletonHome() {
  return (
    <div className="bg-white min-h-screen pb-20 md:pb-0 overflow-hidden">
      {/* Hero Header Skeleton */}
      <div className="px-4 pt-4 pb-4 bg-neutral-100/50">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-12 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-full mb-3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 px-4 py-3 overflow-hidden border-b border-neutral-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <SkeletonCircle className="h-8 w-8" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>

      {/* Banner Skeleton */}
      <div className="px-4 mt-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>

      {/* Quick Delivery Section Skeleton */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Dynamic Sections Skeleton */}
      <div className="px-4 mt-8 space-y-8">
        {[1, 2].map((section) => (
          <div key={section}>
            <Skeleton className="h-7 w-56 mb-4" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Product Grid Skeleton */}
      <div className="px-4 mt-8">
        <Skeleton className="h-7 w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
