import {useCallback, useEffect, useRef} from 'react';
import IMask, {type InputMask, type FactoryArg} from 'imask';

type UseIMaskOptions<Opts extends FactoryArg> = {
    onAccept?: (value: string, unmasked: string, mask: InputMask<Opts>) => void;
    onComplete?: (value: string, unmasked: string, mask: InputMask<Opts>) => void;
};

export function useIMask<Opts extends FactoryArg>(
    opts: Opts | undefined,
    {onAccept, onComplete}: UseIMaskOptions<Opts> = {}
) {
    const maskRef = useRef<InputMask<Opts> | null>(null);

    const setRef = useCallback(
        (node: HTMLInputElement | null) => {
            if (!node || !opts) {
                return;
            }

            if (maskRef.current) {
                maskRef.current.destroy();
                maskRef.current = null;
            }

            const mask = IMask(node, opts);

            maskRef.current = mask;

            mask.on('accept', () => {
                onAccept?.(mask.value, mask.unmaskedValue, mask);
            });

            mask.on('complete', () => {
                onComplete?.(mask.value, mask.unmaskedValue, mask);
            });
        },
        [opts, onAccept, onComplete]
    );

    useEffect(() => {
        return () => {
            maskRef.current?.destroy();
            maskRef.current = null;
        };
    }, []);

    return {
        ref: setRef,
        maskRef,
    };
}
