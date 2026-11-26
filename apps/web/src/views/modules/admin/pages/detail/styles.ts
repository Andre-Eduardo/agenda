import {css} from '@/styled-system/css';
import {styled} from '@/styled-system/jsx';

export const headerRow = css({display: 'flex', alignItems: 'center', gap: '3'});
export const backLink = css({
    display: 'flex',
    alignItems: 'center',
    color: 'text.tertiary',
    _hover: {color: 'text.secondary'},
});

export const Card = styled('div', {
    base: {
        mt: '5',
        rounded: 'card',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'border',
        bg: 'bg.card',
        overflow: 'hidden',
        p: '6',
    },
});

export const cardTitle = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary', mb: '1'});
export const cardSub = css({fontSize: 'xs', color: 'text.secondary', mb: '4', lineHeight: 'relaxed'});

export const infoGrid = css({display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '4'});
export const infoLabel = css({
    fontSize: '2xs',
    color: 'text.tertiary',
    textTransform: 'uppercase',
    letterSpacing: 'wider',
});
export const infoValue = css({fontSize: 'sm', color: 'text.primary', mt: '1'});

export const presetRow = css({display: 'flex', gap: '2', mb: '5', flexWrap: 'wrap'});

export const fieldRow = css({display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4', mb: '5'});
export const field = css({display: 'flex', flexDirection: 'column', gap: '1.5'});
export const fieldLabel = css({fontSize: 'xs', fontWeight: 'medium', color: 'text.secondary'});

export const moduleRow = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4',
    p: '4',
    rounded: '[8px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',

    '& + &': {mt: '2'},
});

export const moduleInfo = css({display: 'flex', alignItems: 'center', gap: '3'});
export const moduleIcon = css({color: 'ai.border', flexShrink: '0'});
export const moduleName = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
export const moduleMeta = css({fontSize: 'xs', color: 'text.tertiary'});

export const moduleSeats = css({display: 'flex', alignItems: 'center', gap: '2'});
export const seatInput = css({w: '20'});

export const footerRow = css({display: 'flex', justifyContent: 'flex-end', gap: '2', mt: '6'});

export const skeletonBlock = css({h: '14', mb: '2', rounded: 'card'});
