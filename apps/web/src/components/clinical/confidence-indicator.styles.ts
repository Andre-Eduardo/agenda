import {css, cva} from '@/styled-system/css';

export {cx} from '@/styled-system/css';

export const root = css({display: 'inline-flex', alignItems: 'center', gap: '1', fontSize: 'xs'});

export const level = cva({
    base: {},
    variants: {
        confidence: {
            high: {color: 'confidence.high'},
            mid: {color: 'confidence.mid'},
            low: {color: 'confidence.low'},
        },
    },
});
