import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  responsiveActions?: boolean;
  children: ReactNode;
  className?: string;
}

export function Page({
  title,
  subtitle,
  actions,
  responsiveActions = false,
  children,
  className,
}: PageProps) {
  return (
    <div className={cn("flex flex-col p-6 bg-(--color-bg-page)", className)}>
      <header
        className={cn(
          "mb-6 flex gap-4",
          responsiveActions
            ? "flex-col sm:flex-row sm:items-start sm:justify-between"
            : "items-start justify-between",
        )}
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl leading-[1.2] font-medium text-(--color-text-primary) font-sans">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-(--color-text-secondary)">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
