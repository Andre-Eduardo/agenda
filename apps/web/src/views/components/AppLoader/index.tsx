import { Loader2 } from "lucide-react";

export function AppLoader() {
  return (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-(--color-bg-page)">
      <Loader2 aria-label="Loading" className="size-8 animate-spin text-(--color-primary)" />
    </div>
  );
}
