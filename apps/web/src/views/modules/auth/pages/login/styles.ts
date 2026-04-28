import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

export const login = {
  root: cn('grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.1fr]'),
};

export const leftPanel = {
  root: cn('flex flex-col justify-between bg-(--color-bg-card) px-10 py-8'),
  logo: cn('flex items-center gap-2.5'),
  logoIcon: cn('flex h-7 w-7 items-center justify-center rounded-[6px] bg-(--color-primary)'),
  logoText: cn('text-sm-body font-medium tracking-tight text-(--color-text-primary)'),
  title: cn('mb-1.5 text-xl font-medium tracking-tight text-(--color-text-primary)'),
  subtitle: cn('mb-6 leading-relaxed text-sm text-(--color-text-secondary)'),
  footer: cn('flex items-center justify-between border-t border-(--color-border) pt-3.5 text-2xs text-(--color-text-tertiary)'),
  footerLeft: cn('flex items-center gap-1.5'),
};

export const form = cn('flex flex-col gap-3.5');

export const field = {
  label: cn('mb-1.5 block text-xs font-medium text-(--color-text-secondary)'),
  labelInline: cn('text-xs font-medium text-(--color-text-secondary)'),
  icon: cn('absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)'),
  error: cn('mt-1 text-2xs text-(--color-warning)'),
  revealBtn: cn('absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary) hover:text-(--color-text-secondary)'),
  forgotBtn: cn('cursor-pointer text-xs font-medium text-(--color-primary) hover:text-(--color-primary-hover)'),
  rememberLabel: cn('flex cursor-pointer items-center gap-2'),
  rememberText: cn('text-xs text-(--color-text-secondary)'),
  checkbox: cn('h-3.5 w-3.5 cursor-pointer rounded-[3px] border border-(--color-border) accent-(--color-primary)'),
  submitBtn: cn('mt-1 w-full bg-(--color-primary) text-sm font-medium hover:bg-(--color-primary-hover)'),
};

export const usernameInput = cva('pl-9 text-sm', {
  variants: { error: { true: 'border-(--color-warning)', false: '' } },
  defaultVariants: { error: false },
});

export const passwordInput = cva('pl-9 pr-10 text-sm', {
  variants: { error: { true: 'border-(--color-warning)', false: '' } },
  defaultVariants: { error: false },
});

export const rightPanel = {
  root: cn('relative hidden overflow-hidden bg-[#0F172A] lg:block'),
  overlay: cn('absolute inset-0 z-10 flex flex-col justify-end p-10'),
  title: cn('mb-2 text-xl font-medium leading-snug tracking-tight text-[#F8FAFC]'),
  highlight: cn('text-[#5EEAD4]'),
  description: cn('text-xs leading-relaxed text-[#94A3B8]'),
};
