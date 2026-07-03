import {css} from '@/styled-system/css';

// ── DialogOverlay ─────────────────────────────────────────────────────────────

export const dialogOverlay = css({
    position: 'fixed',
    inset: '0',
    zIndex: '50',
    bg: 'black/80',
});

// ── DialogContent ─────────────────────────────────────────────────────────────

export const dialogContent = css({
    position: 'fixed',
    left: '[50%]',
    top: '[50%]',
    zIndex: '50',
    display: 'grid',
    w: 'full',
    maxW: 'lg',
    transform: '[translate(-50%,-50%)]',
    gap: '4',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'background',
    p: '6',
    boxShadow: 'lg',

    sm: {
        rounded: 'lg',
    },
});

// ── DialogClose button (inside DialogContent) ─────────────────────────────────

export const dialogCloseButton = css({
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
        bg: 'accent',
        color: 'muted-foreground',
    },
});

// ── DialogHeader ──────────────────────────────────────────────────────────────

export const dialogHeader = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5',
    textAlign: 'center',

    sm: {
        textAlign: 'left',
    },
});

// ── DialogFooter ──────────────────────────────────────────────────────────────

export const dialogFooter = css({
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: '2',

    sm: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});

// ── DialogTitle ───────────────────────────────────────────────────────────────

export const dialogTitle = css({
    fontSize: 'lg',
    fontWeight: 'semibold',
    lineHeight: 'none',
    letterSpacing: 'tight',
});

// ── DialogDescription ─────────────────────────────────────────────────────────

export const dialogDescription = css({
    fontSize: 'sm',
    color: 'muted-foreground',
});
