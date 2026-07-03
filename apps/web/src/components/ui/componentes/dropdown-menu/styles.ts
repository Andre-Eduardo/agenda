import {css} from '@/styled-system/css';

// ── Shared content panel ──────────────────────────────────────────────────────

export const menuContent = css({
    zIndex: '50',
    minW: '[180px]',
    overflow: 'hidden',
    rounded: 'dropdown',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    p: '1.5',
    color: 'text.primary',
    boxShadow: 'dropdown',
    transformOrigin: 'var(--radix-dropdown-menu-content-transform-origin)',
});

// ── Shared item row ───────────────────────────────────────────────────────────

export const menuItem = css({
    position: 'relative',
    display: 'flex',
    cursor: 'pointer',
    userSelect: 'none',
    alignItems: 'center',
    gap: '2.5',
    rounded: '[6px]',
    px: '2.5',
    py: '2',
    fontSize: 'sm',
    color: 'text.primary',
    outline: 'none',
    transition: 'colors',

    _hover: {
        bg: 'bg.surface',
    },

    _focus: {
        bg: 'bg.surface',
    },

    _disabled: {
        pointerEvents: 'none',
        opacity: '0.5',
    },

    '&[data-state="open"]': {
        bg: 'bg.surface',
    },

    '& svg': {
        pointerEvents: 'none',
        w: '4',
        h: '4',
        flexShrink: '0',
    },
});

export const menuItemInset = css({
    pl: '8',
});

// ── CheckboxItem / RadioItem (shadcn-style, accent tokens) ────────────────────

export const menuCheckItem = css({
    position: 'relative',
    display: 'flex',
    cursor: 'default',
    userSelect: 'none',
    alignItems: 'center',
    rounded: 'sm',
    py: '1.5',
    pl: '8',
    pr: '2',
    fontSize: 'sm',
    outline: 'none',
    transition: 'colors',

    _focus: {
        bg: 'accent',
        color: 'accent-foreground',
    },

    _disabled: {
        pointerEvents: 'none',
        opacity: '0.5',
    },
});

export const menuItemIndicator = css({
    position: 'absolute',
    left: '2',
    display: 'flex',
    w: '3.5',
    h: '3.5',
    alignItems: 'center',
    justifyContent: 'center',
});

// ── Label ─────────────────────────────────────────────────────────────────────

export const menuLabel = css({
    px: '2',
    py: '1.5',
    fontSize: 'sm',
    fontWeight: 'semibold',
});

export const menuLabelInset = css({
    pl: '8',
});

// ── Separator ─────────────────────────────────────────────────────────────────

export const menuSeparator = css({
    my: '1',
    h: '1px',
    bg: 'border',
});

// ── Shortcut ──────────────────────────────────────────────────────────────────

export const menuShortcut = css({
    ml: 'auto',
    fontSize: 'xs',
    letterSpacing: 'widest',
    opacity: '0.6',
});
