import {css} from '@/styled-system/css';

// ── Avatar (Radix Root) ───────────────────────────────────────────────────────

export const avatar = css({
    position: 'relative',
    display: 'flex',
    flexShrink: '0',
    overflow: 'hidden',
    rounded: 'full',
});

export const avatarXs = css({
    w: '6',
    h: '6',
});

export const avatarSm = css({
    w: '8',
    h: '8',
});

export const avatarMd = css({
    w: '10',
    h: '10',
});

export const avatarLg = css({
    w: '12',
    h: '12',
});

// ── AvatarImage ────────────────────────────────────────────────────────────────

export const avatarImage = css({
    aspectRatio: '[1/1]',
    h: 'full',
    w: 'full',
});

// ── AvatarFallback ─────────────────────────────────────────────────────────────

export const avatarFallback = css({
    display: 'flex',
    h: 'full',
    w: 'full',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    bg: 'muted',
});

// ── AvatarInitials ─────────────────────────────────────────────────────────────

export const initials = css({
    display: 'inline-flex',
    flexShrink: '0',
    userSelect: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    fontWeight: 'medium',
});

export const initialsXs = css({
    w: '6',
    h: '6',
    fontSize: '[10px]',
});

export const initialsSm = css({
    w: '8',
    h: '8',
    fontSize: 'xs',
});

export const initialsMd = css({
    w: '10',
    h: '10',
    fontSize: 'sm',
});

export const initialsLg = css({
    w: '12',
    h: '12',
    fontSize: 'base',
});
