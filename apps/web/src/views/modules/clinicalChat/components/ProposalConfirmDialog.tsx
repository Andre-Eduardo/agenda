import { useState } from 'react';
import { Modal, Text, Button, Group, Textarea, Stack, Badge } from '@mantine/core';
import { useConfirm, useReject } from '@agenda-app/client';
import { useQueryClient } from '@tanstack/react-query';
import { getListPendingQueryKey } from '@agenda-app/client';

export type ProposalSummary = {
  id: string;
  type: string;
  status: string;
  patientId: string | null;
  preview: Record<string, unknown>;
  confidence: number | null;
  expiresAt: string | null;
  createdAt: string;
};

interface ProposalConfirmDialogProps {
  proposal: ProposalSummary | null;
  opened: boolean;
  onClose: () => void;
}

export function ProposalConfirmDialog({ proposal, opened, onClose }: ProposalConfirmDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<'confirm' | 'reject'>('confirm');

  const confirmMutation = useConfirm({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPendingQueryKey() });
        onClose();
      },
    },
  });

  const rejectMutation = useReject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPendingQueryKey() });
        onClose();
        setReason('');
      },
    },
  });

  if (!proposal) return null;

  const isLoading = confirmMutation.isPending || rejectMutation.isPending;

  const previewEntries = Object.entries(proposal.preview).filter(
    ([, v]) => v !== null && v !== undefined,
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'confirm' ? 'Confirmar proposta' : 'Rejeitar proposta'}
      centered
      size="sm"
      trapFocus
    >
      <Stack gap="md">
        <Badge variant="light" color="blue" aria-label={`Tipo: ${proposal.type}`}>
          {proposal.type.replace(/_/g, ' ')}
        </Badge>

        <Stack gap={4}>
          {previewEntries.map(([key, value]) => (
            <Group key={key} gap={6}>
              <Text size="xs" c="dimmed" style={{ minWidth: 100, textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
              </Text>
              <Text size="xs">{String(value)}</Text>
            </Group>
          ))}
        </Stack>

        {mode === 'reject' && (
          <Textarea
            label="Motivo da rejeição (opcional)"
            placeholder="Descreva o motivo..."
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            maxLength={500}
            autosize
            minRows={2}
            aria-label="Motivo da rejeição"
          />
        )}

        {mode === 'confirm' ? (
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => { setMode('reject'); }}
              disabled={isLoading}
              aria-label="Rejeitar proposta"
            >
              Rejeitar
            </Button>
            <Button
              color="green"
              loading={confirmMutation.isPending}
              onClick={() => confirmMutation.mutate({ id: proposal.id })}
              aria-label="Confirmar proposta"
            >
              Confirmar
            </Button>
          </Group>
        ) : (
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setMode('confirm')} disabled={isLoading}>
              Voltar
            </Button>
            <Button
              color="red"
              loading={rejectMutation.isPending}
              onClick={() =>
                rejectMutation.mutate({ id: proposal.id, data: { reason } })
              }
              aria-label="Confirmar rejeição"
            >
              Confirmar rejeição
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
}
