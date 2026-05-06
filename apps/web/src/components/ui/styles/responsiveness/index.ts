import type {AllSystemCSSProperties as CssProperties, SystemCssProperties as CssStyle} from '..';
import type {BoxStyle} from '../../components/Box';
import {mapValues} from '../../utils/mapValues';
import type {BreakpointRule, BreakpointSize} from './breakpoints';

export * from './breakpoints';

export type ResponsiveMapping = Partial<Record<BreakpointRule, CssProperties>>;
export type ResponsiveProperty<P> = P | (Partial<Record<BreakpointSize, P>> & {_: P});

const breakpointAliases: BreakpointSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Returns an array of values that are responsive to the breakpoints.
 *
 * The `_` key is used for the default value.
 * Each breakpoint key refers to the minimum width to apply the value.
 * Also accepts a mapping of aliases to use for the keys, the aliases are used to map the keys to the actual values.
 *
 * @example
 * const width = responsive({_: '5px', sm: '10px', lg: '20px'});
 * // Results in: ['5px', null, '10px', null, '20px', null, null]
 *
 * // This will generate the following CSS:
 * ```
 * {
 *   width: 5px;
 *
 *   @media (min-width: 640px) {
 *     width: 10px;
 *   }
 *
 *   @media (min-width: 1024px) {
 *     width: 20px;
 *   }
 * }
 * ```
 *
 * @param map The mapping of the values to the breakpoints.
 * @param aliases The aliases for the values.
 */
export function responsive(
    map: Partial<Record<BreakpointRule, string | number>>,
    aliases: Record<string, string | number> = {}
): Array<string | number | null> {
    const array: Array<string | number | null> = [];

    array.push(map._ !== undefined ? (aliases[map._] ?? map._) : null);

    breakpointAliases.forEach((breakpoint) => {
        const value = map[breakpoint];

        array.push(value === undefined ? null : (aliases[value] ?? value));
    });

    return array;
}

export function responsiveStyle<
    M extends {[key in BreakpointRule]?: PropertyKey},
    A extends {[key in M[keyof M] & PropertyKey]?: BoxStyle},
>(mapping: M | (M[keyof M] & PropertyKey), aliases: A): CssStyle;

export function responsiveStyle(mapping: ResponsiveMapping): CssStyle;

/**
 * Returns a style object that is responsive to the breakpoints.
 *
 * The keys of the mapping are the breakpoints and the values are the styles.
 * The `_` key is used for the default style.
 * Also accepts a mapping of aliases to use for the keys, the aliases are used to map the keys to the actual styles.
 *
 * @example
 * const style = responsiveStyle({
 *   _: {
 *     width: '5px',
 *     height: '5px',
 *   },
 *   sm: {
 *     width: '10px',
 *     height: '10px',
 *   },
 *   lg: {
 *     width: '20px',
 *     height: '20px',
 *   },
 * });
 * // Results in:
 * {
 *   width: ['5px', null, '10px', null, '20px', null, null],
 *   height: ['5px', null, '10px', null, '20px', null, null],
 * }
 * // This will generate the following CSS:
 * ```
 * {
 *   width: 5px;
 *   height: 5px;
 *
 *   @media (min-width: 640px) {
 *     width: 10px;
 *     height: 10px;
 *   }
 *   @media (min-width: 1024px) {
 *     width: 20px;
 *     height: 20px;
 *   }
 * }
 * ```
 *
 * @param mapping The mapping of the styles to the breakpoints.
 * @param aliases The aliases for the values.
 */
export function responsiveStyle<
    M extends Partial<Record<BreakpointRule, PropertyKey>>,
    A extends Record<M[keyof M] & PropertyKey, CssProperties>,
>(mapping: ResponsiveMapping | M | (M[keyof M] & PropertyKey), aliases?: A): CssStyle {
    if (aliases !== undefined) {
        if (typeof mapping === 'string') {
            return aliases[mapping];
        }

        return responsiveStyle(mapValues(mapping as ResponsiveMapping, aliases));
    }

    const mergedStyle: Partial<Record<keyof CssProperties, Partial<Record<BreakpointRule, string | number>>>> = {};

    for (const rule of Object.keys(mapping) as BreakpointRule[]) {
        const style = (mapping as ResponsiveMapping)[rule]!;
        const styleEntries = Object.entries(style) as Array<[keyof CssProperties, number | string]>;

        for (const [property, value] of styleEntries) {
            mergedStyle[property] = {
                ...mergedStyle[property],
                [rule]: value,
            };
        }
    }

    return mapValues(mergedStyle, (values) => responsive(values!));
}
