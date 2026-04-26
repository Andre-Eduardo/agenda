import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 5 }: FormSkeletonProps) {
  // Skeletons are placeholders with no identity — index-based keys are safe.
  return (
    <div className="flex flex-col gap-5 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) p-(--padding-card)">
      {Array.from({ length: fields }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key -- skeleton placeholders have no identity; index keys are stable here
        <div key={`field-${i}`} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32 rounded-(--radius-data)" />
          <Skeleton className="h-10 w-full rounded-(--radius-input)" />
        </div>
      ))}
      <div className="mt-2 flex justify-end gap-3">
        <Skeleton className="h-10 w-24 rounded-(--radius-button)" />
        <Skeleton className="h-10 w-24 rounded-(--radius-button)" />
      </div>
    </div>
  );
}
