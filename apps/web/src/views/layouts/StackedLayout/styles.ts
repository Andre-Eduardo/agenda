import {css, cva} from '@/styled-system/css';

export {cx} from '@/styled-system/css';

// ── Variantes ──────────────────────────────────────────────────────────────────

export const navLink = cva({
    base: {
        display: 'flex',
        alignItems: 'center',
        gap: '3',
        rounded: 'button',
        px: '3',
        py: '2',
        fontSize: 'sm-body',
        fontWeight: 'medium',
        transitionProperty: 'color, background-color',
    },
    variants: {
        active: {
            true: {bg: 'primary.surface', color: 'primary.text'},
            false: {color: 'text.secondary', _hover: {bg: 'bg.surface', color: 'text.primary'}},
        },
    },
});

// ── Classes folha ───────────────────────────────────────────────────────────────

export const root = css({display: 'flex', minHeight: 'screen', bg: 'bg.page'});

export const sidebar = css({
    display: {base: 'none', lg: 'block'},
    w: '64',
    flexShrink: '0',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: 'border',
    bg: 'bg.surface',
});

export const sidebarInner = css({display: 'flex', h: 'full', flexDirection: 'column', gap: '6', p: '4'});

export const logoRow = css({display: 'flex', alignItems: 'center', gap: '3', px: '2'});
export const logoIcon = css({
    display: 'flex',
    w: '9',
    h: '9',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'button',
    bg: 'primary',
    color: 'primary.foreground',
});
export const logoTextGroup = css({display: 'flex', flexDirection: 'column'});
export const logoName = css({fontSize: 'sub', fontWeight: 'medium', lineHeight: 'tight', color: 'text.primary'});
export const logoTagline = css({fontSize: '2xs', color: 'text.tertiary'});

export const nav = css({display: 'flex', flex: '1', flexDirection: 'column', gap: '3', overflowY: 'auto'});

export const sidebarFooter = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    pt: '4',
});

export const navSection = css({display: 'flex', flexDirection: 'column', gap: '1'});
export const navSectionLabel = css({
    px: '3',
    pb: '1',
    pt: '2',
    fontSize: '2xs',
    textTransform: 'uppercase',
    letterSpacing: 'wider',
    color: 'text.tertiary',
});

export const content = css({display: 'flex', flex: '1', flexDirection: 'column'});

export const header = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    bg: 'bg.card',
    px: {base: '4', lg: '6'},
    py: '3',
});

export const headerLeft = css({display: 'flex', alignItems: 'center', gap: '3'});

export const userChip = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    rounded: 'button',
    px: '2',
    py: '1',
});

export const navMenuButton = css({display: {base: 'inline-flex', lg: 'none'}});

export const mobileSheet = css({w: '72', p: '0', bg: 'bg.surface'});

export const sidebarAction = css({
    justifyContent: 'flex-start',
    gap: '3',
    color: 'text.secondary',
    _hover: {color: 'text.primary'},
});

export const avatarFallback = css({bg: 'primary.surface', color: 'primary.text', fontSize: 'xs', fontWeight: 'medium'});

export const avatar = css({w: '8', h: '8'});

export const icon = css({w: '5', h: '5'});

export const srOnly = css({srOnly: true});

export const main = css({flex: '1', overflow: 'auto'});
