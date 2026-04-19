import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { Box, Tabs, Text, Button, Group, Stack, Badge } from '@mantine/core';
import { useGetPatient, useSearchRecords, useSearchPatientAlerts, useGetClinicalProfile } from '@agenda-app/client';
import type { Patient, Record as ClinicalRecord, PatientAlert } from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { EmptyState } from '../../../../components/EmptyState';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import type { PaginatedResult } from '../../../../../utils/apiTypes';

export const Route = createFileRoute('/_stackedLayout/patients/$patientId')({
  component: PatientDetailPage,
});

function PatientDetailPage() {
  const { patientId } = useParams({ from: '/_stackedLayout/patients/$patientId' });
  const { data: patientData, isLoading } = useGetPatient(patientId);
  const patient = patientData as unknown as Patient | undefined;

  if (isLoading) return <LoadingSkeleton rows={3} height={64} />;
  if (!patient) return <EmptyState icon="error" title="Paciente não encontrado" />;

  return (
    <Page
      title={patient.name}
      subtitle={`Documento: ${patient.documentId}`}
      actions={
        <>
          <Button component={Link} to="/patients/$patientId/edit" params={{ patientId } as any} variant="default">
            Editar
          </Button>
          <Button component={Link} to="/patients/$patientId/chat" params={{ patientId } as any} variant="default">
            Chat IA
          </Button>
          <Button component={Link} to="/patients/$patientId/records/new" params={{ patientId } as any}>
            Nova evolução
          </Button>
        </>
      }
    >
      <Tabs defaultValue="records" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="records">Prontuário</Tabs.Tab>
          <Tabs.Tab value="profile">Perfil clínico</Tabs.Tab>
          <Tabs.Tab value="alerts">Alertas</Tabs.Tab>
          <Tabs.Tab value="forms">Formulários</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="records" pt="md">
          <RecordsSubTab patientId={patientId} />
        </Tabs.Panel>
        <Tabs.Panel value="profile" pt="md">
          <ClinicalProfileSubTab patientId={patientId} />
        </Tabs.Panel>
        <Tabs.Panel value="alerts" pt="md">
          <AlertsSubTab patientId={patientId} />
        </Tabs.Panel>
        <Tabs.Panel value="forms" pt="md">
          <EmptyState
            icon="description"
            title="Formulários do paciente"
            message="Abra um formulário a partir do link direto ou adicione templates no módulo Formulários."
          />
        </Tabs.Panel>
      </Tabs>
    </Page>
  );
}

function RecordsSubTab({ patientId }: { patientId: string }) {
  const { data, isLoading } = useSearchRecords({
    patientId,
    cursor: null,
    limit: 20,
    sort: null,
  } as any);
  const page = data as unknown as PaginatedResult<ClinicalRecord> | undefined;
  const items = page?.items ?? [];

  if (isLoading) return <LoadingSkeleton rows={3} height={80} />;
  if (items.length === 0)
    return <EmptyState icon="description" title="Sem evoluções" message="Registre a primeira evolução SOAP" />;

  return (
    <Stack gap="sm">
      {items.map((r: any) => (
        <Box
          key={r.id}
          style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 16,
            boxShadow: 'var(--mantine-shadow-xs)',
          }}
        >
          <Group justify="space-between">
            <Text fw={600}>{r.attendanceType ?? 'Evolução'}</Text>
            <Badge variant="light">{r.clinicalStatus ?? ""}</Badge>
          </Group>
          <Text size="xs" c="brand.4" mt={4}>
            {r.eventDate ? new Date(r.eventDate).toLocaleString('pt-BR') : ''}
          </Text>
          {r.subjective && <Text size="sm" mt="xs">{r.subjective}</Text>}
        </Box>
      ))}
    </Stack>
  );
}

function ClinicalProfileSubTab({ patientId }: { patientId: string }) {
  const { data, isLoading } = useGetClinicalProfile(patientId);
  if (isLoading) return <LoadingSkeleton rows={2} height={100} />;
  const profile = data as any;
  if (!profile || Object.keys(profile).length === 0)
    return <EmptyState icon="person" title="Perfil clínico vazio" message="Ainda não há informações clínicas cadastradas." />;
  return (
    <Box
      style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        boxShadow: 'var(--mantine-shadow-xs)',
      }}
    >
      <pre style={{ fontSize: 12, overflow: 'auto' }}>{JSON.stringify(profile, null, 2)}</pre>
    </Box>
  );
}

function AlertsSubTab({ patientId }: { patientId: string }) {
  const { data, isLoading } = useSearchPatientAlerts(patientId, { limit: 50 } as any);
  const page = data as unknown as { items: PatientAlert[] } | PatientAlert[] | undefined;
  const items = Array.isArray(page) ? page : (page?.items ?? []);
  if (isLoading) return <LoadingSkeleton rows={2} height={72} />;
  if (items.length === 0)
    return <EmptyState icon="notification_important" title="Sem alertas" message="Nenhum alerta clínico cadastrado." />;
  return (
    <Stack gap="sm">
      {items.map((a: any) => (
        <Box key={a.id} style={{ backgroundColor: 'white', borderRadius: 8, padding: 14 }}>
          <Group justify="space-between">
            <Text fw={600}>{a.title ?? a.type}</Text>
            <Badge color="danger">{a.severity ?? "info"}</Badge>
          </Group>
          {a.description && <Text size="sm" mt={4}>{a.description}</Text>}
        </Box>
      ))}
    </Stack>
  );
}
