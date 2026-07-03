import {css} from '@/styled-system/css';

export const popoverContent = css({
    zIndex: '50',
    w: '72',
    rounded: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'popover',
    p: '4',
    color: 'popover-foreground',
    boxShadow: 'dropdown',
    outline: 'none',
    transformOrigin: 'var(--radix-popover-content-transform-origin)',
});
