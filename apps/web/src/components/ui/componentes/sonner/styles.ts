import {css} from '@/styled-system/css';

export const icon = css({
    w: '4',
    h: '4',
});

export const toast = css({
    '.toaster &': {
        bg: 'background',
        color: 'foreground',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'border',
        boxShadow: 'lg',
    },
});

export const description = css({
    '.toast &': {
        color: 'muted-foreground',
    },
});

export const actionButton = css({
    '.toast &': {
        bg: 'primary',
        color: 'primary-foreground',
    },
});

export const cancelButton = css({
    '.toast &': {
        bg: 'muted',
        color: 'muted-foreground',
    },
});
