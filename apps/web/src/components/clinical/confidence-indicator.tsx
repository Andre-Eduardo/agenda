import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfidenceLevel = "high" | "mid" | "low";

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  label?: string;
  className?: string;
}

/**
 * Per-field confidence chip used on AI-extracted form fields (OCR, suggestions).
 * See design-system.md §10.3.
 *
 * TODO: integrate with form field rendering — apply matching border color to
 * the input itself when the field is wrapped (border-(--color-confidence-{level})).
 */
export function ConfidenceIndicator({ level, label, className }: ConfidenceIndicatorProps) {
  const config = {
    high: {
      Icon: CheckCircle2,
      color: "text-(--color-confidence-high)",
      defaultLabel: "Alta confiança",
    },
    mid: {
      Icon: AlertTriangle,
      color: "text-(--color-confidence-mid)",
      defaultLabel: "Confiança moderada",
    },
    low: {
      Icon: XCircle,
      color: "text-(--color-confidence-low)",
      defaultLabel: "Baixa confiança — revisar",
    },
  }[level];

  const { Icon } = config;

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", config.color, className)}>
      <Icon aria-hidden className="size-3.5" />
      {label ?? config.defaultLabel}
    </span>
  );
}
