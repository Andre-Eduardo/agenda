import {css} from '@/styled-system/css';

// ── StatTile ───────────────────────────────────────────────────────────────────

export const root = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    p: '[18px]',
});

export const header = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
});

export const label = css({
    fontSize: 'sm',
    lineHeight: '[1.4]',
    color: 'text.secondary',
});

export const valueSkeleton = css({
    mt: '0.5',
    h: '8',
    w: '16',
    animation: 'pulse',
    rounded: 'md',
    bg: 'bg.surface',
});

export const value = css({
    mt: '0.5',
    fontFamily: 'mono',
    fontSize: '[28px]',
    fontWeight: 'medium',
    lineHeight: '[1.1]',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '[-0.01em]',
    color: 'text.primary',
});

// ── Delta ──────────────────────────────────────────────────────────────────────

export const delta = css({
    fontSize: '2xs',
    lineHeight: '[1.4]',
});

export const deltaPositive = css({
    color: 'success',
});

export const deltaNegative = css({
    color: 'danger',
});

export const deltaNeutral = css({
    color: 'text.tertiary',
});

// ── Icon variants ──────────────────────────────────────────────────────────────

export const iconBase = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[8px]',
});

export const iconSm = css({
    w: '7',
    h: '7',
});

export const iconMd = css({
    w: '8',
    h: '8',
});

export const iconLg = css({
    w: '10',
    h: '10',
});

export const iconPrimary = css({
    bg: 'primary/10',
    color: 'primary',
});

export const iconSuccess = css({
    bg: 'success/10',
    color: 'success',
});

export const iconWarning = css({
    bg: 'warning/10',
    color: 'warning',
});

export const iconDanger = css({
    bg: 'danger/10',
    color: 'danger',
});

export const iconInfo = css({
    bg: 'info.surface',
    color: 'info',
});

export const iconMuted = css({
    bg: 'bg.surface',
    color: 'text.secondary',
});

export const iconAi = css({
    bg: 'ai.bg',
    color: 'ai.text',
});
