import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

// Outer shell
export const page = cn('flex flex-col gap-0 h-full');
export const breadcrumb = cn('flex items-center gap-1.5 text-xs text-(--color-text-tertiary) px-6 pt-5 pb-0');
export const breadcrumbLink = cn('hover:text-(--color-text-secondary) transition-colors cursor-pointer');
export const breadcrumbSep = cn('text-(--color-text-tertiary)');
export const breadcrumbCurrent = cn('text-(--color-text-primary)');

// Two-column layout (side nav + content)
export const layout = cn('flex flex-1 gap-0');
export const sideNav = cn('w-52 shrink-0 border-r border-(--color-border) py-6 px-4 flex flex-col gap-1');
export const sideNavTitle = cn('text-[11px] font-medium text-(--color-text-tertiary) uppercase tracking-wider px-2 mb-2');
export const sideNavItem = cva(
  'flex items-center gap-2.5 w-full px-2 py-2 rounded-[6px] text-sm transition-colors text-left',
  {
    variants: {
      active: {
        true:  'bg-(--color-primary)/10 text-(--color-primary) font-medium',
        false: 'text-(--color-text-secondary) hover:bg-(--color-bg-card) hover:text-(--color-text-primary)',
      },
    },
    defaultVariants: { active: false },
  },
);
export const content = cn('flex-1 min-w-0 px-8 py-6 overflow-y-auto');

// Page header
export const pageTitle = cn('text-[20px] font-medium text-(--color-text-primary) leading-snug');
export const pageSub = cn('text-sm text-(--color-text-secondary) mt-1 max-w-[560px] leading-relaxed');

// Form card (tabs container)
export const formCard = cn(
  'mt-5 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) overflow-hidden',
);

// Tabs
export const tabList = cn(
  'flex border-b border-(--color-border) bg-(--color-bg-surface) px-5 gap-1 overflow-x-auto',
);
export const tab = cva(
  'flex items-center gap-2 px-4 py-3.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap',
  {
    variants: {
      active: {
        true:  'border-(--color-primary) text-(--color-primary) font-medium',
        false: 'border-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)',
      },
    },
    defaultVariants: { active: false },
  },
);
export const tabNum = cva(
  'flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-medium shrink-0',
  {
    variants: {
      active: {
        true:  'bg-(--color-primary) text-white',
        false: 'bg-(--color-text-tertiary)/20 text-(--color-text-secondary)',
      },
      filled: {
        true:  'bg-(--color-success)/15 text-(--color-success)',
        false: '',
      },
    },
    defaultVariants: { active: false, filled: false },
  },
);

// Form sections inside the card
export const formSection = cn('p-6');
export const sectionHead = cn('flex items-start gap-3 mb-5');
export const sectionNum = cn(
  'flex items-center justify-center w-7 h-7 rounded-full shrink-0',
  'bg-(--color-primary)/10 text-(--color-primary) text-sm font-medium',
);
export const sectionTitle = cn('text-sm font-medium text-(--color-text-primary) leading-snug');
export const sectionSub = cn('text-xs text-(--color-text-secondary) mt-0.5 leading-relaxed');

// Grid
export const grid = cn('grid grid-cols-12 gap-4');
export const span = {
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
} as const;

// Fields
export const fieldLabel = cn('text-xs font-medium text-(--color-text-secondary) mb-1.5 flex items-center gap-1');
export const fieldRequired = cn('text-(--color-warning) text-xs');
export const fieldOptional = cn('text-(--color-text-tertiary) text-[10px] font-normal');
export const fieldHint = cn('text-[11px] text-(--color-text-tertiary) mt-1');
export const fieldError = cn('text-[11px] text-(--color-warning) mt-1');

// Photo row
export const photoRow = cn('flex items-center gap-5 mb-6');
export const photoCircle = cn(
  'w-20 h-20 rounded-full overflow-hidden shrink-0',
  'border-2 border-(--color-border) bg-(--color-bg-surface)',
  'flex items-center justify-center',
);
export const photoInitials = cn(
  'text-2xl font-medium text-(--color-text-tertiary)',
);
export const photoActions = cn('flex flex-col gap-2');
export const photoHint = cn('text-[11px] text-(--color-text-tertiary)');

// AI nudge
export const aiNudge = cn(
  'flex items-start gap-3 mt-5 p-4 rounded-(--radius-card)',
  'border border-(--color-ai-border) bg-(--color-ai-bg)',
);
export const aiIcon = cn('shrink-0 text-(--color-ai-border) mt-0.5');
export const aiTitle = cn('text-xs font-medium text-(--color-text-primary) flex items-center gap-2');
export const aiSub = cn('text-[11px] text-(--color-text-secondary) mt-1 leading-relaxed');
export const aiBadgeInline = cn(
  'inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[9px] font-medium uppercase tracking-wider',
  'bg-(--color-ai-badge-bg) text-white',
);

// Password meter
export const pwdMeter = cn('mt-2');
export const pwdBar = cn('h-1 rounded-full bg-(--color-border) overflow-hidden');
export const pwdBarFill = cva('h-full rounded-full transition-all', {
  variants: {
    level: {
      weak:   'bg-(--color-danger)',
      med:    'bg-(--color-warning)',
      strong: 'bg-(--color-success)',
    },
  },
});
export const pwdLabel = cva('text-[11px] mt-1', {
  variants: {
    level: {
      weak:   'text-(--color-danger)',
      med:    'text-(--color-warning)',
      strong: 'text-(--color-success)',
    },
  },
});

// Sub-sections inside security tab
export const subSection = cn('border-t border-(--color-border) pt-5 mt-5 first:border-t-0 first:pt-0 first:mt-0');
export const subSectionHead = cn('flex items-center gap-2 mb-4 text-sm font-medium text-(--color-text-primary)');
export const subSectionTag = cn(
  'text-[11px] text-(--color-text-tertiary) font-normal',
  'bg-(--color-bg-surface) border border-(--color-border) rounded-full px-2 py-0.5',
);

// Sessions
export const sessionList = cn('flex flex-col gap-2');
export const sessionRow = cva('flex items-center gap-3 p-3 rounded-[8px] border border-(--color-border)', {
  variants: {
    current: {
      true:  'bg-(--color-primary)/5 border-(--color-primary)/20',
      false: 'bg-(--color-bg-surface)',
    },
  },
  defaultVariants: { current: false },
});
export const sessionIcon = cn('w-9 h-9 flex items-center justify-center rounded-[6px] bg-(--color-bg-card) text-(--color-text-secondary) shrink-0');
export const sessionDevice = cn('text-sm font-medium text-(--color-text-primary) flex items-center gap-2');
export const sessionBadge = cn('text-[10px] bg-(--color-primary)/10 text-(--color-primary) rounded-full px-2 py-0.5');
export const sessionSub = cn('text-[11px] text-(--color-text-tertiary)');
export const sessionWhen = cn('ml-auto text-xs text-(--color-text-tertiary) shrink-0');

// Footer bar
export const footer = cn(
  'border-t border-(--color-border) px-8 py-4',
  'flex items-center justify-between gap-4 bg-(--color-bg-surface)',
);
export const footerMeta = cn('flex items-center gap-2 text-xs text-(--color-text-tertiary)');
export const footerStep = cn('ml-4 text-xs text-(--color-text-tertiary)');
export const footerActions = cn('flex items-center gap-2');

// Placeholder
export const placeholder = cn('flex flex-col items-center gap-3 py-16 text-center');
export const placeholderTitle = cn('text-sm font-medium text-(--color-text-primary)');
export const placeholderSub = cn('text-xs text-(--color-text-secondary)');
