import {css} from '@/styled-system/css';

export const list = css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '[6px]',
    fontSize: 'sm',
    color: 'text.tertiary',
});

export const item = css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '[6px]',
});

export const link = css({
    cursor: 'pointer',
    color: 'text.secondary',
    transition: 'colors',

    _hover: {
        color: 'primary.text',
    },
});

export const page = css({
    color: 'text.primary',
});

export const separator = css({
    color: 'text.tertiary',

    '& svg': {
        w: '3',
        h: '3',
    },
});

export const ellipsis = css({
    display: 'flex',
    w: '7',
    h: '7',
    alignItems: 'center',
    justifyContent: 'center',
});

export const ellipsisIcon = css({
    w: '4',
    h: '4',
});
