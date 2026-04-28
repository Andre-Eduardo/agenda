import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

// Page root
export const page = {
  root: cn('flex flex-col gap-[18px] p-6 bg-(--color-bg-page)'),
  errorState: cn('flex flex-col items-center justify-center gap-4 p-12 text-(--color-text-secondary)'),
};

// Breadcrumb
export const breadcrumb = {
  root: cn('flex items-center gap-[6px] text-[13px] text-(--color-text-tertiary)'),
  link: cn('text-(--color-text-secondary) hover:text-(--color-primary-text)'),
  current: cn('text-(--color-text-primary)'),
};

// Sticky header
export const header = {
  root: cn('sticky top-0 z-10 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) px-5 py-[18px]'),
  inner: cn('flex items-center justify-between gap-[18px]'),
  info: cn('flex min-w-0 items-center gap-[18px]'),
  nameBlock: cn('min-w-0'),
  name: cn('text-[26px] font-medium leading-[1.2] text-(--color-text-primary)'),
  meta: cn('mt-[6px] flex flex-wrap items-center gap-2 text-[13px] text-(--color-text-secondary)'),
  metaDot: cn('text-(--color-text-tertiary)'),
  metaMono: cn('font-mono tabular-nums'),
  actions: cn('flex shrink-0 items-center gap-2'),
  alertsRow: cn('mt-3 flex flex-wrap gap-2 border-t border-(--color-border) pt-3'),
};

// Avatar
export const avatarVariants = [
  'bg-(--color-primary-surface) text-(--color-primary-text)',
  'bg-(--color-info-surface) text-(--color-info)',
  'bg-(--color-success-surface) text-(--color-success)',
  'bg-(--color-warning-surface) text-(--color-warning)',
  'bg-(--color-ai-bg) text-(--color-ai-text)',
  'bg-(--color-bg-surface) text-(--color-text-secondary)',
  'bg-(--color-danger-surface) text-(--color-danger)',
];
export const avatarBase = cn('inline-flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-medium');

// Action grid
export const actionGrid = cn('grid grid-cols-4 gap-[10px]');
export const actionTile = {
  root: cn('flex cursor-pointer items-center gap-3 rounded-[12px] border border-(--color-border) bg-(--color-bg-card) px-4 py-[14px] text-left transition-colors hover:border-(--color-border-hover) hover:bg-(--color-bg-surface)'),
  iconBase: cn('inline-flex size-[38px] shrink-0 items-center justify-center rounded-[10px]'),
  iconAI: cn('bg-(--color-ai-bg) text-(--color-ai-text)'),
  iconDefault: cn('bg-(--color-primary-surface) text-(--color-primary-text)'),
  label: cn('text-[14px] font-medium leading-[1.3] text-(--color-text-primary)'),
  sub: cn('mt-[3px] text-[12px] leading-[1.4] text-(--color-text-secondary)'),
  chevron: cn('size-[14px] shrink-0 text-(--color-text-tertiary)'),
};

// Summary
export const summaryGrid = cn('grid grid-cols-4 gap-3');
export const summaryCard = {
  root: cn('rounded-(--radius-card-sm) bg-(--color-bg-surface) p-[14px]'),
  header: cn('mb-[10px] flex items-center justify-between'),
  label: cn('text-[11px] uppercase tracking-[0.04em] text-(--color-text-tertiary)'),
  icon: cn('text-(--color-text-tertiary)'),
  value: cn('text-[18px] font-medium leading-[1.2] text-(--color-text-primary)'),
  valueMono: cn('font-mono tabular-nums text-[16px]'),
  sub: cn('mt-1 text-[12px] leading-[1.4] text-(--color-text-secondary)'),
};

// Section card
export const sectionCard = {
  root: cn('overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card)'),
  header: cn('flex items-center justify-between border-b border-(--color-border) px-[18px] py-[14px]'),
  title: cn('text-sm font-medium text-(--color-text-primary)'),
  body: cn('p-[18px]'),
};

// Secondary link
export const secLink = cn('inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-(--color-primary-text) hover:underline');

// Alert badge (severity variant)
export const alertBadge = cva(
  'inline-flex items-center gap-1 rounded-(--radius-badge) border px-2 py-[3px] text-xs font-medium',
  {
    variants: {
      severity: {
        HIGH: 'border-(--color-danger)/30 bg-(--color-danger-surface) text-(--color-danger)',
        MEDIUM: 'border-(--color-warning)/30 bg-(--color-warning-surface) text-(--color-warning)',
        LOW: 'border-(--color-border) bg-(--color-bg-surface) text-(--color-text-secondary)',
      },
    },
  },
);

// More menu dropdown
export const moreMenu = {
  dropdown: cn('absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-(--radius-dropdown) border border-(--color-border) bg-(--color-bg-card) shadow-lg'),
  item: cn('flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-(--color-text-primary) hover:bg-(--color-bg-surface)'),
  itemDanger: cn('flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-(--color-danger) hover:bg-(--color-bg-surface)'),
  itemIcon: cn('size-[14px] text-(--color-text-tertiary)'),
  divider: cn('my-1 border-t border-(--color-border)'),
};

// Key-value pair
export const kv = {
  root: cn('flex min-w-0 flex-col gap-[2px]'),
  label: cn('text-[12px] leading-[1.3] text-(--color-text-tertiary)'),
  value: cn('text-[13px] leading-[1.4] break-words text-(--color-text-primary)'),
  valueMono: cn('font-mono tabular-nums'),
  valueEmpty: cn('italic text-(--color-text-tertiary)'),
};
export const kvGrid = cn('grid grid-cols-2 gap-x-4 gap-y-[10px]');

// Info group section divider
export const infoGroup = {
  root: cn('border-b border-(--color-border) py-[14px] first:pt-0 last:border-none last:pb-0'),
  title: cn('mb-3 text-[12px] font-medium uppercase tracking-[0.06em] text-(--color-text-tertiary)'),
};

// Emergency contact box
export const emergency = {
  box: cn('mt-3 rounded-[8px] bg-(--color-bg-surface) px-3 py-[10px]'),
  label: cn('mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-(--color-text-tertiary)'),
};

// Allergy highlight box
export const allergy = {
  box: cn('flex gap-[10px] rounded-[8px] border border-(--color-danger)/30 bg-(--color-danger-surface) p-3'),
  icon: cn('mt-[1px] size-[14px] shrink-0 text-(--color-danger)'),
  text: cn('text-[13px] leading-[1.4] text-(--color-danger)'),
};

// Profile text
export const profileText = cn('text-[13px] leading-[1.5] text-(--color-text-primary)');
export const profileTextSecondary = cn('text-[13px] leading-[1.5] text-(--color-text-secondary)');
export const profileTextEmpty = cn('text-[13px] italic text-(--color-text-tertiary)');

// Record (evolution) row
export const record = {
  row: cn('grid cursor-pointer grid-cols-[80px_12px_1fr_auto] items-start gap-[14px] border-b border-(--color-border) py-[14px] first:pt-0 last:border-none last:pb-0 hover:[&_.evol-summary]:text-(--color-text-primary)'),
  dateText: cn('text-[13px] font-medium leading-[1.2] text-(--color-text-primary)'),
  time: cn('mt-[2px] font-mono text-[12px] tabular-nums text-(--color-text-tertiary)'),
  dot: cn('mt-[5px] size-[10px] rounded-full bg-(--color-primary) shadow-[0_0_0_3px_var(--color-primary-surface)]'),
  tags: cn('mb-[6px] flex flex-wrap items-center gap-[6px]'),
  typeTag: cn('inline-flex items-center rounded-(--radius-badge) border border-(--color-border) bg-(--color-bg-surface) px-2 py-[1px] text-xs text-(--color-text-secondary)'),
  aiTag: cn('inline-flex items-center gap-1 rounded-(--radius-badge) bg-(--color-ai-bg) px-2 py-[1px] text-xs text-(--color-ai-text)'),
  summary: cn('evol-summary line-clamp-2 text-[13px] leading-[1.5] text-(--color-text-secondary) transition-colors duration-[120ms]'),
  chevron: cn('mt-[3px] size-[14px] shrink-0 text-(--color-text-tertiary)'),
};

// Form item
export const formItemRoot = cva(
  'flex items-center gap-3 rounded-[10px] border border-(--color-border) px-[14px] py-3',
  {
    variants: { done: { true: 'bg-(--color-bg-surface)', false: '' } },
    defaultVariants: { done: false },
  },
);
export const formItemIcon = cva('size-4 shrink-0', {
  variants: { done: { true: 'text-(--color-success)', false: 'text-(--color-text-tertiary)' } },
  defaultVariants: { done: false },
});
export const formBadge = cva(
  'inline-flex items-center rounded-(--radius-badge) border px-2 py-[2px] text-xs font-medium',
  {
    variants: {
      done: {
        true: 'border-(--color-success)/30 bg-(--color-success-surface) text-(--color-success)',
        false: 'border-(--color-border) bg-(--color-bg-surface) text-(--color-text-secondary)',
      },
    },
    defaultVariants: { done: false },
  },
);
export const formItem = {
  body: cn('min-w-0 flex-1'),
  title: cn('text-[13px] font-medium text-(--color-text-primary)'),
  meta: cn('mt-[2px] text-[12px] text-(--color-text-tertiary)'),
};

// Empty section placeholder
export const emptySection = cn('flex items-center justify-center py-8 text-sm text-(--color-text-tertiary)');

// Skeleton shell
export const skeleton = {
  root: cn('flex flex-col gap-[18px] p-6'),
  headerShell: cn('flex items-center justify-between gap-[18px] rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) px-5 py-[18px]'),
  headerLeft: cn('flex items-center gap-[18px]'),
  headerRight: cn('flex gap-2'),
  actionGrid: cn('grid grid-cols-4 gap-[10px]'),
};

// Two-column layout
export const twoCol = cn('grid grid-cols-2 gap-[14px] max-[1100px]:grid-cols-1');
