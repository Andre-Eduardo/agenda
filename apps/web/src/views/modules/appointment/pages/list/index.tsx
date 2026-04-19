import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Box, Table, Badge, Button, Group, Text, Modal, TextInput, Textarea, Select } from '@mantine/core';
import { useSearchAppointments, useCancelAppointment, useCreateAppointment, useSearchPatients, useSearchProfessionals } from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { ListToolbar } from '../../../../components/ListToolbar';
import { EmptyState } from '../../../../components/EmptyState';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import type { PaginatedResult } from '../../../../../utils/apiTypes';

export const Route = createFileRoute('/_stackedLayout/appointments')({
  component: AppointmentListPage,
});

function AppointmentListPage() {
  const [term, setTerm] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, refetch } = useSearchAppointments({
    term,
    cursor: null,
    limit: 50,
    sort: null,
  } as any);

  const items = ((data as unknown as PaginatedResult<any> | undefined)?.items ?? []) as any[];
  const cancelMutation = useCancelAppointment();

  const onConfirmCancel = () => {
    if (!cancelTarget) return;
    cancelMutation.mutate(
      { id: cancelTarget, data: { reason: cancelReason || 'Cancelado' } } as any,
      {
        onSuccess: () => {
          setCancelTarget(null);
          setCancelReason('');
          refetch();
        },
      },
    );
  };

  return (
    <Page
      title="Consultas"
      subtitle="Agenda médica"
      actions={
        <Button
          leftSection={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>}
          onClick={() => setNewOpen(true)}
        >
          Nova consulta
        </Button>
      }
    >
      <ListToolbar searchValue={term} onSearchChange={setTerm} searchPlaceholder="Buscar por observação" />

      <Box style={{ backgroundColor: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--mantine-shadow-sm)' }}>
        {isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : items.length === 0 ? (
          <EmptyState icon="calendar_month" title="Sem consultas" message="Nenhuma consulta encontrada." />
        ) : (
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Data</Table.Th>
                <Table.Th>Paciente</Table.Th>
                <Table.Th>Profissional</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((a) => (
                <Table.Tr key={a.id}>
                  <Table.Td><Text size="sm">{a.startAt ? new Date(a.startAt).toLocaleString("pt-BR") : "—"}</Text></Table.Td>
                  <Table.Td><Text size="sm">{a.patientId?.slice(0, 8) ?? "—"}</Text></Table.Td>
                  <Table.Td><Text size="sm">{a.professionalId?.slice(0, 8) ?? "—"}</Text></Table.Td>
                  <Table.Td><Badge variant="light">{a.type ?? "—"}</Badge></Table.Td>
                  <Table.Td>
                    <Badge color={a.status === 'CANCELED' ? 'danger' : a.status === 'COMPLETED' ? 'green' : 'brand'}>
                      {a.status ?? '—'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {a.status !== 'CANCELED' && (
                      <Button size="xs" variant="subtle" color="danger" onClick={() => setCancelTarget(a.id)}>
                        Cancelar
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Box>

      <AppointmentModal opened={newOpen} onClose={() => setNewOpen(false)} onCreated={() => { setNewOpen(false); refetch(); }} />

      <Modal
        opened={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Cancelar consulta"
        centered
      >
        <Textarea
          label="Motivo"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.currentTarget.value)}
          minRows={3}
          required
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setCancelTarget(null)}>Voltar</Button>
          <Button color="danger" loading={cancelMutation.isPending} onClick={onConfirmCancel} disabled={!cancelReason.trim()}>
            Confirmar cancelamento
          </Button>
        </Group>
      </Modal>
    </Page>
  );
}

function AppointmentModal({ opened, onClose, onCreated }: { opened: boolean; onClose: () => void; onCreated: () => void }) {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [startAt, setStartAt] = useState('');
  const [type, setType] = useState<string | null>('IN_PERSON');
  const [note, setNote] = useState('');

  const { data: patientsData } = useSearchPatients({ term: '', cursor: null, limit: 50, sort: null } as any);
  const { data: profData } = useSearchProfessionals({ term: '', cursor: null, limit: 50, sort: null } as any);

  const patients = ((patientsData as any)?.items ?? []) as any[];
  const professionals = ((profData as any)?.items ?? []) as any[];
  const createMutation = useCreateAppointment();

  const onSubmit = () => {
    if (!patientId || !professionalId || !startAt || !type) return;
    createMutation.mutate(
      {
        data: {
          patientId,
          professionalId,
          startAt: new Date(startAt).toISOString(),
          type,
          note: note || null,
        },
      } as any,
      { onSuccess: () => onCreated() },
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Nova consulta" centered size="md">
      <Select
        label="Paciente"
        data={patients.map((p) => ({ value: p.id, label: p.name }))}
        value={patientId}
        onChange={setPatientId}
        searchable
        required
        mb="sm"
      />
      <Select
        label="Profissional"
        data={professionals.map((p) => ({ value: p.id, label: p.name }))}
        value={professionalId}
        onChange={setProfessionalId}
        searchable
        required
        mb="sm"
      />
      <TextInput
        label="Data e hora"
        type="datetime-local"
        value={startAt}
        onChange={(e) => setStartAt(e.currentTarget.value)}
        required
        mb="sm"
      />
      <Select
        label="Tipo"
        data={[
          { value: 'IN_PERSON', label: 'Presencial' },
          { value: 'TELEMEDICINE', label: 'Telemedicina' },
        ]}
        value={type}
        onChange={setType}
        mb="sm"
      />
      <Textarea label="Observações" value={note} onChange={(e) => setNote(e.currentTarget.value)} mb="md" />
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        <Button loading={createMutation.isPending} onClick={onSubmit}>Criar</Button>
      </Group>
    </Modal>
  );
}
