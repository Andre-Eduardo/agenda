import {useEffect, useMemo, useState} from 'react';
import {useTheme} from '@emotion/react';
import type {Theme} from '../styles/theme';

type MaxWidth = {
    maxWidth: string;
};

type MinWidth = {
    minWidth: string;
};

type MinMaxWidth = (MinWidth & Partial<MaxWidth>) | (Partial<MinWidth> & MaxWidth);

type MaxHeight = {
    maxHeight: string;
};

type MinHeight = {
    minHeight: string;
};

type MinMaxHeight = (MinHeight & Partial<MaxHeight>) | (Partial<MinHeight> & MaxHeight);

export type Constraints = (MinMaxWidth & Partial<MinMaxHeight>) | (Partial<MinMaxWidth> & MinMaxHeight);

/**
 * Determine if the current viewport matches the given constraints.
 *
 * @example
 * const isSmall = useMediaQuery({maxWidth: 'sm'});
 * const isMedium = useMediaQuery({minWidth: 'md', maxWidth: 'lg'});
 *
 * @param constraints - The constraints to match.
 * @returns `true` if the current viewport matches the given constraints, `false` otherwise.
 */
export function useMediaQuery(constraints: Constraints): boolean {
    const theme = useTheme();
    const watcher = useMemo(() => window.matchMedia(buildQuery(constraints, theme as Theme)), [constraints, theme]);
    const [matches, setMatch] = useState(watcher.matches);

    useEffect(() => {
        const handleMediaQueryChange = (event: MediaQueryListEvent): void => setMatch(event.matches);

        watcher.addEventListener('change', (event: MediaQueryListEvent) => {
            handleMediaQueryChange(event);
        });

        return (): void => {
            watcher.removeEventListener('change', handleMediaQueryChange);
        };
    }, [watcher]);

    return matches;
}

function buildQuery(constraints: Constraints, theme: Theme): string {
    if (theme.sizes === undefined) {
        throw new Error('Missing breakpoint definition.');
    }

    const camelToKebabCase = (str: string) => str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    const getConstraintValue = (constraint: string) => theme.sizes[constraint as keyof Theme['sizes']] ?? constraint;

    return Object.entries(constraints)
        .map(([key, value]) => `(${camelToKebabCase(key)}: ${getConstraintValue(value)})`)
        .join(' and ');
}
