import {css, cva} from '@/styled-system/css';

export {cx} from '@/styled-system/css';

export const filters = css({display: 'flex', flexDirection: 'column', gap: '3', mb: '5'});

export const presetRow = css({display: 'flex', flexWrap: 'wrap', gap: '2'});

export const filterRow = css({display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '3'});

export const field = css({display: 'flex', flexDirection: 'column', gap: '1', minW: '[160px]'});

export const fieldLabel = css({fontSize: 'xs', color: 'text.secondary'});

export const tiles = css({
    display: 'grid',
    gridTemplateColumns: {base: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))'},
    gap: '3',
    mb: '5',
});

export const grid2 = css({
    display: 'grid',
    gridTemplateColumns: {base: '1fr', lg: 'repeat(2, minmax(0, 1fr))'},
    gap: '4',
});

export const card = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    p: '4',
    mb: '4',
    minW: '0',
});

export const cardTitle = css({fontSize: 'sub', fontWeight: 'medium', color: 'text.primary'});

export const cardHint = css({fontSize: 'xs', color: 'text.tertiary'});

export const barList = css({display: 'flex', flexDirection: 'column', gap: '2', m: '0', p: '0', listStyle: 'none'});

export const barItem = css({
    display: 'grid',
    gridTemplateColumns: '[minmax(0, 9rem) 1fr auto]',
    alignItems: 'center',
    gap: '3',
    fontSize: 'sm',
});

export const barLabel = css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'text.secondary',
});

export const barTrack = css({display: 'flex', h: '2.5', rounded: 'full', bg: 'bg.surface', overflow: 'hidden'});

export const barFill = cva({
    base: {h: 'full'},
    variants: {
        tone: {
            primary: {bg: 'primary'},
            success: {bg: 'success'},
            warning: {bg: 'warning'},
            danger: {bg: 'danger'},
            muted: {bg: 'text.tertiary'},
        },
    },
    defaultVariants: {tone: 'primary'},
});

export const barValue = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums', color: 'text.primary'});

export const columns = css({
    display: 'flex',
    alignItems: 'flex-end',
    gap: '1',
    h: '40',
    overflowX: 'auto',
    pb: '1',
});

export const column = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '1',
    flex: '1',
    minW: '[18px]',
    h: 'full',
});

export const columnStack = css({
    display: 'flex',
    flexDirection: 'column-reverse',
    w: 'full',
    maxW: '[28px]',
    roundedTop: '[4px]',
    overflow: 'hidden',
    bg: 'bg.surface',
});

export const columnLabel = css({fontSize: '2xs', color: 'text.tertiary', fontFamily: 'mono', whiteSpace: 'nowrap'});

export const legend = css({display: 'flex', flexWrap: 'wrap', gap: '3', fontSize: 'xs', color: 'text.secondary'});

export const legendItem = css({display: 'inline-flex', alignItems: 'center', gap: '1.5'});

export const legendDot = cva({
    base: {w: '2', h: '2', rounded: 'full'},
    variants: {
        tone: {
            primary: {bg: 'primary'},
            success: {bg: 'success'},
            warning: {bg: 'warning'},
            danger: {bg: 'danger'},
            muted: {bg: 'text.tertiary'},
        },
    },
});

export const mono = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums'});

export const right = css({textAlign: 'right'});

export const muted = css({color: 'text.tertiary'});

export const tabs = css({mb: '4'});

export const skeletonTiles = css({h: '24', w: 'full'});

export const note = css({fontSize: 'xs', color: 'text.tertiary', mt: '2'});
