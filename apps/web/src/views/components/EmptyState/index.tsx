import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-(--color-bg-surface) text-(--color-text-secondary)">
        <Icon aria-hidden className="size-8" />
      </div>
      <p className="mb-1 text-sub font-medium text-(--color-text-primary)">
        {title ?? t("states.empty")}
      </p>
      {message && <p className="mb-4 text-sm text-(--color-text-secondary)">{message}</p>}
      {action}
    </div>
  );
}
