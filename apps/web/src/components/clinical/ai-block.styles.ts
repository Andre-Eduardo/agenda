import {css} from '@/styled-system/css';

export const root = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'ai.border',
    bg: 'ai.bg',
    color: 'ai.text',
    p: 'card',
    rounded: '0',
});

export const header = css({display: 'flex', alignItems: 'center', gap: '2', fontSize: 'sm'});

export const badge = css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    rounded: 'badge',
    bg: 'ai.badge.bg',
    px: '2',
    py: '0.5',
    fontSize: '2xs',
    fontWeight: 'medium',
    color: 'ai.badge.text',
});

export const label = css({color: 'ai.text'});
export const body = css({fontSize: 'sm-body'});
export const footer = css({display: 'flex', flexWrap: 'wrap', gap: '2'});
