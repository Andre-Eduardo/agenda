import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIBlockProps {
  children: ReactNode;
  label?: string;
  footer?: ReactNode;
  className?: string;
}

/**
 * Visual container for AI-generated content. Per design-system.md §10.1:
 *  - Always uses border-left (3px teal) and NEVER border-radius
 *  - Background uses --color-ai-bg, text uses --color-ai-text
 *  - The "IA" badge is the only place this teal palette appears in the UI
 *
 * Pair with `<ConfidenceIndicator>` on extracted fields when applicable.
 */
export function AIBlock({
  children,
  label = "Gerado por IA · aguarda revisão",
  footer,
  className,
}: AIBlockProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-l-[3px] border-l-(--color-ai-border) bg-(--color-ai-bg) text-(--color-ai-text) p-(--padding-card)",
        className,
      )}
      style={{ borderRadius: 0 }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1 rounded-(--radius-badge) bg-(--color-ai-badge-bg) px-2 py-0.5 text-2xs font-medium text-(--color-ai-badge-text)">
          <Sparkles aria-hidden className="size-3" />
          IA
        </span>
        <span className="text-(--color-ai-text)">{label}</span>
      </div>
      <div className="text-sm-body">{children}</div>
      {footer && <div className="flex flex-wrap gap-2">{footer}</div>}
    </div>
  );
}
