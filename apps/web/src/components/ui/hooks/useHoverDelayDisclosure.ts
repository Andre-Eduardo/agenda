import {useCallback, useEffect, useRef} from 'react';
import {useCallbackRef} from './useCallbackRef';

export interface UseHoverDelayDisclosureProps {
    /** Delay in ms before closing */
    closeDelay?: number;
    /** Duration o f the skip delay window for quick navigation between items */
    skipDelay?: number;
    /** Callback when close is triggered */
    onClose?: () => void;
}

/**
 * Manages hover-based close behavior with configurable delay.
 * Supports:
 * - Close delay before hiding
 * - Skip delay window for quick navigation between items
 * - Cancel close on re-enter
 */
export function useHoverDelayDisclosure({
    closeDelay = 500,
    skipDelay = 300,
    onClose,
}: UseHoverDelayDisclosureProps = {}) {
    const handleClose = useCallbackRef(onClose);

    const closeTimer = useRef<number | null>(null);
    const skipDelayTimer = useRef<number | null>(null);
    const isInSkipDelayWindow = useRef(false);

    const clearTimer = useCallback((timer: number | null) => {
        if (timer != null) {
            window.clearTimeout(timer);
        }
    }, []);

    const clearCloseTimer = useCallback(() => {
        clearTimer(closeTimer.current);
        closeTimer.current = null;
    }, [clearTimer]);

    const clearSkipDelayTimer = useCallback(() => {
        clearTimer(skipDelayTimer.current);
        skipDelayTimer.current = null;
    }, [clearTimer]);

    const clearAll = useCallback(() => {
        clearCloseTimer();
        clearSkipDelayTimer();
    }, [clearCloseTimer, clearSkipDelayTimer]);

    useEffect(() => clearAll, [clearAll]);

    const startSkipDelayWindow = useCallback(() => {
        clearSkipDelayTimer();
        isInSkipDelayWindow.current = true;
        skipDelayTimer.current = window.setTimeout(() => {
            isInSkipDelayWindow.current = false;
            skipDelayTimer.current = null;
        }, skipDelay);
    }, [clearSkipDelayTimer, skipDelay]);

    const cancelClose = useCallback(() => {
        clearCloseTimer();
    }, [clearCloseTimer]);

    const scheduleClose = useCallback(() => {
        clearCloseTimer();
        closeTimer.current = window.setTimeout(() => {
            handleClose?.();
            closeTimer.current = null;
            // After closing, maintain quick navigation mode for a while
            startSkipDelayWindow();
        }, closeDelay);
    }, [clearCloseTimer, closeDelay, handleClose, startSkipDelayWindow]);

    const getBoundaryProps = useCallback(
        () =>
            ({
                onPointerEnter: () => cancelClose(),
                onPointerLeave: (e: React.PointerEvent) => {
                    const next = e.relatedTarget as Node | null;

                    // Still inside the boundary
                    if (next && (e.currentTarget as Element).contains(next)) return;
                    scheduleClose();
                },
                onFocusCapture: () => {
                    cancelClose();
                },
                onBlurCapture: (e: React.FocusEvent) => {
                    const next = e.relatedTarget as Node | null;

                    if (next && (e.currentTarget as Element).contains(next)) return;
                    scheduleClose();
                },
            }) as const,
        [cancelClose, scheduleClose]
    );

    return {
        cancelClose,
        scheduleClose,
        getBoundaryProps,
    };
}

export type UseHoverDelayDisclosureReturn = ReturnType<typeof useHoverDelayDisclosure>;
