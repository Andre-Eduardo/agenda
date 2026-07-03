import {css} from '@/styled-system/css';

// ── SheetOverlay ──────────────────────────────────────────────────────────────

export const sheetOverlay = css({
    position: 'fixed',
    inset: '0',
    zIndex: '50',
    bg: 'black/80',
});

// ── SheetContent (base) ───────────────────────────────────────────────────────

export const sheetContent = css({
    position: 'fixed',
    zIndex: '50',
    gap: '4',
    bg: 'background',
    p: '6',
    boxShadow: 'lg',
    transition: 'all',
    transitionTimingFunction: 'ease-in-out',
});

// ── SheetContent side variants ────────────────────────────────────────────────

export const sheetSideTop = css({
    insetX: '0',
    top: '0',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
});

export const sheetSideBottom = css({
    insetX: '0',
    bottom: '0',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
});

export const sheetSideLeft = css({
    insetY: '0',
    left: '0',
    h: 'full',
    w: '3/4',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: 'border',

    sm: {
        maxW: 'sm',
    },
});

export const sheetSideRight = css({
    insetY: '0',
    right: '0',
    h: 'full',
    w: '3/4',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'border',

    sm: {
        maxW: 'sm',
    },
});

// ── SheetClose button ─────────────────────────────────────────────────────────

export const sheetCloseButton = css({
    position: 'absolute',
    right: '4',
    top: '4',
    rounded: 'sm',
    opacity: '0.7',
    cursor: 'pointer',
    transition: 'opacity',

    _focus: {
        outline: 'none',
        ring: '2',
        ringColor: 'ring',
        ringOffset: '2',
    },

    _disabled: {
        pointerEvents: 'none',
    },

    _hover: {
        opacity: '1',
    },

    '&[data-state="open"]': {
        bg: 'secondary',
    },
});

// ── SheetHeader ───────────────────────────────────────────────────────────────

export const sheetHeader = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    textAlign: 'center',

    sm: {
        textAlign: 'left',
    },
});

// ── SheetFooter ───────────────────────────────────────────────────────────────

export const sheetFooter = css({
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: '2',

    sm: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});

// ── SheetTitle ────────────────────────────────────────────────────────────────

export const sheetTitle = css({
    fontSize: 'lg',
    fontWeight: 'semibold',
    color: 'foreground',
});

// ── SheetDescription ──────────────────────────────────────────────────────────

export const sheetDescription = css({
    fontSize: 'sm',
    color: 'muted-foreground',
});
