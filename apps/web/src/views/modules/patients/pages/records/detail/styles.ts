import {cva} from 'class-variance-authority';
import {cn} from '@/lib/utils';

export const page = {
    root: cn('pb-[60px] bg-(--color-bg-page)'),
    inner: cn('px-6 pt-6'),
    errorState: cn('flex flex-col items-center justify-center gap-4 p-12 text-(--color-text-secondary)'),
};

export const header = {
    root: cn(
        'mb-[22px] grid grid-cols-[1fr_auto] items-start gap-7 rounded-[14px] border border-(--color-border) bg-(--color-bg-card) px-[26px] py-[22px]'
    ),
    eyebrow: cn('mb-[6px] text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-text-tertiary)'),
    titleRow: cn('mb-3 flex flex-wrap items-baseline gap-[10px]'),
    titleType: cn('text-[28px] font-medium leading-[1.2] tracking-[-0.02em] text-(--color-text-primary)'),
    titleDot: cn('text-[28px] leading-[1.2] text-(--color-text-tertiary)'),
    titleDate: cn('text-[28px] leading-[1.2] text-(--color-text-secondary)'),
    meta: cn('flex flex-wrap items-center gap-3 text-[13px] text-(--color-text-secondary)'),
    metaItem: cn('inline-flex items-center gap-[6px]'),
    metaSep: cn('inline-block size-1 shrink-0 rounded-full bg-(--color-border-hover)'),
    aside: cn('flex min-w-[280px] flex-col items-end gap-3'),
    patCard: cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-[10px]',
        'border border-(--color-border) bg-(--color-bg-surface) px-[14px] py-[10px]',
        'transition-colors hover:border-(--color-primary) hover:bg-(--color-primary-surface)'
    ),
    patName: cn('text-[13px] font-medium text-(--color-text-primary)'),
    patMeta: cn('mt-[2px] text-[11px] text-(--color-text-tertiary)'),
    patBody: cn('min-w-0 flex-1'),
    actions: cn('flex gap-2'),
};

export const body = cn('flex flex-col gap-[18px]');

export const section = {
    root: cn('rounded-[12px] border border-(--color-border) bg-(--color-bg-card) px-[26px] pb-[24px] pt-[22px]'),
    head: cn('mb-[18px] border-b border-dashed border-(--color-border) pb-[14px]'),
    title: cn(
        'flex items-center gap-2 text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-(--color-text-primary)'
    ),
    sub: cn('mt-[3px] text-[12px] text-(--color-text-tertiary)'),
    traceRoot: cn(
        'relative rounded-[12px] border border-(--color-border) bg-(--color-bg-card) pb-[24px] pl-[32px] pr-[26px] pt-[22px]'
    ),
    traceBar: cn('absolute bottom-0 left-0 top-0 w-[3px] rounded-l-[12px] bg-(--color-primary)'),
};

export const soap = {
    stack: cn('flex flex-col gap-[18px]'),
    head: cn('mb-[10px] flex items-start gap-3'),
    letter: cva('inline-flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[15px] font-medium', {
        variants: {
            v: {
                s: 'bg-(--color-primary-surface) text-(--color-primary-text)',
                o: 'bg-(--color-success-surface) text-(--color-success)',
                a: 'bg-(--color-warning-surface) text-(--color-warning)',
                p: 'bg-(--color-primary-surface) text-(--color-primary-text)',
            },
        },
    }),
    metaTitle: cn('text-[14px] font-medium leading-[1.3] text-(--color-text-primary)'),
    metaDesc: cn('mt-[2px] text-[12px] text-(--color-text-tertiary)'),
    body: cn('pl-[48px] text-[14px] leading-[1.6] text-(--color-text-primary) whitespace-pre-wrap'),
    bodyEmpty: cn('pl-[48px] text-[14px] leading-[1.6] italic text-(--color-text-tertiary)'),
};

export const tags = {
    grid: cn('grid grid-cols-[auto_1fr] items-start gap-x-7 gap-y-[14px]'),
    label: cn('pt-1 text-[12px] font-medium uppercase tracking-[0.04em] text-(--color-text-tertiary)'),
    list: cn('flex flex-wrap gap-[6px]'),
    dot: cn('size-[6px] rounded-full bg-current'),
};

export const notes = cn('whitespace-pre-wrap text-[14px] leading-[1.6] text-(--color-text-primary)');

export const empty = cn(
    'flex items-center gap-2 rounded-[8px] bg-(--color-bg-surface)',
    'px-4 py-[14px] text-[13px] italic text-(--color-text-tertiary)'
);

export const files = {
    list: cn('flex flex-col overflow-hidden rounded-[10px] bg-(--color-bg-surface)'),
    row: cn(
        'grid grid-cols-[36px_1fr_auto] items-center gap-[14px] border-b border-(--color-border) px-4 py-3 last:border-0'
    ),
    icon: cn(
        'flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-(--color-bg-card) text-(--color-text-secondary)'
    ),
    name: cn('truncate text-[13px] font-medium text-(--color-text-primary)'),
    sub: cn('mt-[2px] flex items-center gap-[10px] text-[12px] text-(--color-text-tertiary)'),
    aiTag: cn('inline-flex items-center gap-1 text-[11px] font-medium text-(--color-ai-text)'),
    actions: cn('flex gap-1'),
};

export const trace = {
    grid: cn('flex flex-col'),
    row: cn(
        'grid grid-cols-[220px_1fr] items-center gap-6',
        'border-b border-dashed border-(--color-border) py-3',
        'first:pt-0 last:border-0 last:pb-0'
    ),
    key: cn('text-[11px] font-medium uppercase tracking-[0.04em] text-(--color-text-tertiary)'),
    val: cn('flex flex-wrap items-center gap-[10px] text-[13px] font-medium text-(--color-text-primary)'),
    valMono: cn('font-mono tabular-nums'),
    muted: cn('text-[13px] font-normal text-(--color-text-tertiary)'),
    editedChip: cn(
        'inline-flex items-center gap-1 rounded-full',
        'border border-(--color-warning) bg-(--color-warning-surface)',
        'px-2 py-[3px] text-[11px] font-medium text-(--color-warning)'
    ),
};

// Skeleton shell
export const skeleton = {
    root: cn('flex flex-col gap-[18px] px-6 pt-6 pb-[60px]'),
    headerCard: cn('h-[120px] rounded-[14px]'),
    bodyCard: cn('h-[200px] rounded-[12px]'),
    sectionCard: cn('h-[160px] rounded-[12px]'),
};

// Badge overrides
export const badgeStatus = cn('gap-[6px] rounded-full px-[10px] py-1 text-[12px]');
export const badgeConduct = cn(
    'rounded-full bg-(--color-bg-surface) px-[10px] py-1 text-[12px] font-medium text-(--color-text-secondary)'
);
export const badgeOrigin = cn('gap-[6px] rounded-full px-[11px] py-[5px] text-[12px]');

// Signature status chips
export const signedBadge = cn(
    'inline-flex items-center gap-[6px] rounded-full border border-(--color-success) bg-(--color-success-surface) px-[10px] py-1 text-[12px] font-medium text-(--color-success)'
);
export const draftBadge = cn(
    'inline-flex items-center gap-[6px] rounded-full border border-(--color-border) bg-(--color-bg-surface) px-[10px] py-1 text-[12px] font-medium text-(--color-text-secondary)'
);

// Nav chevron icon
export const chevronIcon = cn('size-[14px] shrink-0 text-(--color-text-tertiary)');

export const nav = {
    root: cn(
        'mt-6 grid grid-cols-[1fr_auto_1fr] items-stretch gap-[14px] rounded-[12px] border border-(--color-border) bg-(--color-bg-card) p-[14px]'
    ),
    btn: cn(
        'flex cursor-pointer items-center gap-3 rounded-[10px]',
        'border border-(--color-border) bg-transparent px-4 py-3',
        'text-[13px] font-medium text-(--color-text-primary)',
        'transition-colors hover:border-(--color-primary) hover:bg-(--color-primary-surface) hover:text-(--color-primary-text)',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'disabled:hover:border-(--color-border) disabled:hover:bg-transparent disabled:hover:text-(--color-text-primary)'
    ),
    btnEnd: cn('justify-end text-right'),
    stack: cn('flex flex-col gap-[2px]'),
    label: cn('text-[13px] font-medium leading-[1.3]'),
    sub: cn('text-[11px] leading-[1.3] text-(--color-text-tertiary)'),
    chevron: cn('size-[14px] shrink-0'),
    center: cn(
        'inline-flex cursor-pointer items-center whitespace-nowrap rounded-[8px]',
        'border-0 bg-transparent px-[18px] py-[10px]',
        'text-[13px] font-medium text-(--color-text-secondary)',
        'transition-colors hover:bg-(--color-bg-surface) hover:text-(--color-primary-text)'
    ),
};
export const traceShieldIcon = cn('size-4 text-(--color-primary)');
export const statusDot = cn('size-[6px] rounded-full bg-current');
