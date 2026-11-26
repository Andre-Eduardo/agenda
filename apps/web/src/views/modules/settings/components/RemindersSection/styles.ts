import {css} from '@/styled-system/css';

export const channelList = css({display: 'flex', flexWrap: 'wrap', gap: '3'});

export const channelOption = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    px: '3',
    py: '2',
    rounded: '[8px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    fontSize: 'sm',
    color: 'text.primary',
    cursor: 'pointer',
    _hover: {borderColor: 'primary/40'},
    '&:has(input:disabled)': {cursor: 'not-allowed', opacity: '0.6'},
    '& input': {accentColor: 'var(--colors-primary)'},
});

export const leadTimeList = css({display: 'flex', flexDirection: 'column', gap: '2'});

export const leadTimeRow = css({display: 'flex', alignItems: 'center', gap: '2', flexWrap: 'wrap'});

export const leadTimeInput = css({w: '[96px]'});

export const leadTimeHint = css({fontSize: 'xs', color: 'text.tertiary'});

export const variableList = css({display: 'flex', flexWrap: 'wrap', gap: '2', mb: '2'});

export const templateMeta = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2',
    mt: '1',
    fontSize: '2xs',
    color: 'text.tertiary',
});

export const previewBox = css({
    mt: '4',
    p: '4',
    rounded: '[8px]',
    bg: 'bg.surface',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
});

export const previewLabel = css({fontSize: '2xs', color: 'text.tertiary', textTransform: 'uppercase', mb: '2'});

export const previewText = css({fontSize: 'sm', color: 'text.primary', whiteSpace: 'pre-wrap', lineHeight: 'relaxed'});

export const warningText = css({fontSize: 'xs', color: 'warning', mt: '2'});

export const sectionDivider = css({borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'border'});
