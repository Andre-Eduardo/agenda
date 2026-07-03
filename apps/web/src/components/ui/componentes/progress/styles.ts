import {css} from '@/styled-system/css';

export const progressRoot = css({
    position: 'relative',
    h: '4',
    w: 'full',
    overflow: 'hidden',
    rounded: 'full',
    bg: 'secondary',
});

export const progressIndicator = css({
    h: 'full',
    w: 'full',
    flex: '1',
    bg: 'primary',
    transition: 'all',
});
