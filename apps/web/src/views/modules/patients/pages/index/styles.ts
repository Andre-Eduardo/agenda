import {cn} from '@/lib/utils';

// ── Status filter segmented control ──────────────────────────────────────────

export const toolbar = {
    root: cn('mb-3.5 flex flex-wrap items-center gap-2.5'),
    search: cn(
        'flex min-w-[280px] flex-1 items-center gap-2 rounded-(--radius-input) border border-(--color-border) bg-(--color-bg-card) px-3 py-[9px] transition-all duration-(--duration-fast) ease-out focus-within:border-(--color-primary)'
    ),
    searchInput: cn(
        'flex-1 bg-transparent text-sm-body text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none'
    ),
    searchKbd: cn(
        'shrink-0 rounded-[4px] border border-(--color-border) px-1.5 py-0.5 font-mono text-2xs text-(--color-text-tertiary)'
    ),
    clearBtn: cn(
        'rounded-[6px] px-2 py-1.5 text-sm text-(--color-primary-text) transition-colors duration-(--duration-fast) ease-out hover:bg-(--color-primary-surface)'
    ),
    clearIcon: cn('mr-1 inline size-3.5'),
    searchIcon: cn('size-4 shrink-0 text-(--color-text-tertiary)'),
    count: cn('font-mono text-sm tabular-nums text-(--color-text-tertiary)'),
};

export const table = {
    root: cn('overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card)'),
    head: cn('grid items-center gap-4 border-b border-(--color-border) bg-(--color-bg-surface) px-[18px] py-[11px]'),
    headCell: cn('text-2xs font-medium uppercase tracking-[0.06em] text-(--color-text-tertiary)'),
    footer: cn('border-t border-(--color-border)'),
};

export const tableRow = {
    root: cn(
        'grid cursor-pointer items-center gap-4 border-b border-(--color-border) px-[18px] py-[14px] transition-colors duration-(--duration-fast) ease-out last:border-b-0 hover:bg-(--color-bg-surface)'
    ),
    nameCell: cn('flex min-w-0 items-center gap-3'),
    nameBlock: cn('min-w-0'),
    name: cn('truncate text-sm-body font-medium text-(--color-text-primary)'),
    email: cn('truncate text-xs text-(--color-text-tertiary)'),
    ageWrapper: cn('group relative cursor-help'),
    age: cn('font-mono text-sm-body tabular-nums text-(--color-text-primary)'),
    ageUnit: cn('ml-0.5 text-(--color-text-tertiary)'),
    ageTooltip: cn(
        'pointer-events-none absolute left-0 top-[calc(100%+6px)] z-10 whitespace-nowrap rounded-[6px] bg-(--color-text-primary) px-2 py-1 font-mono text-2xs tabular-nums text-(--color-bg-card) opacity-0 transition-opacity duration-(--duration-fast) ease-out group-hover:opacity-100'
    ),
    document: cn('font-mono text-sm tabular-nums text-(--color-text-secondary)'),
    insuranceBadge: cn(
        'inline-flex items-center rounded-(--radius-badge) border border-(--color-border) bg-(--color-bg-surface) px-2 py-0.5 text-xs font-medium text-(--color-text-secondary)'
    ),
    insuranceEmpty: cn('text-xs text-(--color-text-tertiary)'),
    actionWrapper: cn('relative flex justify-end'),
    actionBtn: cn(
        'flex size-8 items-center justify-center rounded-[8px] text-(--color-text-tertiary) transition-all duration-(--duration-fast) ease-out hover:bg-(--color-bg-card) hover:text-(--color-text-primary)'
    ),
    dangerItem: cn('text-(--color-danger) hover:bg-(--color-danger-surface) focus:bg-(--color-danger-surface)'),
    skeletonRoot: cn('grid items-center gap-4 border-b border-(--color-border) px-[18px] py-[14px] last:border-b-0'),
    skeletonNameCell: cn('flex items-center gap-3'),
    skeletonAvatar: cn('size-8 shrink-0 rounded-full'),
    skeletonStatusBadge: cn('h-5 w-20 rounded-full'),
    skeletonBadgeSm: cn('h-5 w-6 rounded-full'),
    skeletonActionBtn: cn('ml-auto size-7 rounded-[8px]'),
};

export const patientCard = {
    root: cn(
        'flex cursor-pointer flex-col gap-3 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) p-4 transition-colors duration-(--duration-fast) ease-out hover:border-(--color-border-hover)'
    ),
    top: cn('flex items-start gap-3'),
    nameBlock: cn('min-w-0 flex-1'),
    name: cn('truncate text-sm-body font-medium text-(--color-text-primary)'),
    meta: cn('mt-0.5 text-xs text-(--color-text-tertiary)'),
    details: cn('flex flex-col gap-1.5'),
    detailRow: cn('flex items-center justify-between'),
    detailLabel: cn('text-2xs text-(--color-text-tertiary)'),
    detailValue: cn('font-mono text-2xs tabular-nums text-(--color-text-secondary)'),
};

export const skeletonCard = {
    root: cn('flex flex-col gap-3 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) p-4'),
    top: cn('flex items-center gap-3'),
    nameBlock: cn('flex-1 space-y-1.5'),
    details: cn('space-y-2'),
    avatar: cn('size-10 shrink-0 rounded-full'),
};

export const statsGrid = cn('mb-6 grid grid-cols-3 gap-3');

export const statsDelta = cn('font-medium text-(--color-success)');

export const cardsGrid = cn('grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3');

export const cardsFooter = cn('mt-3.5 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card)');

export const pagination = {
    root: cn('flex items-center justify-between px-[18px] py-[14px]'),
    info: cn('text-sm text-(--color-text-secondary)'),
    infoStrong: cn('font-medium tabular-nums text-(--color-text-primary)'),
    controls: cn('flex items-center gap-1'),
    btnDisabled: cn(
        'inline-flex h-8 min-w-8 cursor-not-allowed items-center justify-center gap-1 rounded-[8px] border border-(--color-border) px-2.5 text-sm font-medium text-(--color-text-secondary) opacity-45'
    ),
    btnActive: cn(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-[8px] border border-(--color-primary) bg-(--color-primary) px-2.5 text-sm font-medium text-white'
    ),
};
