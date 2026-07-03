import {css} from '@/styled-system/css';

export const base = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    lineHeight: '[1.3]',
    color: 'text.primary',

    '&:is(.peer:disabled ~ *)': {
        cursor: 'not-allowed',
        opacity: '0.7',
    },
});
