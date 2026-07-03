import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/componentes/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/componentes/dialog';
import {css} from '@/styled-system/css';

interface ConfirmDialogProps {
    opened: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ConfirmDialog({
    opened,
    title,
    message,
    confirmLabel,
    cancelLabel,
    danger = false,
    onConfirm,
    onCancel,
    isLoading = false,
}: ConfirmDialogProps) {
    const {t} = useTranslation();

    return (
        <Dialog open={opened} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className={css({sm: {maxW: 'md'}})}>
                <DialogHeader>
                    <DialogTitle>{title ?? t('confirm.deleteTitle')}</DialogTitle>
                    <DialogDescription>{message ?? t('confirm.deleteMessage')}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        {cancelLabel ?? t('actions.cancel')}
                    </Button>
                    <Button
                        type="button"
                        variant={danger ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {confirmLabel ?? t('actions.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
