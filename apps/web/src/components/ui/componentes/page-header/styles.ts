import {css} from '@/styled-system/css';

// ── PageHeader ─────────────────────────────────────────────────────────────────

export const pageHeader = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1',
});

export const pageHeaderRow = css({
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '4',
});

export const pageHeaderTitleGroup = css({
    minW: '0',
});

export const pageHeaderTitle = css({
    fontSize: '[32px]',
    fontWeight: 'medium',
    lineHeight: '[1.15]',
    letterSpacing: '[-0.01em]',
    color: 'text.primary',
});

export const pageHeaderSubtitle = css({
    mt: '1.5',
    fontSize: 'sm',
    lineHeight: '[1.5]',
    color: 'text.secondary',
});

export const pageHeaderActions = css({
    display: 'flex',
    flexShrink: '0',
    alignItems: 'center',
    gap: '2',
});

// ── EntityHeader ───────────────────────────────────────────────────────────────

export const entityHeader = css({
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    px: '5',
    py: '[18px]',
});

export const entityHeaderSticky = css({
    position: 'sticky',
    top: '0',
    zIndex: '10',
});

export const entityHeaderRow = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '[18px]',
});

export const entityHeaderAvatarGroup = css({
    display: 'flex',
    minW: '0',
    alignItems: 'center',
    gap: '[18px]',
});

export const entityHeaderNameGroup = css({
    minW: '0',
});

export const entityHeaderName = css({
    fontSize: '[26px]',
    fontWeight: 'medium',
    lineHeight: '[1.2]',
    color: 'text.primary',
});

export const entityHeaderMeta = css({
    mt: '[6px]',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '2',
    fontSize: 'sm',
    color: 'text.secondary',
});

export const entityHeaderActions = css({
    display: 'flex',
    flexShrink: '0',
    alignItems: 'center',
    gap: '2',
});

export const entityHeaderAlerts = css({
    mt: '3',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    pt: '3',
});
