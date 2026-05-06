import type {ComponentProps, ElementType, ForwardedRef, ReactElement} from 'react';
import {forwardRef} from 'react';
import {clsx} from 'clsx';

// ── Tipos polimórficos ────────────────────────────────────────────────────────

export type BoxProps = {
    /** Classe(s) CSS a aplicar no elemento raiz. Combina com `clsx`. */
    className?: string;
};

type PolymorphicProps<T extends ElementType, P> = P &
    Omit<ComponentProps<T>, 'as' | keyof P> & {
        /** Elemento/componente a renderizar. Padrão: `div`. */
        as?: T;
    };

export type PolymorphicRef<T extends ElementType> = ComponentProps<T>['ref'];

// ── Implementação ─────────────────────────────────────────────────────────────

function BoxImpl<T extends ElementType = 'div'>(
    {as: Tag = 'div' as T, className, ...props}: PolymorphicProps<T, BoxProps>,
    ref: ForwardedRef<Element>
) {
    // Necessário: TypeScript não consegue estreitar o tipo genérico T dentro da implementação.
    // O contrato público é garantido pela assinatura de `Box` abaixo.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component = (Tag ?? 'div') as any;
    return <Component ref={ref} className={clsx(className)} {...props} />;
}

/**
 * Primitivo polimórfico de layout.
 *
 * Renderiza um `div` por padrão; use `as` para mudar o elemento.
 * Aplique estilos via CSS Modules (`@apply`) ou classes Tailwind no `className`.
 *
 * @example
 * // Componente base com CSS Module
 * import styles from './card.module.css';
 * <Box className={styles.root}>...</Box>
 *
 * @example
 * // Troca de elemento
 * <Box as="section" className={styles.section}>...</Box>
 * <Box as="button" type="button" onClick={handleClick}>...</Box>
 */
export const Box = forwardRef(BoxImpl) as <T extends ElementType = 'div'>(
    props: PolymorphicProps<T, BoxProps> & {ref?: ForwardedRef<Element>}
) => ReactElement | null;
