import {css} from '@/styled-system/css';

// ── TabsList ──────────────────────────────────────────────────────────────────

export const tabsList = css({
    display: 'flex',
    h: 'auto',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    bg: 'bg.surface',
    px: '1.5',
    pt: '1.5',
});

// ── TabsTrigger ───────────────────────────────────────────────────────────────

export const tabsTrigger = css({
    mb: '-1px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '[10px]',
    whiteSpace: 'nowrap',
    roundedTop: '[8px]',
    roundedBottom: 'none',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    px: '4',
    py: '[14px]',
    fontSize: '[13px]',
    fontWeight: 'medium',
    lineHeight: '[1.3]',
    color: 'text.secondary',
    transition: 'all',

    _hover: {
        bg: 'bg.card',
        color: 'text.primary',
    },

    '&[data-state="active"]': {
        borderBottomColor: 'primary',
        bg: 'bg.card',
        color: 'primary.text',
    },

    _focusVisible: {
        outline: 'none',
    },

    _disabled: {
        pointerEvents: 'none',
        opacity: '0.5',
    },
});

// ── TabsContent ───────────────────────────────────────────────────────────────

export const tabsContent = css({
    _focusVisible: {
        outline: 'none',
    },
});
