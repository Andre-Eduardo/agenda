import { createFileRoute } from '@tanstack/react-router';
import { Page } from '../../../../components/Page';
import { PatientForm } from '../../components/PatientForm';

export const Route = createFileRoute('/_stackedLayout/patients/new')({
  component: NewPatientPage,
});

function NewPatientPage() {
  return (
    <Page title="Novo paciente" subtitle="Preencha os dados básicos. Perfil clínico e alertas ficam disponíveis após salvar.">
      <PatientForm />
    </Page>
  );
}
