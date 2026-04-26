import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 6, columns = 4 }: TableSkeletonProps) {
  // Skeletons are placeholders with no identity — index-based keys are safe.
  /* eslint-disable react/no-array-index-key -- skeleton placeholders have no identity; index keys are stable here */
  return (
    <div className="flex flex-col gap-2 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) p-(--padding-card)">
      <div className="flex gap-3 border-b border-(--color-border) pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1 rounded-(--radius-data)" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-3 py-2">
          {Array.from({ length: columns }).map((_inner, c) => (
            <Skeleton key={`r-${r}-c-${c}`} className="h-6 flex-1 rounded-(--radius-data)" />
          ))}
        </div>
      ))}
    </div>
  );
  /* eslint-enable react/no-array-index-key -- end skeleton block */
}
