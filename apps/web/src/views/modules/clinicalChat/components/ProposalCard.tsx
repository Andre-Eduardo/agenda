import { useState } from 'react';
import { Box, Text, Button, Group, Badge, Stack } from '@mantine/core';
import { useListPending } from '@agenda-app/client';
import { ProposalConfirmDialog, type ProposalSummary } from './ProposalConfirmDialog';

interface ProposalCardProps {
  proposalIds: string[];
}

const PROPOSAL_TYPE_LABELS: Record<string, string> = {
  APPOINTMENT: 'Agendamento',
  APPOINTMENT_CANCEL: 'Cancelamento de consulta',
  APPOINTMENT_RESCHEDULE: 'Remarcação de consulta',
  PATIENT_ALERT: 'Alerta do paciente',
};

export function ProposalCard({ proposalIds }: ProposalCardProps) {
  const [selectedProposal, setSelectedProposal] = useState<ProposalSummary | null>(null);
  const { data } = useListPending();
  const proposals = (data as unknown as ProposalSummary[] | undefined) ?? [];
  const relevantProposals = proposals.filter((p) => proposalIds.includes(p.id));

  if (relevantProposals.length === 0) return null;

  return (
    <>
      <Stack gap="xs" mt={6}>
        {relevantProposals.map((proposal) => (
          <Box
            key={proposal.id}
            style={{
              border: '1px solid var(--mantine-color-blue-3)',
              borderRadius: 8,
              padding: '10px 14px',
              backgroundColor: 'var(--mantine-color-blue-0)',
            }}
            role="region"
            aria-label={`Proposta: ${PROPOSAL_TYPE_LABELS[proposal.type] ?? proposal.type}`}
          >
            <Group justify="space-between" mb={4}>
              <Badge variant="light" color="blue" size="sm">
                {PROPOSAL_TYPE_LABELS[proposal.type] ?? proposal.type}
              </Badge>
              {proposal.confidence !== null && (
                <Text size="xs" c="dimmed">
                  Confiança: {Math.round(proposal.confidence * 100)}%
                </Text>
              )}
            </Group>

            <Stack gap={2} mb={8}>
              {Object.entries(proposal.preview)
                .filter(([, v]) => v !== null && v !== undefined)
                .slice(0, 4)
                .map(([key, value]) => (
                  <Group key={key} gap={4}>
                    <Text size="xs" c="dimmed" style={{ minWidth: 90, textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                    </Text>
                    <Text size="xs">{String(value)}</Text>
                  </Group>
                ))}
            </Stack>

            <Group gap="xs">
              <Button
                size="xs"
                color="green"
                variant="light"
                onClick={() => setSelectedProposal(proposal)}
                aria-label={`Revisar proposta de ${PROPOSAL_TYPE_LABELS[proposal.type] ?? proposal.type}`}
              >
                Revisar e confirmar
              </Button>
            </Group>
          </Box>
        ))}
      </Stack>

      <ProposalConfirmDialog
        proposal={selectedProposal}
        opened={selectedProposal !== null}
        onClose={() => setSelectedProposal(null)}
      />
    </>
  );
}
