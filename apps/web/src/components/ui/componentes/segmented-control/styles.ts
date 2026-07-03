import {css} from '@/styled-system/css';

// ── Root ───────────────────────────────────────────────────────────────────────

export const root = css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '[1px]',
    rounded: 'input',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
    p: '[3px]',
});

// ── Item ───────────────────────────────────────────────────────────────────────

export const item = css({
    display: 'inline-flex',
    h: '[26px]',
    cursor: 'pointer',
    userSelect: 'none',
    alignItems: 'center',
    gap: '1.5',
    rounded: '[4px]',
    px: '2.5',
    fontSize: 'xs',
    fontWeight: 'medium',
    transition: 'colors',
    transitionDuration: 'fast',
});

export const itemSelected = css({
    bg: 'bg.card',
    color: 'text.primary',
    boxShadow: 'sm',
});

export const itemUnselected = css({
    color: 'text.secondary',

    _hover: {
        color: 'text.primary',
    },
});
