import {css, cva} from '@/styled-system/css';

// ── Base ──────────────────────────────────────────────────────────────────────

export const inputVariants = cva({
    base: {
        w: 'full',
        rounded: 'input',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'border',
        bg: 'bg.card',
        px: '3',
        py: '[9px]',
        fontSize: 'sm',
        lineHeight: '[1.4]',
        color: 'text.primary',
        transition: 'colors',

        _placeholder: {
            color: 'text.tertiary',
        },

        _hover: {
            '&:not(:disabled)': {
                borderColor: 'border.hover',
            },
        },

        _focus: {
            borderColor: 'primary',
            outline: 'none',
        },

        _disabled: {
            cursor: 'not-allowed',
            opacity: '0.5',
        },

        '&::file-selector-button': {
            borderWidth: '0',
            bg: 'transparent',
            fontSize: 'sm',
            fontWeight: 'medium',
        },
    },
    variants: {
        appearance: {
            default: {},
            mono: {
                fontFamily: 'mono',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '[13px]',
            },
        },
        state: {
            default: {},
            error: {
                borderColor: 'warning',

                _focus: {
                    borderColor: 'warning',
                },
            },
        },
    },
    defaultVariants: {
        appearance: 'default',
        state: 'default',
    },
});

// ── Icon padding modifiers ────────────────────────────────────────────────────

export const withLeadIcon = css({
    pl: '[36px]',
});

export const withTrailIcon = css({
    pr: '8',
});

// ── Icon wrapper ──────────────────────────────────────────────────────────────

export const wrapper = css({
    position: 'relative',
});

export const leadIcon = css({
    pointerEvents: 'none',
    position: 'absolute',
    left: '3',
    top: '1/2',
    translateY: '-1/2',
    color: 'text.tertiary',
});

export const trailIcon = css({
    pointerEvents: 'none',
    position: 'absolute',
    right: '3',
    top: '1/2',
    translateY: '-1/2',
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    color: 'text.tertiary',
});
