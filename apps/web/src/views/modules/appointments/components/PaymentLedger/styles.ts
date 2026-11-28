import {css} from '@/styled-system/css';

export const panel = css({display: 'flex', flexDirection: 'column', gap: '2', mt: '3'});
export const panelHeader = css({display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2'});
export const movements = css({display: 'flex', flexDirection: 'column', gap: '1.5'});
export const movement = css({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '3',
    py: '1.5',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    _last: {borderBottomWidth: '0'},
});
export const movementMain = css({display: 'flex', flexDirection: 'column', gap: '0.5', minW: '0'});
export const amountIn = css({
    fontSize: 'sm',
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    color: 'success',
});
export const amountOut = css({
    fontSize: 'sm',
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    color: 'text.secondary',
});
export const actions = css({display: 'flex', alignItems: 'center', gap: '2', mt: '1'});
export const parts = css({display: 'flex', flexDirection: 'column', gap: '3', gridColumn: '1 / -1'});
export const partRow = css({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '2',
    alignItems: 'end',
    p: '2',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
});
export const removePart = css({justifySelf: 'end'});
export const partsFooter = css({display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2'});
export const partsTotal = css({fontSize: 'xs', color: 'text.tertiary', fontVariantNumeric: 'tabular-nums'});
