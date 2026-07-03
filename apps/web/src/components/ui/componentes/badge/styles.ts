import {cva} from '@/styled-system/css';

// ── Base ──────────────────────────────────────────────────────────────────────

export const badgeVariants = cva({
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1',
        rounded: 'full',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'transparent',
        px: '2.5',
        py: '0.5',
        fontSize: '[11px]',
        fontWeight: 'medium',
        transition: 'colors',

        _focus: {
            outline: 'none',
            ring: '2',
            ringColor: 'primary',
            ringOffset: '2',
        },
    },
    variants: {
        variant: {
            default: {
                bg: 'primary/10',
                color: 'primary',
            },
            secondary: {
                bg: 'bg.surface',
                color: 'text.secondary',
            },
            destructive: {
                bg: 'danger/10',
                color: 'danger',
            },
            outline: {
                borderColor: 'border',
                color: 'text.primary',
            },
            success: {
                bg: 'success/10',
                color: 'success',
            },
            warning: {
                bg: 'warning/10',
                color: 'warning',
            },
            ai: {
                bg: 'ai.bg',
                color: 'ai.text',
            },
        },
        status: {
            SCHEDULED: {
                bg: 'text.tertiary/10',
                color: 'text.secondary',
            },
            CONFIRMED: {
                bg: 'primary/10',
                color: 'primary',
            },
            COMPLETED: {
                bg: 'success/10',
                color: 'success',
            },
            CANCELLED: {
                bg: 'danger/10',
                color: 'danger',
            },
            NO_SHOW: {
                bg: 'warning/10',
                color: 'warning',
            },
            ARRIVED: {
                bg: 'primary/15',
                color: 'primary',
            },
            IN_PROGRESS: {
                bg: 'primary/15',
                color: 'primary',
            },
        },
        gender: {
            MALE: {
                bg: 'info.surface',
                color: 'info',
            },
            FEMALE: {
                bg: 'primary.surface',
                color: 'primary.text',
            },
            OTHER: {
                bg: 'bg.surface',
                color: 'text.secondary',
            },
        },
        severity: {
            HIGH: {
                borderColor: 'danger/30',
                bg: 'danger.surface',
                color: 'danger',
            },
            MEDIUM: {
                borderColor: 'warning/30',
                bg: 'warning.surface',
                color: 'warning',
            },
            LOW: {
                borderColor: 'border',
                bg: 'bg.surface',
                color: 'text.secondary',
            },
        },
        clinicalStatus: {
            STABLE: {
                borderColor: 'success',
                bg: 'success.surface',
                color: 'success',
            },
            IMPROVING: {
                borderColor: 'success',
                bg: 'success.surface',
                color: 'success',
            },
            WORSENING: {
                borderColor: 'danger',
                bg: 'danger.surface',
                color: 'danger',
            },
            UNCHANGED: {
                borderColor: 'border',
                bg: 'bg.surface',
                color: 'text.secondary',
            },
            UNDER_OBSERVATION: {
                borderColor: 'warning',
                bg: 'warning.surface',
                color: 'warning',
            },
        },
        origin: {
            ai: {
                borderColor: 'ai.border',
                bg: 'ai.bg',
                color: 'ai.text',
            },
            manual: {
                borderColor: 'border',
                bg: 'bg.surface',
                color: 'text.secondary',
            },
        },
        size: {
            sm: {
                px: '2',
                py: '0.5',
                fontSize: '[10px]',
            },
            md: {
                px: '2.5',
                py: '0.5',
                fontSize: '[11px]',
            },
            lg: {
                px: '3',
                py: '1',
                fontSize: 'xs',
            },
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'md',
    },
});
