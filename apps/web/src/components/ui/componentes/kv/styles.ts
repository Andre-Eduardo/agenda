import {css} from '@/styled-system/css';

export const root = css({
    display: 'flex',
    minW: '0',
    flexDirection: 'column',
    gap: '[2px]',
});

export const label = css({
    fontSize: 'xs',
    lineHeight: '[1.3]',
    color: 'text.tertiary',
});

export const value = css({
    overflowWrap: 'break-word',
    fontSize: 'sm',
    lineHeight: '[1.4]',
    color: 'text.primary',
});

export const valueMono = css({
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
});

export const valueEmpty = css({
    fontStyle: 'italic',
    color: 'text.tertiary',
});

export const grid = css({
    display: 'grid',
    columnGap: '6',
    rowGap: '4',
});

export const gridCols2 = css({
    gridTemplateColumns: '[repeat(2,minmax(0,1fr))]',
});

export const gridCols3 = css({
    gridTemplateColumns: '[repeat(3,minmax(0,1fr))]',
});

export const gridCols4 = css({
    gridTemplateColumns: '[repeat(4,minmax(0,1fr))]',
});
