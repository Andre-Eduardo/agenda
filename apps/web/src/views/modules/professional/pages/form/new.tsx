import { createFileRoute } from '@tanstack/react-router';
import { Page } from '../../../../components/Page';
import { ProfessionalForm } from '../../components/ProfessionalForm';

export const Route = createFileRoute('/_stackedLayout/professionals/new')({
  component: NewProfessionalPage,
});

function NewProfessionalPage() {
  return (
    <Page title="Novo profissional">
      <ProfessionalForm />
    </Page>
  );
}
