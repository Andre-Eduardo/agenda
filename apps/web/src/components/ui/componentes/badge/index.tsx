import * as React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@/lib/utils';
import styles from './badge.module.css';

// ── Variantes ─────────────────────────────────────────────────────────────────

const badgeVariants = cva(styles.base, {
  variants: {
    variant: {
      default:     styles.variantDefault,
      secondary:   styles.variantSecondary,
      destructive: styles.variantDestructive,
      outline:     styles.variantOutline,
      success:     styles.variantSuccess,
      warning:     styles.variantWarning,
      ai:          styles.variantAi,
    },
    // Variante semântica para status de appointment
    status: {
      SCHEDULED:   styles.statusScheduled,
      CONFIRMED:   styles.statusConfirmed,
      COMPLETED:   styles.statusCompleted,
      CANCELLED:   styles.statusCancelled,
      NO_SHOW:     styles.statusNoShow,
      ARRIVED:     styles.statusArrived,
      IN_PROGRESS: styles.statusInProgress,
    },
    // Variante para gênero do paciente
    gender: {
      MALE:   styles.genderMale,
      FEMALE: styles.genderFemale,
      OTHER:  styles.genderOther,
    },
    // Variante para severidade de alertas clínicos
    severity: {
      HIGH:   styles.severityHigh,
      MEDIUM: styles.severityMedium,
      LOW:    styles.severityLow,
    },
    // Variante para status clínico de evoluções
    clinicalStatus: {
      STABLE:            styles.clinicalStatusStable,
      IMPROVING:         styles.clinicalStatusImproving,
      WORSENING:         styles.clinicalStatusWorsening,
      UNCHANGED:         styles.clinicalStatusUnchanged,
      UNDER_OBSERVATION: styles.clinicalStatusUnderObservation,
    },
    // Variante para origem da evolução (IA vs manual)
    origin: {
      ai:     styles.originAi,
      manual: styles.originManual,
    },
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

// ── Componente ────────────────────────────────────────────────────────────────

function Badge({
  className,
  variant,
  status,
  gender,
  severity,
  clinicalStatus,
  origin,
  size,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({variant, status, gender, severity, clinicalStatus, origin, size}),
        className,
      )}
      {...props}
    />
  );
}

export {Badge, badgeVariants};
