import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ListToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function ListToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters,
  actions,
}: ListToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-1 min-w-70 items-center gap-3">
        {onSearchChange && (
          <div className="relative flex-1 max-w-105">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-(--color-text-tertiary)"
            />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        {filters}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
