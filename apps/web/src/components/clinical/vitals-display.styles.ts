import {css} from '@/styled-system/css';

export const grid = css({display: 'grid', gridTemplateColumns: '4', gap: '2'});
export const item = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '[3px]',
    rounded: 'data',
    bg: 'bg.surface',
    p: 'data-block',
});
export const itemLabel = css({fontSize: '2xs', lineHeight: '[1.2]', color: 'text.secondary'});
export const value = css({
    fontFamily: 'mono',
    fontSize: 'sm-body',
    lineHeight: '[1.2]',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.primary',
});
export const unit = css({fontFamily: 'mono', fontSize: '2xs', lineHeight: '[1.2]', color: 'text.tertiary'});
