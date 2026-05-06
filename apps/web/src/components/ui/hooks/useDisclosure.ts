import {useCallback, useState} from 'react';
import {useCallbackRef} from './useCallbackRef';

export interface UseDisclosureProps {
    isOpen?: boolean;
    defaultIsOpen?: boolean;
    onClose?: () => void;
    onOpen?: () => void;
    onToggle?: (isOpen: boolean) => void;
}

export type DisclosureReturn = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
};

/**
 * Manages the opening state of a disclosure component.
 */
export function useDisclosure(props: UseDisclosureProps = {}): DisclosureReturn {
    const {onClose: onCloseProp, onOpen: onOpenProp, onToggle: onToggleProp, isOpen: isOpenProp} = props;

    const handleOpen = useCallbackRef(onOpenProp);
    const handleClose = useCallbackRef(onCloseProp);
    const handleToggle = useCallbackRef(onToggleProp);

    const [isOpenState, setIsOpen] = useState(props.defaultIsOpen ?? false);

    const isOpen = isOpenProp ?? isOpenState;

    const onClose = useCallback(() => {
        setIsOpen(false);

        if (handleClose) {
            handleClose();
        }

        if (handleToggle) {
            handleToggle(false);
        }
    }, [handleClose, handleToggle]);

    const onOpen = useCallback(() => {
        setIsOpen(true);

        if (handleOpen) {
            handleOpen();
        }

        if (handleToggle) {
            handleToggle(true);
        }
    }, [handleOpen, handleToggle]);

    const onToggle = useCallback(() => {
        if (isOpen) {
            onClose();
        } else {
            onOpen();
        }
    }, [isOpen, onOpen, onClose]);

    return {
        isOpen,
        open: onOpen,
        close: onClose,
        toggle: onToggle,
    };
}

export type UseDisclosureReturn = ReturnType<typeof useDisclosure>;
