import {css} from '@/styled-system/css';

export const root = css({
    display: 'flex',
    h: 'full',
    minH: '[200px]',
    w: 'full',
    alignItems: 'center',
    justifyContent: 'center',
    bg: 'bg.page',
});

export const icon = css({
    w: '8',
    h: '8',
    color: 'primary.DEFAULT',
});
