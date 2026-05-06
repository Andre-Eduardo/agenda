import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

export const page = {
  root: cn('flex flex-col pb-[80px] bg-(--color-bg-page)'),
  top: cn('px-6 pt-6'),
  errorState: cn('flex flex-col items-center justify-center gap-4 p-12 text-(--color-text-secondary)'),
  errorLink: cn('text-sm text-(--color-primary-text) underline'),
};

export const skeleton = {
  root: cn('flex flex-col gap-[18px] p-6'),
  grid: cn('grid grid-cols-[200px_1fr] gap-7'),
  patientCard: cn('h-[60px] rounded-(--radius-card)'),
  navStack: cn('flex flex-col gap-2'),
  navItem: cn('h-9 rounded-[8px]'),
  contentStack: cn('flex flex-col gap-[18px]'),
  contentSection: cn('h-[160px] rounded-[12px]'),
};

export const patientCard = {
  root: cn('mt-4 flex items-center gap-3 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) px-4 py-[10px]'),
  info: cn('min-w-0'),
  name: cn('cursor-pointer text-[14px] font-medium text-(--color-text-primary) transition-colors hover:text-(--color-primary-text)'),
  meta: cn('mt-[2px] text-[12px] text-(--color-text-tertiary)'),
};

export const layout = {
  root: cn('mx-6 mt-[18px] grid grid-cols-[200px_1fr] gap-7 items-start'),
  toc: cn('sticky top-6 flex flex-col gap-[2px]'),
  tocTitle: cn('px-[10px] pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-(--color-text-tertiary)'),
  tocItem: cn(
    'flex cursor-pointer items-center gap-[10px] rounded-[8px] border-0 bg-transparent px-[10px] py-2',
    'text-[13px] text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-surface) hover:text-(--color-text-primary)',
  ),
  tocItemActive: cn('bg-(--color-primary-surface) text-(--color-primary-text)'),
  tocFoot: cn('mt-2 flex items-center gap-[6px] border-t border-(--color-border) px-[10px] pt-2 text-[11px] text-(--color-text-tertiary)'),
  content: cn('min-w-0'),
};

export const section = {
  root: cn('mb-[18px] rounded-[12px] border border-(--color-border) bg-(--color-bg-card) px-[24px] pb-[24px] pt-[22px]'),
  head: cn('mb-[18px] flex items-start gap-3 border-b border-dashed border-(--color-border) pb-[14px]'),
  icon: cn('inline-flex size-[28px] shrink-0 items-center justify-center rounded-[8px] bg-(--color-primary-surface) text-(--color-primary-text)'),
  headRight: cn('flex-1 min-w-0'),
  headAside: cn('ml-auto shrink-0'),
  title: cn('text-[16px] font-medium leading-[1.3] tracking-[-0.01em] text-(--color-text-primary)'),
  sub: cn('mt-[2px] text-[12px] text-(--color-text-tertiary)'),
};

export const vitals = {
  grid: cn('grid grid-cols-3 gap-3'),
  cell: cn('rounded-[10px] border border-(--color-border) bg-(--color-bg-surface) p-3'),
  cellWide: cn('col-span-2'),
  cellReadonly: cn('bg-(--color-bg-page)'),
  head: cn('mb-[6px] flex items-center justify-between'),
  label: cn('text-[11px] uppercase tracking-[0.04em] text-(--color-text-tertiary)'),
  unit: cn('text-[11px] text-(--color-text-tertiary)'),
  input: cn(
    'w-full border-0 bg-transparent p-0 font-mono tabular-nums text-[15px] text-(--color-text-primary)',
    'placeholder:text-(--color-text-tertiary) focus:outline-none',
  ),
  paRow: cn('flex items-center gap-1'),
  paSep: cn('font-mono text-[15px] text-(--color-text-tertiary)'),
  warn: cn('mt-1 flex items-center gap-1 text-[11px] text-(--color-warning)'),
  prevBox: cn('mb-3 rounded-[8px] border border-(--color-border) bg-(--color-bg-surface) p-3'),
  prevToggle: cn('inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[12px] text-(--color-text-secondary) hover:text-(--color-primary-text)'),
  prevEmpty: cn('text-[12px] italic text-(--color-text-tertiary)'),
  prevHead: cn('mb-[10px] flex items-center gap-[6px] text-[12px] text-(--color-text-tertiary)'),
  prevGrid: cn('grid grid-cols-6 gap-3'),
  prevLabel: cn('text-[11px] uppercase tracking-[0.04em] text-(--color-text-tertiary)'),
  prevValue: cn('mt-[2px] font-mono tabular-nums text-[14px] text-(--color-text-primary)'),
  imcValue: cn('text-[16px] font-medium font-mono tabular-nums text-(--color-text-primary)'),
  imcEmpty: cn('text-[13px] italic text-(--color-text-tertiary)'),
};

export const imcTag = cva(
  'ml-2 inline-flex items-center rounded-(--radius-badge) px-2 py-[2px] text-[11px] font-medium',
  {
    variants: {
      tone: {
        ok: 'bg-(--color-success-surface) text-(--color-success)',
        warn: 'bg-(--color-warning-surface) text-(--color-warning)',
        bad: 'bg-(--color-danger-surface) text-(--color-danger)',
      },
    },
  },
);

export const soap = {
  stack: cn('flex flex-col divide-y divide-(--color-border)'),
  field: cn('py-[16px] first:pt-0 last:pb-0'),
  head: cn('mb-[10px] flex items-start gap-3'),
  letter: cva(
    'inline-flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-[13px] font-medium',
    {
      variants: {
        v: {
          s: 'bg-(--color-primary-surface) text-(--color-primary-text)',
          o: 'bg-(--color-primary-surface) text-(--color-primary-text)',
          a: 'bg-(--color-success-surface) text-(--color-success)',
          p: 'bg-(--color-warning-surface) text-(--color-warning)',
        },
      },
    },
  ),
  title: cn('text-[14px] font-medium leading-[1.3] text-(--color-text-primary)'),
  hint: cn('mt-[1px] text-[12px] text-(--color-text-tertiary)'),
  vitalsRef: cn('mb-2 flex flex-wrap items-center gap-[6px] rounded-[6px] bg-(--color-bg-surface) px-3 py-[6px] text-[12px] text-(--color-text-secondary)'),
  textarea: cn(
    'mt-2 w-full resize-none overflow-hidden rounded-(--radius-input) border border-(--color-border) bg-(--color-bg-card)',
    'px-3 py-[9px] text-sm leading-[1.6] text-(--color-text-primary)',
    'placeholder:text-(--color-text-tertiary)',
    'hover:border-(--color-border-hover) focus:border-(--color-primary) focus:outline-none',
  ),
};

export const conductGrid = cn('flex flex-wrap gap-2');

export const conductChip = cva(
  'inline-flex cursor-pointer items-center gap-[6px] rounded-(--radius-badge) border px-3 py-[6px] text-[13px] transition-colors',
  {
    variants: {
      on: {
        true: 'border-(--color-primary) bg-(--color-primary-surface) text-(--color-primary-text)',
        false: 'border-(--color-border) bg-(--color-bg-card) text-(--color-text-secondary) hover:border-(--color-border-hover) hover:text-(--color-text-primary)',
      },
    },
    defaultVariants: { on: false },
  },
);

export const upload = {
  zone: cn(
    'flex flex-col items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-(--color-border)',
    'cursor-pointer py-[28px] text-(--color-text-tertiary) transition-colors',
    'hover:border-(--color-primary) hover:bg-(--color-primary-surface) hover:text-(--color-primary-text)',
  ),
  title: cn('text-[13px] font-medium text-(--color-text-primary)'),
  sub: cn('text-[12px] text-(--color-text-tertiary)'),
  list: cn('mt-3 flex flex-col gap-2'),
  row: cn('flex items-center gap-3 rounded-[8px] border border-(--color-border) bg-(--color-bg-surface) px-3 py-[10px]'),
  icon: cn('size-4 shrink-0 text-(--color-text-tertiary)'),
  name: cn('min-w-0 flex-1 truncate text-[13px] text-(--color-text-primary)'),
  size: cn('text-[11px] text-(--color-text-tertiary)'),
  remove: cn('flex size-7 cursor-pointer items-center justify-center rounded-[6px] border-0 bg-transparent text-(--color-text-tertiary) transition-colors hover:bg-(--color-bg-card) hover:text-(--color-danger)'),
  body: cn('min-w-0 flex-1'),
};

export const footer = {
  root: cn(
    'fixed bottom-0 right-0 z-30 flex items-center justify-between gap-4',
    'border-t border-(--color-border) bg-(--color-bg-card) px-8 py-[14px]',
    'left-0',
  ),
  meta: cn('flex items-center gap-[10px] text-xs text-(--color-text-tertiary)'),
  actions: cn('flex items-center gap-[10px]'),
};

export const modal = {
  backdrop: cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'),
  panel: cn('w-[420px] max-w-[calc(100vw-32px)] rounded-[16px] border border-(--color-border) bg-(--color-bg-card) p-6 shadow-xl'),
  head: cn('mb-4 flex items-start gap-3'),
  icon: cn('inline-flex size-[38px] shrink-0 items-center justify-center rounded-[10px]'),
  iconOk: cn('bg-(--color-success-surface) text-(--color-success)'),
  iconWarn: cn('bg-(--color-warning-surface) text-(--color-warning)'),
  title: cn('text-[16px] font-medium text-(--color-text-primary)'),
  sub: cn('mt-[2px] text-sm text-(--color-text-secondary)'),
  summary: cn('mb-5 divide-y divide-(--color-border) overflow-hidden rounded-[8px] border border-(--color-border) bg-(--color-bg-surface)'),
  summaryRow: cn('flex items-center justify-between gap-2 px-4 py-[10px] text-[13px]'),
  summaryLabel: cn('text-(--color-text-secondary)'),
  summaryValue: cn('font-medium text-(--color-text-primary)'),
  chips: cn('flex flex-wrap gap-1'),
  chip: cn('inline-flex items-center gap-1 rounded-(--radius-badge) bg-(--color-primary-surface) px-[6px] py-[2px] text-[11px] font-medium text-(--color-primary-text)'),
  actions: cn('mt-4 flex items-center justify-end gap-3'),
};
export const monoDate = cn('font-mono tabular-nums');
