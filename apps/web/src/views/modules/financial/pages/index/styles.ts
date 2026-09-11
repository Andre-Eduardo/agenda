import {css} from '@/styled-system/css';

export const tabPanel = css({display: 'flex', flexDirection: 'column', gap: '5', mt: '4'});

export const filterBar = css({
    display: 'flex',
    gap: '3',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    p: '4',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
});

export const filterField = css({display: 'flex', flexDirection: 'column', gap: '1', minW: '[160px]'});
export const filterLabel = css({fontSize: 'xs', color: 'text.secondary'});

export const statGrid = css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '3',
});

export const statCard = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1',
    p: '4',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
});

export const statLabel = css({fontSize: 'xs', color: 'text.secondary'});
export const statValue = css({fontSize: 'lg', fontWeight: 'medium', color: 'text.primary', fontFamily: 'mono'});
export const statSub = css({fontSize: '2xs', color: 'text.tertiary'});

export const sectionBlock = css({
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

export const sectionTitleText = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});

export const paginationBar = css({display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: '2'});
export const paginationInfo = css({fontSize: 'xs', color: 'text.tertiary'});
export const paginationActions = css({display: 'flex', gap: '2'});

export const highlightRow = css({display: 'flex', gap: '3', flexWrap: 'wrap'});
export const highlightCard = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1',
    p: '3',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    minW: '[200px]',
});

export const emptyText = css({fontSize: 'xs', color: 'text.tertiary', py: '4', textAlign: 'center'});
export const skeletonBlock = css({h: '10', mb: '2', rounded: 'card'});
