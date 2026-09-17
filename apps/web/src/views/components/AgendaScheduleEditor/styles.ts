import {css} from '@/styled-system/css';
import {styled} from '@/styled-system/jsx';

export const root = css({p: '6'});

export const sectionTitle = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary', lineHeight: 'snug'});
export const sectionSub = css({fontSize: 'xs', color: 'text.secondary', mt: '0.5', lineHeight: 'relaxed'});
export const mt4 = css({mt: '4'});

export const Section = styled('section', {
    base: {
        '& + &': {
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: 'border',
            pt: '5',
            mt: '5',
        },

        '& > .head': {
            display: 'flex',
            alignItems: 'center',
            gap: '2',
            mb: '4',
            fontSize: 'sm',
            fontWeight: 'medium',
            color: 'text.primary',

            '& .icon': {color: 'text.secondary'},
            '& .tag': {
                fontSize: '2xs',
                color: 'text.tertiary',
                fontWeight: 'normal',
                bg: 'bg.surface',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'border',
                rounded: 'full',
                px: '2',
                py: '0.5',
            },
        },
    },
});

export const weekList = css({display: 'flex', flexDirection: 'column', gap: '2'});

export const weekDayRow = css({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    p: '3',
    rounded: '[8px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
    flexWrap: 'wrap',
});

export const weekDayLabel = css({fontSize: 'sm', color: 'text.primary', minW: '[136px]'});
export const weekDayTimeInput = css({w: '[110px]'});
export const weekDaySlotInput = css({w: '[70px]'});
export const weekDaySep = css({color: 'text.tertiary'});
export const weekDaySaveBtn = css({ml: 'auto'});

export const blockList = css({display: 'flex', flexDirection: 'column', gap: '2', mb: '4'});

export const blockRow = css({
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

export const blockDates = css({fontSize: 'sm', color: 'text.primary', fontFamily: 'mono'});
export const blockForm = css({display: 'flex', flexDirection: 'column', gap: '4', py: '2'});
