import {css} from '@/styled-system/css';

export const formItem = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
});

export const formDescription = css({
    fontSize: 'sm',
    color: 'muted-foreground',
});

export const formMessage = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'destructive',
});
