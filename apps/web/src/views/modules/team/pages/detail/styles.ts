import {css} from '@/styled-system/css';
import {styled} from '@/styled-system/jsx';

export const headerRow = css({display: 'flex', alignItems: 'center', gap: '3', mb: '1'});
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

export const grantRow = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '3',
    p: '3',
    rounded: '[8px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
});

export const grantList = css({display: 'flex', flexDirection: 'column', gap: '2', mb: '4'});
export const grantForm = css({display: 'flex', alignItems: 'center', gap: '2'});
export const grantSelect = css({minW: '[220px]'});
