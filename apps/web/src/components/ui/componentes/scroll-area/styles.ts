import {css} from '@/styled-system/css';

export const scrollArea = css({
    position: 'relative',
    overflow: 'hidden',
});

export const scrollAreaViewport = css({
    h: 'full',
    w: 'full',
    rounded: 'inherit',
});

export const scrollBar = css({
    display: 'flex',
    touchAction: 'none',
    userSelect: 'none',
    transition: 'colors',
});

export const scrollBarVertical = css({
    h: 'full',
    w: '2.5',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'transparent',
    p: '[1px]',
});

export const scrollBarHorizontal = css({
    h: '2.5',
    flexDirection: 'column',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'transparent',
    p: '[1px]',
});

export const scrollBarThumb = css({
    position: 'relative',
    flex: '1',
    rounded: 'full',
    bg: 'border',
});
