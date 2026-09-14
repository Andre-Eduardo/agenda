import {css} from '@/styled-system/css';

export const wrap = css({display: 'flex', flexDirection: 'column', gap: '4'});

export const block = css({display: 'flex', flexDirection: 'column', gap: '2'});
export const blockHeader = css({display: 'flex', alignItems: 'center', justifyContent: 'space-between'});
export const blockTitle = css({fontSize: 'xs', fontWeight: 'medium', color: 'text.secondary'});

export const card = css({
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

export const cardInfo = css({display: 'flex', flexDirection: 'column', gap: '0.5'});
export const cardName = css({fontSize: 'sm', color: 'text.primary'});
export const cardMeta = css({fontSize: 'xs', color: 'text.secondary', fontFamily: 'mono'});
export const cardActions = css({display: 'flex', alignItems: 'center', gap: '2'});

export const emptyText = css({fontSize: 'xs', color: 'text.tertiary', py: '2'});

export const formBody = css({display: 'flex', flexDirection: 'column', gap: '3', py: '2'});
export const formField = css({display: 'flex', flexDirection: 'column', gap: '1.5'});
export const formFooter = css({display: 'flex', justifyContent: 'flex-end', gap: '2', mt: '2'});
export const hint = css({fontSize: 'xs', color: 'text.tertiary'});
