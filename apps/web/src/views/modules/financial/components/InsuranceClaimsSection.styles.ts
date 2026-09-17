import {css} from '@/styled-system/css';

export const actions = css({display: 'flex', flexWrap: 'wrap', gap: '2'});
export const amount = css({fontFamily: 'mono', fontSize: 'xs', color: 'text.secondary'});
export const row = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '3',
    p: '3',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
});
export const info = css({display: 'flex', flexDirection: 'column', gap: '0.5'});
export const name = css({fontSize: 'sm', color: 'text.primary'});
export const meta = css({fontSize: 'xs', color: 'text.secondary', fontFamily: 'mono'});
export const formBody = css({display: 'flex', flexDirection: 'column', gap: '3', py: '2'});
export const formFooter = css({display: 'flex', justifyContent: 'flex-end', gap: '2', mt: '2'});
