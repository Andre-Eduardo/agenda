import { createFileRoute, useParams } from '@tanstack/react-router';
import { Page } from '../../../../components/Page';
import { RecordForm } from '../../components/RecordForm';

export const Route = createFileRoute('/_stackedLayout/patients/$patientId/records/new')({
  component: NewRecordPage,
});

function NewRecordPage() {
  const { patientId } = useParams({ from: '/_stackedLayout/patients/$patientId/records/new' });
  return (
    <Page title="Nova evolução clínica" subtitle="Formato SOAP">
      <RecordForm patientId={patientId} />
    </Page>
  );
}
