import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/componentes/button';
import {useCan, type Permission} from '@/hooks/useCan';
import * as styles from './styles';

interface FormActionsProps {
    onCancel?: () => void;
    onSubmit?: () => void;
    isSubmitting?: boolean;
    isDirty?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    submitType?: 'submit' | 'button';
    submitPermission?: Permission;
}

export function FormActions({
    onCancel,
    onSubmit,
    isSubmitting = false,
    isDirty = true,
    submitLabel,
    cancelLabel,
    submitType = 'submit',
    submitPermission,
}: FormActionsProps) {
    const {t} = useTranslation();
    const allowed = useCan(submitPermission ? {has: submitPermission} : undefined);
    const submitDisabled = !isDirty || isSubmitting || !allowed;

    return (
        <div className={styles.root}>
            {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    {cancelLabel ?? t('actions.cancel')}
                </Button>
            )}
            <Button
                type={submitType}
                onClick={submitType === 'button' ? onSubmit : undefined}
                disabled={submitDisabled}
            >
                {submitLabel ?? t('actions.save')}
            </Button>
        </div>
    );
}
