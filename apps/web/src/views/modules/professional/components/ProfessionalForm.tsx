import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { Box, Grid, TextInput } from '@mantine/core';
import { useCreateProfessional, useUpdateProfessional } from '@agenda-app/client';
import { FormActions } from '../../../components/FormActions';

const schema = z.object({
  name: z.string().min(1),
  documentId: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

export function ProfessionalForm({ professional }: { professional?: any }) {
  const navigate = useNavigate();
  const isEdit = !!professional;

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: professional?.name ?? '',
      documentId: professional?.documentId ?? '',
      email: professional?.email ?? '',
      phone: professional?.phone ?? '',
    },
  });

  const createMutation = useCreateProfessional();
  const updateMutation = useUpdateProfessional();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit((data) => {
    const payload = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
    };
    if (isEdit) {
      updateMutation.mutate(
        { id: professional.id, data: payload as any },
        { onSuccess: () => navigate({ to: '/professionals' }) },
      );
    } else {
      createMutation.mutate(
        { data: payload as any },
        { onSuccess: () => navigate({ to: '/professionals' }) },
      );
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Box style={{ backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Nome" required {...register('name')} error={errors.name?.message} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Documento" required {...register('documentId')} error={errors.documentId?.message} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Email" type="email" {...register('email')} error={errors.email?.message} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Telefone" {...register('phone')} />
          </Grid.Col>
        </Grid>
        <FormActions
          isSubmitting={isSubmitting}
          isDirty={isDirty || !isEdit}
          onCancel={() => navigate({ to: '/professionals' })}
        />
      </Box>
    </form>
  );
}
