import type {MutableRefObject} from 'react';
import {useEffect} from 'react';

type Options = IntersectionObserverInit & {
    target: MutableRefObject<Element | null>;
    onIntersect: (entry: IntersectionObserverEntry) => void;
    enabled?: boolean;
};

/**
 * Observes when a target element enters the viewport using the Intersection Observer API.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useIntersectionObserver({
 *   target: ref,
 *   onIntersect: () => loadMore(),
 *   enabled: hasNextPage,
 *   threshold: 0.1,
 * });
 */
export function useIntersectionObserver(options: Options) {
    const {target, onIntersect, enabled, ...observerOptions} = options;

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                onIntersect(entry);
            }
        }, observerOptions);

        const element = target.current;

        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [target, enabled, onIntersect, observerOptions]);
}
