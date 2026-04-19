import { Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';

interface FormActionsProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  isDirty?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  submitType?: 'submit' | 'button';
}

export function FormActions({
  onCancel,
  onSubmit,
  isSubmitting = false,
  isDirty = true,
  submitLabel,
  cancelLabel,
  submitType = 'submit',
}: FormActionsProps) {
  const { t } = useTranslation();
  return (
    <Group justify="flex-end" mt="xl">
      {onCancel && (
        <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
          {cancelLabel ?? t('actions.cancel')}
        </Button>
      )}
      <Button
        type={submitType}
        onClick={submitType === 'button' ? onSubmit : undefined}
        loading={isSubmitting}
        disabled={!isDirty || isSubmitting}
      >
        {submitLabel ?? t('actions.save')}
      </Button>
    </Group>
  );
}
