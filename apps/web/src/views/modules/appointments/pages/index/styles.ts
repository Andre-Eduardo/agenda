import {css} from '@/styled-system/css';

export {cx} from '@/styled-system/css';

export const filters = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
    mb: '4',
});

export const filterRow = css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: '3',
});

export const field = css({display: 'flex', flexDirection: 'column', gap: '1', minW: '[150px]'});

export const fieldGrow = css({display: 'flex', flexDirection: 'column', gap: '1', flex: '1', minW: '[220px]'});

export const fieldLabel = css({fontSize: 'xs', color: 'text.secondary'});

export const presetRow = css({display: 'flex', flexWrap: 'wrap', gap: '2'});

export const statusRow = css({display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2'});

export const summary = css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2',
    mb: '2',
    fontSize: 'sm',
    color: 'text.tertiary',
});

export const count = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums'});

export const tableCard = css({
    overflow: 'hidden',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
});

export const row = css({cursor: 'pointer', _hover: {bg: 'bg.surface'}});

export const dayRow = css({bg: 'bg.surface'});

export const dayCell = css({
    py: '2',
    fontSize: '2xs',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: '[0.06em]',
    color: 'text.tertiary',
});

export const mono = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'});

export const patientCell = css({fontWeight: 'medium', color: 'text.primary'});

export const muted = css({color: 'text.tertiary'});

export const procedureCell = css({display: 'inline-flex', alignItems: 'center', gap: '1.5'});

export const rowButton = css({
    textAlign: 'left',
    fontWeight: 'medium',
    color: 'text.primary',
    _hover: {textDecoration: 'underline'},
    _focusVisible: {outline: '2px solid', outlineColor: 'primary', outlineOffset: '2px'},
});

export const truncatedNote = css({fontSize: 'sm', color: 'text.tertiary', mt: '0.5'});

export const icon4 = css({w: '4', h: '4'});

export const warning = css({fontSize: 'sm', color: 'warning', mt: '2'});

export const page = css({display: 'flex', flexDirection: 'column', p: {base: '4', lg: '6'}, bg: 'bg.page'});

export const header = css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '4',
    mb: '5',
});

export const titleGroup = css({display: 'flex', flexDirection: 'column', gap: '1'});

export const title = css({fontSize: '2xl', lineHeight: '[1.2]', fontWeight: 'medium', color: 'text.primary'});

export const subtitle = css({fontSize: 'sm', color: 'text.secondary'});

export const headerActions = css({display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2'});

export const skeletonStack = css({display: 'flex', flexDirection: 'column', gap: '2'});

export const skeletonRow = css({h: '10', w: 'full'});
