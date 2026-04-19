import { createFileRoute, useParams } from '@tanstack/react-router';
import { useGetRecord } from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { EmptyState } from '../../../../components/EmptyState';
import { RecordForm } from '../../components/RecordForm';

export const Route = createFileRoute('/_stackedLayout/patients/$patientId/records/$recordId/edit')({
  component: EditRecordPage,
});

function EditRecordPage() {
  const { patientId, recordId } = useParams({ from: '/_stackedLayout/patients/$patientId/records/$recordId/edit' });
  const { data, isLoading } = useGetRecord(recordId);
  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (!data) return <EmptyState icon="error" title="Evolução não encontrada" />;
  return (
    <Page title="Editar evolução">
      <RecordForm patientId={patientId} record={data as any} />
    </Page>
  );
}
