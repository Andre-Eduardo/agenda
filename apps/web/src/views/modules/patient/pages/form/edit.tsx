import { createFileRoute, useParams } from '@tanstack/react-router';
import { useGetPatient } from '@agenda-app/client';
import type { Patient } from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { EmptyState } from '../../../../components/EmptyState';
import { PatientForm } from '../../components/PatientForm';

export const Route = createFileRoute('/_stackedLayout/patients/$patientId/edit')({
  component: EditPatientPage,
});

function EditPatientPage() {
  const { patientId } = useParams({ from: '/_stackedLayout/patients/$patientId/edit' });
  const { data, isLoading } = useGetPatient(patientId);
  const patient = data as unknown as Patient | undefined;

  if (isLoading) return <LoadingSkeleton rows={4} height={56} />;
  if (!patient) return <EmptyState icon="error" title="Paciente não encontrado" />;

  return (
    <Page title={`Editar: ${patient.name}`} subtitle={`Documento: ${patient.documentId}`}>
      <PatientForm patient={patient} />
    </Page>
  );
}
