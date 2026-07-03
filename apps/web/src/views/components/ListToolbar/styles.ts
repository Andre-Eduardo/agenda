import {css} from '@/styled-system/css';

export const root = css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '3',
    mb: '4',
});
export const left = css({display: 'flex', flex: '1', minW: '70', alignItems: 'center', gap: '3'});
export const searchWrapper = css({position: 'relative', flex: '1', maxW: '105'});
export const searchIcon = css({
    position: 'absolute',
    left: '3',
    top: '1/2',
    transform: 'translateY(-1/2)',
    w: '4',
    h: '4',
    color: 'text.tertiary',
});
export const actions = css({display: 'flex', alignItems: 'center', gap: '3'});
export const searchInput = css({pl: '[36px]'});
