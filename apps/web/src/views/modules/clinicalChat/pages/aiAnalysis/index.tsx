import { createFileRoute, useParams } from '@tanstack/react-router';
import { Box, Stack, Text, Title } from '@mantine/core';
import { useListSessions, useGetSnapshot } from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { EmptyState } from '../../../../components/EmptyState';

export const Route = createFileRoute('/_stackedLayout/patients/$patientId/ai-analysis')({
  component: AiAnalysisPage,
});

function AiAnalysisPage() {
  const { patientId } = useParams({ from: '/_stackedLayout/patients/$patientId/ai-analysis' });

  const { data: sessionsData } = useListSessions({
    patientId,
    professionalId: '',
    status: 'OPEN' as any,
    cursor: null,
    limit: 1,
    sort: null,
  } as any);
  const session = ((sessionsData as any)?.items ?? [])[0];

  const { data: snapshot, isLoading } = useGetSnapshot(session?.id ?? '', {
    query: { enabled: !!session?.id },
  } as any);

  if (!session) return <EmptyState icon="psychology" title="Sem sessão ativa" message="Abra o Chat Clínico primeiro." />;
  if (isLoading) return <LoadingSkeleton rows={4} height={80} />;
  if (!snapshot) return <EmptyState icon="psychology" title="Análise indisponível" message="Ainda não há snapshot estruturado." />;

  const snap = snapshot as any;

  return (
    <Page title="Análise IA Estruturada" subtitle="Snapshot da sessão clínica">
      <Stack gap="md">
        {Object.entries(snap).map(([key, value]) => (
          <Box key={key} style={{ backgroundColor: 'white', borderRadius: 10, padding: 16 }}>
            <Title order={4} mb="xs" style={{ textTransform: 'capitalize' }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </Title>
            {typeof value === 'string' ? (
              <Text size="sm">{value}</Text>
            ) : (
              <pre style={{ fontSize: 12, overflow: 'auto', margin: 0 }}>
                {JSON.stringify(value, null, 2)}
              </pre>
            )}
          </Box>
        ))}
      </Stack>
    </Page>
  );
}
