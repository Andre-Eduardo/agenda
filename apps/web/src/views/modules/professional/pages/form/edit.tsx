import { createFileRoute, useParams } from '@tanstack/react-router';
import { useGetProfessional } from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { EmptyState } from '../../../../components/EmptyState';
import { ProfessionalForm } from '../../components/ProfessionalForm';

export const Route = createFileRoute('/_stackedLayout/professionals/$professionalId/edit')({
  component: EditProfessionalPage,
});

function EditProfessionalPage() {
  const { professionalId } = useParams({ from: '/_stackedLayout/professionals/$professionalId/edit' });
  const { data, isLoading } = useGetProfessional(professionalId);
  const pro = data as any;
  if (isLoading) return <LoadingSkeleton rows={3} />;
  if (!pro) return <EmptyState icon="error" title="Profissional não encontrado" />;
  return (
    <Page title={`Editar: ${pro.name}`}>
      <ProfessionalForm professional={pro} />
    </Page>
  );
}
