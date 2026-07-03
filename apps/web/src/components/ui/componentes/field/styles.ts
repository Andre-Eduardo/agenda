import {css} from '@/styled-system/css';

// ── Field ──────────────────────────────────────────────────────────────────────

export const field = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5',
});

export const labelRow = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
});

export const requiredMark = css({
    color: 'danger',
});

export const optionalText = css({
    fontSize: 'xs',
    fontWeight: 'normal',
    color: 'text.tertiary',
});

export const error = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    fontSize: 'xs',
    lineHeight: '[1.4]',
    color: 'warning',
});

export const hint = css({
    fontSize: 'xs',
    lineHeight: '[1.4]',
    color: 'text.tertiary',
});

// ── FormGrid ───────────────────────────────────────────────────────────────────

export const formGrid = css({
    display: 'grid',
    columnGap: '4',
    rowGap: '[14px]',
});

export const formGridCols12 = css({
    gridTemplateColumns: '[repeat(12,minmax(0,1fr))]',
});

export const formGridCols6 = css({
    gridTemplateColumns: '[repeat(6,minmax(0,1fr))]',
});

export const formGridCols4 = css({
    gridTemplateColumns: '[repeat(4,minmax(0,1fr))]',
});

export const formGridCols3 = css({
    gridTemplateColumns: '[repeat(3,minmax(0,1fr))]',
});
