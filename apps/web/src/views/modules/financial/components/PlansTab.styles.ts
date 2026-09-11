import {css} from '@/styled-system/css';

export const wrap = css({display: 'flex', flexDirection: 'column', gap: '5', mt: '4'});

export const section = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
    p: '4',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
});

export const sectionHeader = css({display: 'flex', alignItems: 'center', justifyContent: 'space-between'});
export const sectionTitle = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
export const sectionSub = css({fontSize: 'xs', color: 'text.secondary'});

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

export const rowInfo = css({display: 'flex', flexDirection: 'column', gap: '0.5'});
export const rowName = css({fontSize: 'sm', color: 'text.primary'});
export const rowMeta = css({fontSize: 'xs', color: 'text.secondary', fontFamily: 'mono'});
export const rowActions = css({display: 'flex', alignItems: 'center', gap: '2'});

export const emptyText = css({fontSize: 'xs', color: 'text.tertiary', py: '3', textAlign: 'center'});

export const formBody = css({display: 'flex', flexDirection: 'column', gap: '3', py: '2'});
export const formField = css({display: 'flex', flexDirection: 'column', gap: '1.5'});
export const formRow = css({display: 'flex', gap: '3'});
export const formFooter = css({display: 'flex', justifyContent: 'flex-end', gap: '2', mt: '2'});
