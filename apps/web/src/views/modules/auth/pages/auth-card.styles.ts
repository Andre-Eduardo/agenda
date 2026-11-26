import {css} from '@/styled-system/css';

/** Shared layout for the single-card auth pages (forgot / reset password). */
export const authCardRoot = css({
    display: 'flex',
    minH: 'screen',
    alignItems: 'center',
    justifyContent: 'center',
    bg: 'bg.surface',
    px: '4',
});

export const authCard = css({
    w: 'full',
    maxW: '[420px]',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    p: '8',
});

export const authCardTitle = css({
    mb: '1.5',
    fontSize: 'xl',
    fontWeight: 'medium',
    letterSpacing: 'tight',
    color: 'text.primary',
});

export const authCardSubtitle = css({
    mb: '6',
    lineHeight: 'relaxed',
    fontSize: 'sm',
    color: 'text.secondary',
});

export const authCardForm = css({display: 'flex', flexDirection: 'column', gap: '3.5'});

export const authCardLabel = css({
    mb: '1.5',
    display: 'block',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.secondary',
});

export const authCardError = css({mt: '1', fontSize: '2xs', color: 'warning'});

export const authCardNotice = css({fontSize: 'sm', lineHeight: 'relaxed', color: 'text.secondary'});

export const authCardSubmit = css({
    mt: '1',
    w: 'full',
    bg: 'primary',
    fontSize: 'sm',
    fontWeight: 'medium',
    _hover: {bg: 'primary.hover'},
});

export const authCardLink = css({
    display: 'inline-block',
    mt: '5',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'primary',
    _hover: {color: 'primary.hover'},
});
