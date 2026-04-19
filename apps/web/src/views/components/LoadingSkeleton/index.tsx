import { Skeleton, Stack } from '@mantine/core';

interface LoadingSkeletonProps {
  rows?: number;
  height?: number;
}

export function LoadingSkeleton({ rows = 5, height = 48 }: LoadingSkeletonProps) {
  return (
    <Stack gap="xs">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={height} radius="md" />
      ))}
    </Stack>
  );
}
