import {css} from '@/styled-system/css';

export const root = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    px: '6',
    py: '12',
    textAlign: 'center',
});
export const iconWrapper = css({
    display: 'flex',
    w: '16',
    h: '16',
    alignItems: 'center',
    justifyContent: 'center',
    mb: '4',
    rounded: 'full',
    bg: 'bg.surface',
    color: 'text.secondary',
});
export const title = css({mb: '1', fontSize: 'sub', fontWeight: 'medium', color: 'text.primary'});
export const message = css({mb: '4', fontSize: 'sm', color: 'text.secondary'});
export const icon = css({w: '8', h: '8'});
