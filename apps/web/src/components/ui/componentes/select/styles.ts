import {css} from '@/styled-system/css';

// ── SelectTrigger ─────────────────────────────────────────────────────────────

export const selectTrigger = css({
    display: 'flex',
    h: '10',
    w: 'full',
    alignItems: 'center',
    justifyContent: 'space-between',
    rounded: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'input',
    bg: 'background',
    px: '3',
    py: '2',
    fontSize: 'sm',

    _focus: {
        outline: 'none',
        ring: '2',
        ringColor: 'ring',
        ringOffset: '2',
    },

    _disabled: {
        cursor: 'not-allowed',
        opacity: '0.5',
    },

    '&[data-placeholder]': {
        color: 'muted-foreground',
    },

    '& > span': {
        lineClamp: '1',
    },
});

// ── SelectScrollButtons ───────────────────────────────────────────────────────

export const selectScrollButton = css({
    display: 'flex',
    cursor: 'default',
    alignItems: 'center',
    justifyContent: 'center',
    py: '1',
});

// ── SelectContent ─────────────────────────────────────────────────────────────

export const selectContent = css({
    position: 'relative',
    zIndex: '50',
    maxH: 'var(--radix-select-content-available-height)',
    minW: '[8rem]',
    overflowY: 'auto',
    overflowX: 'hidden',
    rounded: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'popover',
    color: 'popover-foreground',
    boxShadow: 'md',
    transformOrigin: 'var(--radix-select-content-transform-origin)',
});

export const selectContentPopper = css({
    '&[data-side="bottom"]': {
        translateY: '1',
    },
    '&[data-side="left"]': {
        translateX: '-1',
    },
    '&[data-side="right"]': {
        translateX: '1',
    },
    '&[data-side="top"]': {
        translateY: '-1',
    },
});

// ── SelectViewport ────────────────────────────────────────────────────────────

export const selectViewport = css({
    p: '1',
});

export const selectViewportPopper = css({
    h: 'var(--radix-select-trigger-height)',
    w: 'full',
    minW: 'var(--radix-select-trigger-width)',
});

// ── SelectLabel ───────────────────────────────────────────────────────────────

export const selectLabel = css({
    py: '1.5',
    pl: '8',
    pr: '2',
    fontSize: 'sm',
    fontWeight: 'semibold',
});

// ── SelectItem ────────────────────────────────────────────────────────────────

export const selectItem = css({
    position: 'relative',
    display: 'flex',
    w: 'full',
    cursor: 'default',
    userSelect: 'none',
    alignItems: 'center',
    rounded: 'sm',
    py: '1.5',
    pl: '8',
    pr: '2',
    fontSize: 'sm',
    outline: 'none',

    _focus: {
        bg: 'accent',
        color: 'accent-foreground',
    },

    _disabled: {
        pointerEvents: 'none',
        opacity: '0.5',
    },
});

export const selectItemIndicator = css({
    position: 'absolute',
    left: '2',
    display: 'flex',
    w: '3.5',
    h: '3.5',
    alignItems: 'center',
    justifyContent: 'center',
});

// ── SelectSeparator ───────────────────────────────────────────────────────────

export const selectSeparator = css({
    mx: '-1',
    my: '1',
    h: '1px',
    bg: 'muted',
});
