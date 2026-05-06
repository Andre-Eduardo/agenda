import type {MutableRefObject} from 'react';
import {useEffect} from 'react';

type Options = IntersectionObserverInit & {
    target: MutableRefObject<Element | null>;
    onIntersect: (entry: IntersectionObserverEntry) => void;
    enabled?: boolean;
};

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
