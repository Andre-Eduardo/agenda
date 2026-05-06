import type {ComponentProps, ElementType, ForwardedRef, ReactElement} from 'react';
import type {SystemStyleObject} from '../../styles';
import {css, styled} from '../../styles';

export type BoxStyle = SystemStyleObject;

export type BoxProps = {
    /** The classes of the box. */
    className?: string;
    /** The style object for the box. */
    style?: BoxStyle;
};

export type GenericProps<T extends ElementType, P extends Record<string, unknown>> = P &
    Omit<ComponentProps<T>, 'as' | keyof P> & {
        /** The component to render. */
        as?: ComponentProps<T> extends ComponentProps<T> ? T : never;
    };

export type GenericComponent<P extends Record<string, unknown>, ST extends ElementType, D extends ST> = <
    T extends ElementType & ST = D,
>(
    props: GenericProps<T, P>,
    ref?: ForwardedRef<T>
) => ReactElement | null;

const shouldForwardProp = (prop: string): boolean => !['style', 'as'].includes(prop);

export const Box = styled('div', {shouldForwardProp})(({style}) =>
    style !== undefined ? css(style) : undefined
) as GenericComponent<BoxProps, ElementType, 'div'>;
