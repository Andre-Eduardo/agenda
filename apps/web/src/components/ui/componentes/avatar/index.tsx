import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

function Avatar({
  className,
  size,
  ref,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        size === 'xs' && 'size-6',
        size === 'sm' && 'size-8',
        (!size || size === 'md') && 'size-10',
        size === 'lg' && 'size-12',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className,
      )}
      {...props}
    />
  );
}

// Palette usada para colorir avatares por índice (hash do nome, posição na lista, etc.)
export const avatarColorVariants = [
  'bg-(--color-primary-surface) text-(--color-primary-text)',
  'bg-(--color-info-surface) text-(--color-info)',
  'bg-(--color-success-surface) text-(--color-success)',
  'bg-(--color-warning-surface) text-(--color-warning)',
  'bg-(--color-danger-surface) text-(--color-danger)',
  'bg-(--color-ai-bg) text-(--color-ai-text)',
  'bg-(--color-bg-surface) text-(--color-text-secondary)',
] as const;

export type AvatarColorVariant = (typeof avatarColorVariants)[number];

// Componente de iniciais simples sem Radix (para listas densas)
function AvatarInitials({
  name,
  colorIndex,
  size,
  className,
}: {
  name: string;
  colorIndex?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const color = avatarColorVariants[(colorIndex ?? 0) % avatarColorVariants.length];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-medium',
        size === 'xs' && 'size-6 text-[10px]',
        size === 'sm' && 'size-8 text-xs',
        (!size || size === 'md') && 'size-10 text-sm',
        size === 'lg' && 'size-12 text-base',
        color,
        className,
      )}
    >
      {initials}
    </span>
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarInitials };
