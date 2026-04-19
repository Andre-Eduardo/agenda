import { Modal, Text, Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title={title ?? t('confirm.deleteTitle')}
      centered
      size="sm"
    >
      <Text size="sm" mb="lg">
        {message ?? t('confirm.deleteMessage')}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel} disabled={isLoading}>
          {cancelLabel ?? t('actions.cancel')}
        </Button>
        <Button
          color={danger ? 'danger' : 'brand'}
          onClick={onConfirm}
          loading={isLoading}
        >
          {confirmLabel ?? t('actions.confirm')}
        </Button>
      </Group>
    </Modal>
  );
}
