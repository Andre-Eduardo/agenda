import {css} from '@/styled-system/css';

export const rowActions = css({display: 'flex', alignItems: 'center', gap: '2', ml: 'auto'});

export const qrCodeBox = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3',
    py: '2',
    textAlign: 'center',
});

export const qrCodeImage = css({w: '[240px]', h: '[240px]', rounded: '[8px]', bg: 'bg.surface'});
