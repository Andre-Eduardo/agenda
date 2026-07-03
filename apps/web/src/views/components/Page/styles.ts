import {css, cva} from '@/styled-system/css';

export {cx} from '@/styled-system/css';

export const root = css({display: 'flex', flexDirection: 'column', p: '6', bg: 'bg.page'});

export const header = cva({
    base: {display: 'flex', mb: '6', gap: '4'},
    variants: {
        responsive: {
            true: {
                flexDirection: 'column',
                sm: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
            },
            false: {alignItems: 'flex-start', justifyContent: 'space-between'},
        },
    },
    defaultVariants: {responsive: false},
});

export const titleGroup = css({display: 'flex', flexDirection: 'column', gap: '1'});
export const title = css({
    fontSize: '2xl',
    lineHeight: '[1.2]',
    fontWeight: 'medium',
    color: 'text.primary',
    fontFamily: 'sans',
});
export const subtitle = css({fontSize: 'sm', color: 'text.secondary'});
export const actions = css({display: 'flex', alignItems: 'center', gap: '3'});
export const main = css({flex: '1'});
