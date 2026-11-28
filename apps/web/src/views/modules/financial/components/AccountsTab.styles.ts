import {css} from '@/styled-system/css';

export const statementFilters = css({display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '3'});
export const statementFooter = css({display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2'});
export const amountIn = css({
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    color: 'success',
});
export const amountOut = css({
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    color: 'text.secondary',
});
export const skeletonBlock = css({h: '10', rounded: 'card'});
