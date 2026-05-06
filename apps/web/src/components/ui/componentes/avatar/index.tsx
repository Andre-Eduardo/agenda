import * as AvatarPrimitive from '@radix-ui/react-avatar';
import {cn} from '@/lib/utils';
import styles from './avatar.module.css';

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
    className,
    size,
    ref,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {size?: 'xs' | 'sm' | 'md' | 'lg'}) {
    return (
        <AvatarPrimitive.Root
            ref={ref}
            className={cn(
                styles.avatar,
                size === 'xs' && styles.avatarXs,
                size === 'sm' && styles.avatarSm,
                (!size || size === 'md') && styles.avatarMd,
                size === 'lg' && styles.avatarLg,
                className
            )}
            {...props}
        />
    );
}

// ── AvatarImage ───────────────────────────────────────────────────────────────

function AvatarImage({className, ref, ...props}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    return <AvatarPrimitive.Image ref={ref} className={cn(styles.avatarImage, className)} {...props} />;
}

// ── AvatarFallback ────────────────────────────────────────────────────────────

function AvatarFallback({className, ref, ...props}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
    return <AvatarPrimitive.Fallback ref={ref} className={cn(styles.avatarFallback, className)} {...props} />;
}

// ── Palette para colorir avatares por índice ──────────────────────────────────
//
// Usada para colorir avatares por índice (hash do nome, posição na lista, etc.).
// Mantida como strings Tailwind pois são selecionadas dinamicamente por índice.

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

// ── AvatarInitials ────────────────────────────────────────────────────────────
//
// Componente de iniciais simples sem Radix (para listas densas).

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
                styles.initials,
                size === 'xs' && styles.initialsXs,
                size === 'sm' && styles.initialsSm,
                (!size || size === 'md') && styles.initialsMd,
                size === 'lg' && styles.initialsLg,
                color, // string Tailwind dinâmica — selecionada por índice
                className
            )}
        >
            {initials}
        </span>
    );
}

export {Avatar, AvatarImage, AvatarFallback, AvatarInitials};
