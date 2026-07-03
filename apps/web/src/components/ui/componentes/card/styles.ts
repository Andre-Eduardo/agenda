import {css, cva} from '@/styled-system/css';

// ── Card ──────────────────────────────────────────────────────────────────────

export const card = css({
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
});

export const cardHeader = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5',
    px: '[18px]',
    py: '[14px]',
});

export const cardTitle = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
});

export const cardDescription = css({
    fontSize: 'xs',
    color: 'text.secondary',
});

export const cardContent = css({
    p: '[18px]',
});

export const cardFooter = css({
    display: 'flex',
    alignItems: 'center',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    px: '[18px]',
    py: '[14px]',
});

// ── SectionCard ───────────────────────────────────────────────────────────────

export const sectionCard = css({
    overflow: 'hidden',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
});

export const sectionCardHeader = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    px: '[18px]',
    py: '[14px]',
});

export const sectionCardTitle = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
});

export const sectionCardHeaderStart = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
});

export const sectionCardHeaderActions = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
});

export const sectionCardBodyVariants = cva({
    base: {},
    variants: {
        appearance: {
            default: {
                p: '[18px]',
            },
            flush: {
                p: '0',
            },
            sm: {
                p: '3',
            },
        },
    },
    defaultVariants: {
        appearance: 'default',
    },
});
