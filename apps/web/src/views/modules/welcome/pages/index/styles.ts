import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

export const statsGrid = cn('mb-6 grid grid-cols-4 gap-3');
export const mainGrid = cn('grid gap-4 grid-cols-[1.4fr_1fr]');

export const statTile = {
  root: cn('rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) px-4 py-[14px]'),
  label: cn('text-sm leading-[1.4] text-(--color-text-secondary)'),
  value: cn('mt-1 font-mono text-xl font-medium leading-[1.2] tabular-nums text-(--color-text-primary)'),
  delta: cn('mt-0.5 text-xs leading-[1.4] text-(--color-success)'),
};

export const clinicalBadge = cva(
  'inline-flex items-center gap-1 rounded-(--radius-badge) px-[10px] py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        'ai-soft': 'bg-(--color-ai-bg) text-(--color-ai-text) border border-(--color-ai-border)/30',
        primary: 'bg-(--color-primary-surface) text-(--color-primary-text) border border-(--color-primary-border)',
        neutral: 'bg-(--color-bg-surface) text-(--color-text-secondary) border border-(--color-border)',
        info: 'bg-(--color-info-surface) text-(--color-info) border border-(--color-info)/30',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export const aiActionButton = cn(
  'inline-flex items-center gap-2 rounded-(--radius-button) bg-(--color-ai-badge-bg) px-3 py-[7px] text-[13px] font-medium text-white transition-all duration-(--duration-fast) ease-out hover:opacity-90 focus-visible:outline-none',
);

export const panelCard = {
  root: cn('rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) shadow-none'),
  header: cn('flex-row items-center justify-between space-y-0 px-4 py-3'),
  title: cn('text-sm-body font-medium text-(--color-text-primary)'),
  content: cn('flex flex-col gap-3 px-4 pb-4 pt-0'),
  empty: cn('flex items-center justify-center py-8 text-sm text-(--color-text-tertiary)'),
};

export const appointment = {
  title: cn('text-lead font-medium leading-[1.3] text-(--color-text-primary)'),
  time: cn('mt-[2px] font-mono text-xs leading-[1.4] tabular-nums text-(--color-text-secondary)'),
  badgeRow: cn('flex flex-wrap gap-1.5'),
  actionRow: cn('flex gap-2 mt-1'),
};
