import {css} from '@/styled-system/css';

export const tooltipContent = css({
    zIndex: '50',
    overflow: 'hidden',
    rounded: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'popover',
    px: '3',
    py: '1.5',
    fontSize: 'sm',
    color: 'popover-foreground',
    boxShadow: 'dropdown',
    transformOrigin: 'var(--radix-tooltip-content-transform-origin)',
});
