import {css} from '@/styled-system/css';

// ── Wrapper ───────────────────────────────────────────────────────────────────

export const wrapper = css({
    position: 'relative',
    w: 'full',
    overflow: 'auto',
});

// ── Table ─────────────────────────────────────────────────────────────────────

export const table = css({
    w: 'full',
    captionSide: 'bottom',
    fontSize: 'sm',
});

// ── TableHeader ───────────────────────────────────────────────────────────────

export const tableHeader = css({
    '& tr': {
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'border',
    },
});

// ── TableBody ─────────────────────────────────────────────────────────────────

export const tableBody = css({
    '& tr:last-child': {
        borderBottomWidth: '0',
    },
});

// ── TableFooter ───────────────────────────────────────────────────────────────

export const tableFooter = css({
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    bg: 'muted/50',
    fontWeight: 'medium',

    '& > tr:last-child': {
        borderBottomWidth: '0',
    },
});

// ── TableRow ──────────────────────────────────────────────────────────────────

export const tableRow = css({
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    transition: 'colors',

    _hover: {
        bg: 'muted/50',
    },

    '&[data-state="selected"]': {
        bg: 'muted',
    },
});

// ── TableHead ─────────────────────────────────────────────────────────────────

export const tableHead = css({
    h: '12',
    px: '4',
    textAlign: 'left',
    verticalAlign: 'middle',
    fontWeight: 'medium',
    color: 'muted-foreground',

    '&:has([role="checkbox"])': {
        pr: '0',
    },
});

// ── TableCell ─────────────────────────────────────────────────────────────────

export const tableCell = css({
    p: '4',
    verticalAlign: 'middle',

    '&:has([role="checkbox"])': {
        pr: '0',
    },
});

// ── TableCaption ──────────────────────────────────────────────────────────────

export const tableCaption = css({
    mt: '4',
    fontSize: 'sm',
    color: 'muted-foreground',
});
