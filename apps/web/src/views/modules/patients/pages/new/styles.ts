import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

// Page wrapper
export const page = {
  root: cn('flex flex-col p-6 pb-24 bg-(--color-bg-page)'),
  errorState: cn('flex flex-col items-center justify-center gap-4 p-12 text-(--color-text-secondary)'),
};

// Breadcrumb
export const breadcrumb = {
  root: cn('mb-2 flex items-center gap-[6px] text-[13px] leading-[1.4] text-(--color-text-tertiary)'),
  link: cn('cursor-pointer text-(--color-text-secondary) transition-colors hover:text-(--color-primary-text)'),
  sep: cn('text-(--color-text-tertiary)'),
  current: cn('text-(--color-text-primary)'),
};

// Page header
export const pageHeader = {
  root: cn('flex items-end justify-between gap-4'),
  title: cn('text-[32px] font-medium leading-[1.15] tracking-[-0.01em] text-(--color-text-primary)'),
  sub: cn('mt-1.5 text-sm leading-[1.5] text-(--color-text-secondary)'),
};

// AI nudge banner
export const aiNudge = {
  root: cn('mt-[18px] flex items-start gap-[10px] border-l-[3px] border-(--color-ai-border) bg-(--color-ai-bg) px-[14px] py-3'),
  icon: cn('inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-(--color-ai-badge-bg) text-white'),
  body: cn('flex-1'),
  title: cn('flex items-center gap-[6px] text-[13px] font-medium leading-[1.3] text-(--color-ai-text)'),
  badge: cn('rounded-[4px] bg-(--color-ai-badge-bg) px-[5px] py-px text-[10px] font-medium tracking-[0.06em] text-white'),
  sub: cn('mt-0.5 text-xs leading-[1.5] text-(--color-ai-text) opacity-85'),
  btn: cn('inline-flex shrink-0 items-center gap-[5px] rounded-[6px] bg-(--color-ai-badge-bg) px-[11px] py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0F766E]'),
};

// Form card
export const formCard = cn('mt-[22px] overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card)');

// Tabs
export const tabs = {
  root: cn('flex border-b border-(--color-border) bg-(--color-bg-surface) px-1.5 pt-1.5'),
  tab: cn(
    'flex flex-1 cursor-pointer items-center justify-center gap-[10px] rounded-t-[8px] border-b-2 border-transparent',
    'px-4 py-[14px] text-[13px] font-medium leading-[1.3] text-(--color-text-secondary)',
    'transition-all duration-(--duration-fast) ease-out hover:bg-(--color-bg-card) hover:text-(--color-text-primary)',
    '-mb-px',
  ),
  tabActive: cn('border-(--color-primary) bg-(--color-bg-card) text-(--color-primary-text)'),
  tabFilled: cn('text-(--color-text-secondary)'),
  num: cn(
    'inline-flex size-[22px] shrink-0 items-center justify-center rounded-full border border-(--color-border)',
    'bg-(--color-bg-card) text-[11px] font-semibold tabular-nums text-(--color-text-secondary)',
  ),
  numActive: cn('border-(--color-primary) bg-(--color-primary) text-white'),
  numFilled: cn('border-[#A7F3D0] bg-(--color-success-surface) text-(--color-success)'),
  label: cn('text-[13px]'),
};

// Form section
export const section = {
  root: cn('p-7'),
  head: cn('mb-[18px] flex items-start justify-between gap-4'),
  num: cn(
    'inline-flex size-6 shrink-0 items-center justify-center rounded-[6px]',
    'bg-(--color-primary-surface) font-mono text-xs font-medium tabular-nums text-(--color-primary-text)',
  ),
  title: cn('text-base font-medium leading-[1.3] tracking-[-0.005em] text-(--color-text-primary)'),
  sub: cn('mt-0.5 text-[13px] leading-[1.4] text-(--color-text-tertiary)'),
};

// 12-column form grid
export const grid = cn('grid grid-cols-12 gap-x-4 gap-y-[14px]');

// Individual field
export const field = {
  root: cn('flex flex-col gap-1.5'),
  label: cn('flex items-center gap-1 text-[13px] font-medium leading-[1.3] text-(--color-text-primary)'),
  req: cn('text-(--color-danger)'),
  opt: cn('text-xs font-normal text-(--color-text-tertiary)'),
  hint: cn('text-xs leading-[1.4] text-(--color-text-tertiary)'),
  error: cn('flex items-center gap-1 text-xs leading-[1.4] text-(--color-warning)'),
  inputBase: cn(
    'w-full rounded-(--radius-input) border border-(--color-border) bg-(--color-bg-card) px-3 py-[9px]',
    'text-sm-body leading-[1.4] text-(--color-text-primary) transition-colors duration-(--duration-fast) ease-out',
    'placeholder:text-(--color-text-tertiary)',
    'hover:border-(--color-border-hover)',
    'focus:border-(--color-primary) focus:outline-none',
  ),
  inputMono: cn('font-mono tabular-nums text-[13px]'),
  inputError: cn('border-(--color-warning) focus:border-(--color-warning)'),
  inputWithIcon: cn('relative'),
  leadIcon: cn('pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)'),
  trailIcon: cn('pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-(--color-text-tertiary)'),
  inputPaddedLeft: cn('pl-[36px]'),
  textarea: cn('min-h-[80px] resize-y'),
  selectIcon: cn(
    'appearance-none',
    "bg-[url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_10px_center] pr-8",
  ),
};

export const span = cva('', {
  variants: {
    cols: {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12',
    },
  },
  defaultVariants: { cols: 12 },
});

// Photo uploader
export const photo = {
  root: cn('mb-[18px] flex items-center gap-4'),
  frame: cn(
    'relative flex size-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden',
    'rounded-[14px] border-[1.5px] border-dashed border-(--color-border) bg-(--color-bg-surface) text-(--color-text-tertiary)',
    'transition-all duration-(--duration-fast) ease-out hover:border-(--color-primary) hover:bg-(--color-primary-surface) hover:text-(--color-primary-text)',
  ),
  text: cn('text-center text-[11px] font-medium leading-[1.3] px-1'),
  img: cn('absolute inset-0 size-full object-cover'),
  overlay: cn('absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-[11px] font-medium text-white opacity-0 transition-opacity duration-(--duration-fast) ease-out group-hover:opacity-100'),
  meta: cn('flex flex-col gap-1'),
  title: cn('text-sm-body font-medium text-(--color-text-primary)'),
  sub: cn('text-xs leading-[1.4] text-(--color-text-tertiary)'),
};

// Sub-section (Responsável)
export const subSection = {
  root: cn('mt-[18px] rounded-[10px] bg-(--color-bg-surface) p-4'),
  head: cn('mb-[14px] flex items-center gap-2'),
  title: cn('text-[13px] font-medium leading-[1.3] text-(--color-text-primary)'),
  tag: cn('rounded-[4px] border border-(--color-border) bg-(--color-bg-card) px-[7px] py-0.5 text-[11px] text-(--color-text-tertiary)'),
  hint: cn('text-[12px] text-(--color-text-tertiary)'),
};

// Info note (Saúde section)
export const infoNote = cn(
  'mt-4 flex items-start gap-[10px] rounded-[8px] border border-[#C7D2FE] bg-[#EEF2FF] p-3 text-xs leading-[1.5] text-[#3730A3]',
  'dark:bg-[#1E1B4B] dark:text-[#C7D2FE] dark:border-[#312E81]',
);

// Sticky footer
export const footer = {
  root: cn(
    'fixed bottom-0 right-0 z-30 flex items-center justify-between gap-4',
    'border-t border-(--color-border) bg-(--color-bg-card) px-8 py-[14px]',
    '[.sidebar~.main_&]:left-[240px] left-0',
  ),
  meta: cn('flex items-center gap-[10px] text-xs leading-[1.4] text-(--color-text-tertiary)'),
  step: cn('ml-1 rounded-full border border-(--color-border) bg-(--color-bg-surface) px-[10px] py-1 text-[11px] font-medium tracking-[0.02em] text-(--color-text-secondary)'),
  actions: cn('flex items-center gap-[10px]'),
};
