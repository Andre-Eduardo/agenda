import {css} from '@/styled-system/css';

export const container = css({
    display: 'flex',
    minH: 'screen',
    alignItems: 'center',
    justifyContent: 'center',
    bg: 'bg.page',
    p: '6',
});

export const card = css({
    w: 'full',
    maxW: 'md',
    boxShadow: 'none',
});

export const cardHeader = css({
    textAlign: 'center',
});

export const iconWrapper = css({
    mx: 'auto',
    mb: '4',
    display: 'flex',
    w: '12',
    h: '12',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    bg: 'warning.surface',
    color: 'warning.DEFAULT',
});

export const icon = css({
    w: '6',
    h: '6',
});

export const title = css({
    fontSize: 'lead',
});

export const description = css({
    fontSize: 'sm',
    color: 'text.secondary',
});

export const cardContent = css({
    display: 'flex',
    justifyContent: 'center',
});
