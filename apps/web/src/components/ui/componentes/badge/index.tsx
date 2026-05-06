import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border-transparent px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'bg-(--color-primary)/10 text-(--color-primary)',
        secondary:   'bg-(--color-bg-surface) text-(--color-text-secondary)',
        destructive: 'bg-(--color-danger)/10 text-(--color-danger)',
        outline:     'border border-(--color-border) text-(--color-text-primary)',
        success:     'bg-(--color-success)/10 text-(--color-success)',
        warning:     'bg-(--color-warning)/10 text-(--color-warning)',
        ai:          'bg-(--color-ai-bg) text-(--color-ai-text)',
      },
      // Variante semântica para status de appointment
      status: {
        SCHEDULED:   'bg-(--color-text-tertiary)/10 text-(--color-text-secondary)',
        CONFIRMED:   'bg-(--color-primary)/10 text-(--color-primary)',
        COMPLETED:   'bg-(--color-success)/10 text-(--color-success)',
        CANCELLED:   'bg-(--color-danger)/10 text-(--color-danger)',
        NO_SHOW:     'bg-(--color-warning)/10 text-(--color-warning)',
        ARRIVED:     'bg-(--color-primary)/15 text-(--color-primary)',
        IN_PROGRESS: 'bg-(--color-primary)/15 text-(--color-primary)',
      },
      // Variante para gênero do paciente
      gender: {
        MALE:   'bg-(--color-info-surface) text-(--color-info)',
        FEMALE: 'bg-(--color-primary-surface) text-(--color-primary-text)',
        OTHER:  'bg-(--color-bg-surface) text-(--color-text-secondary)',
      },
      // Variante para severidade de alertas clínicos
      severity: {
        HIGH:   'border border-(--color-danger)/30 bg-(--color-danger-surface) text-(--color-danger)',
        MEDIUM: 'border border-(--color-warning)/30 bg-(--color-warning-surface) text-(--color-warning)',
        LOW:    'border border-(--color-border) bg-(--color-bg-surface) text-(--color-text-secondary)',
      },
      // Variante para status clínico de evoluções
      clinicalStatus: {
        STABLE:            'border border-(--color-success) bg-(--color-success-surface) text-(--color-success)',
        IMPROVING:         'border border-(--color-success) bg-(--color-success-surface) text-(--color-success)',
        WORSENING:         'border border-(--color-danger) bg-(--color-danger-surface) text-(--color-danger)',
        UNCHANGED:         'border border-(--color-border) bg-(--color-bg-surface) text-(--color-text-secondary)',
        UNDER_OBSERVATION: 'border border-(--color-warning) bg-(--color-warning-surface) text-(--color-warning)',
      },
      // Variante para origem da evolução (IA vs manual)
      origin: {
        ai:     'border border-(--color-ai-border) bg-(--color-ai-bg) text-(--color-ai-text)',
        manual: 'border border-(--color-border) bg-(--color-bg-surface) text-(--color-text-secondary)',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-[11px]',
        lg: 'px-3 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, status, gender, severity, clinicalStatus, origin, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, status, gender, severity, clinicalStatus, origin, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
