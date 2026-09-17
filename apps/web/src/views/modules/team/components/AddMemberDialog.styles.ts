import {css, cva} from '@/styled-system/css';

export const formBody = css({display: 'grid', gap: '4', py: '2'});
export const formField = css({display: 'flex', flexDirection: 'column', gap: '1.5'});
export const formFooter = css({display: 'flex', justifyContent: 'flex-end', gap: '2', pt: '2'});
export const formHint = css({fontSize: 'xs', color: 'text.tertiary'});
export const roleChipRow = css({display: 'flex', flexWrap: 'wrap', gap: '2'});

export const roleChip = cva({
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        px: '3',
        py: '1.5',
        rounded: 'full',
        fontSize: 'xs',
        fontWeight: 'medium',
        borderWidth: '1px',
        borderStyle: 'solid',
        cursor: 'pointer',
        userSelect: 'none',
        transitionProperty: 'color, background-color, border-color',
    },
    variants: {
        active: {
            true: {borderColor: 'primary.border', bg: 'primary.surface', color: 'primary.text'},
            false: {borderColor: 'border', color: 'text.secondary'},
        },
    },
    defaultVariants: {active: false},
});
