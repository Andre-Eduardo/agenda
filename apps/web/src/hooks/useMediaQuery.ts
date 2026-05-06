import {useEffect, useMemo, useState} from 'react';

// Breakpoints do design system (espelha globals.css / Tailwind v4)
// Valores em px — mesmos da escala do ecxus-ui / Tailwind padrão
const BREAKPOINTS = {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
} as const;

type BreakpointKey = keyof typeof BREAKPOINTS;

type MaxWidth = {maxWidth: string};
type MinWidth = {minWidth: string};
type MaxHeight = {maxHeight: string};
type MinHeight = {minHeight: string};

type MinMaxWidth = (MinWidth & Partial<MaxWidth>) | (Partial<MinWidth> & MaxWidth);
type MinMaxHeight = (MinHeight & Partial<MaxHeight>) | (Partial<MinHeight> & MaxHeight);

export type Constraints = (MinMaxWidth & Partial<MinMaxHeight>) | (Partial<MinMaxWidth> & MinMaxHeight);

const camelToKebab = (str: string) => str.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);

const resolveValue = (value: string): string => (value in BREAKPOINTS ? BREAKPOINTS[value as BreakpointKey] : value);

function buildQuery(constraints: Constraints): string {
    return Object.entries(constraints)
        .map(([key, value]) => `(${camelToKebab(key)}: ${resolveValue(value)})`)
        .join(' and ');
}

/**
 * Determine if the current viewport matches the given constraints.
 *
 * Breakpoint keys (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`) são resolvidos
 * automaticamente para os valores em px do design system.
 *
 * @example
 * const isMobile = useMediaQuery({ maxWidth: 'sm' });
 * const isDesktop = useMediaQuery({ minWidth: 'lg' });
 * const isMidRange = useMediaQuery({ minWidth: 'md', maxWidth: 'xl' });
 */
export function useMediaQuery(constraints: Constraints): boolean {
    const query = useMemo(() => buildQuery(constraints), [constraints]);
    const watcher = useMemo(() => window.matchMedia(query), [query]);
    const [matches, setMatches] = useState(watcher.matches);

    useEffect(() => {
        const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);

        watcher.addEventListener('change', handleChange);

        return () => {
            watcher.removeEventListener('change', handleChange);
        };
    }, [watcher]);

    return matches;
}
