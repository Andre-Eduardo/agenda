import {css} from '@/styled-system/css';

export const root = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3',
    py: '16',
    textAlign: 'center',
});

export const icon = css({
    display: 'flex',
    w: '14',
    h: '14',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    bg: 'bg.surface',
    color: 'text.tertiary',
});

export const textGroup = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1',
});

export const title = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
});

export const description = css({
    fontSize: 'sm',
    color: 'text.secondary',
});

export const card = css({
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
});

export const actionWrapper = css({
    mt: '1',
});
