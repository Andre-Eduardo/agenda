import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./ai-block.module.css";

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
    <div className={cn(styles.root, className)}>
      <div className={styles.header}>
        <span className={styles.badge}>
          <Sparkles aria-hidden className="size-3" />
          IA
        </span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
