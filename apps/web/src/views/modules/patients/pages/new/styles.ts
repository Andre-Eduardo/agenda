import { cn } from '@/lib/utils';

// Page wrapper
export const page = {
  root: cn('flex flex-col p-6 pb-24 bg-(--color-bg-page)'),
  errorState: cn('flex flex-col items-center justify-center gap-4 p-12 text-(--color-text-secondary)'),
};

// AI nudge banner
export const aiNudge = {
  root: cn('mt-[18px] flex items-start gap-[10px] border-l-[3px] border-(--color-ai-border) bg-(--color-ai-bg) px-[14px] py-3'),
  icon: cn('inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-(--color-ai-badge-bg) text-white'),
  body: cn('flex-1'),
  title: cn('flex items-center gap-[6px] text-[13px] font-medium leading-[1.3] text-(--color-ai-text)'),
  badge: cn('rounded-[4px] bg-(--color-ai-badge-bg) px-[5px] py-px text-[10px] font-medium tracking-[0.06em] text-white'),
  sub: cn('mt-0.5 text-xs leading-[1.5] text-(--color-ai-text) opacity-85'),
  btn: cn('inline-flex shrink-0 items-center gap-[5px] rounded-[6px] bg-(--color-ai-badge-bg) px-[11px] py-1.5 text-xs font-medium text-white transition-colors hover:bg-(--color-ai-border)'),
};


// Contador numérico nos triggers de tab (usado dentro de TabsTrigger)
export const tabNum = cn('inline-flex size-[22px] shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg-card) text-[11px] font-semibold tabular-nums text-(--color-text-secondary)');
export const tabNumActive = cn('border-(--color-primary) bg-(--color-primary) text-white');
export const tabNumFilled = cn('border-(--color-success)/40 bg-(--color-success-surface) text-(--color-success)');

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
  'mt-4 flex items-start gap-[10px] rounded-[8px] border border-(--color-primary-border) bg-(--color-primary-surface) p-3 text-xs leading-[1.5] text-(--color-primary-text)',
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
