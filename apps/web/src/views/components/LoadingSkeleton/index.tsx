import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  rows?: number;
  height?: number;
}

export function LoadingSkeleton({ rows = 5, height = 48 }: LoadingSkeletonProps) {
  // Skeletons are placeholders with no identity — index-based keys are safe.
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          // eslint-disable-next-line react/no-array-index-key -- skeleton placeholders have no identity; index keys are stable here
          key={`row-${i}`}
          className="rounded-(--radius-card-sm) w-full"
          style={{ height }}
        />
      ))}
    </div>
  );
}
