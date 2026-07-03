import {css} from '@/styled-system/css';

// ── FormSkeleton ──────────────────────────────────────────────────────────────

export const formRoot = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '5',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    p: 'padding-card',
});

export const formField = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
});

export const formFieldLabel = css({
    h: '3',
    w: '32',
    rounded: 'data',
});

export const formFieldInput = css({
    h: '10',
    w: 'full',
    rounded: 'input',
});

export const formActions = css({
    mt: '2',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '3',
});

export const formActionButton = css({
    h: '10',
    w: '24',
    rounded: 'button',
});

// ── TableSkeleton ─────────────────────────────────────────────────────────────

export const tableRoot = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    p: 'padding-card',
});

export const tableHeader = css({
    display: 'flex',
    gap: '3',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    pb: '3',
});

export const tableHeaderCell = css({
    h: '4',
    flex: '1',
    rounded: 'data',
});

export const tableRow = css({
    display: 'flex',
    gap: '3',
    py: '2',
});

export const tableCell = css({
    h: '6',
    flex: '1',
    rounded: 'data',
});
