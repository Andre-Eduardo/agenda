import {cva} from '@/styled-system/css';

// ── Base ──────────────────────────────────────────────────────────────────────

export const buttonVariants = cva({
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2',
        whiteSpace: 'nowrap',
        rounded: 'input',
        fontSize: 'sm',
        fontWeight: 'medium',
        transition: 'colors',
        cursor: 'pointer',
        userSelect: 'none',

        _focusVisible: {
            outline: 'none',
            ring: '2',
            ringColor: 'primary',
            ringOffset: '1',
        },

        _disabled: {
            pointerEvents: 'none',
            opacity: '0.5',
        },

        '& svg': {
            pointerEvents: 'none',
            flexShrink: '0',
        },
    },
    variants: {
        variant: {
            default: {
                bg: 'primary',
                color: 'white',

                '&:hover:not(:disabled)': {
                    bg: 'primary.hover',
                },
            },
            destructive: {
                bg: 'danger',
                color: 'white',

                '&:hover:not(:disabled)': {
                    opacity: '0.9',
                },
            },
            outline: {
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'border',
                bg: 'bg.card',
                color: 'text.primary',

                '&:hover:not(:disabled)': {
                    bg: 'bg.surface',
                    borderColor: 'border.hover',
                },
            },
            secondary: {
                bg: 'bg.surface',
                color: 'text.secondary',

                '&:hover:not(:disabled)': {
                    bg: 'border',
                    color: 'text.primary',
                },
            },
            ghost: {
                color: 'text.secondary',

                '&:hover:not(:disabled)': {
                    bg: 'bg.surface',
                    color: 'text.primary',
                },
            },
            link: {
                color: 'primary.text',
                textUnderlineOffset: '4',

                '&:hover:not(:disabled)': {
                    textDecoration: 'underline',
                },
            },
            ai: {
                bg: 'ai.badgeBg',
                color: 'white',

                '&:hover:not(:disabled)': {
                    bg: '[#0f766e]',
                },
            },
        },
        size: {
            default: {
                h: '[38px]',
                px: '4',
            },
            sm: {
                h: '[32px]',
                px: '3',
                fontSize: 'xs',
            },
            lg: {
                h: '[42px]',
                px: '6',
            },
            icon: {
                w: '9',
                h: '9',
            },
            'icon-sm': {
                w: '7',
                h: '7',
                fontSize: 'xs',
            },
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
