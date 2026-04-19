import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { Box, Grid, TextInput, Select } from '@mantine/core';
import { useCreatePatient, useUpdatePatient } from '@agenda-app/client';
import type { Patient } from '@agenda-app/client';
import { FormActions } from '../../../components/FormActions';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  documentId: z.string().min(1, 'Documento obrigatório'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().or(z.literal('')).nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface PatientFormProps {
  patient?: Patient;
}

export function PatientForm({ patient }: PatientFormProps) {
  const navigate = useNavigate();
  const isEdit = !!patient;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: (patient?.name as any) ?? '',
      documentId: (patient?.documentId as any) ?? '',
      phone: (patient?.phone as any) ?? '',
      email: (patient?.email as any) ?? '',
      gender: (patient?.gender as any) ?? null,
      birthDate: (patient?.birthDate as any) ?? '',
      emergencyContactName: (patient?.emergencyContactName as any) ?? '',
      emergencyContactPhone: (patient?.emergencyContactPhone as any) ?? '',
    },
  });

  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit((data) => {
    const payload = {
      ...data,
      phone: data.phone || null,
      email: data.email || null,
      birthDate: data.birthDate || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
    };

    if (isEdit && patient) {
      updateMutation.mutate(
        { id: patient.id, data: payload as any },
        {
          onSuccess: () => navigate({ to: '/patients/$patientId', params: { patientId: patient.id } }),
        },
      );
    } else {
      createMutation.mutate(
        { data: payload as any },
        {
          onSuccess: (created: any) => {
            if (created?.id) navigate({ to: '/patients/$patientId/edit', params: { patientId: created.id } });
            else navigate({ to: '/patients' });
          },
        },
      );
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Box style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Nome completo" required {...register('name')} error={errors.name?.message} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="CPF / Documento" required {...register('documentId')} error={errors.documentId?.message} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Telefone" {...register('phone')} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Email" type="email" {...register('email')} error={errors.email?.message} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Gênero"
              value={watch('gender') ?? null}
              onChange={(v) => setValue('gender', v as any, { shouldDirty: true })}
              data={[
                { value: 'MALE', label: 'Masculino' },
                { value: 'FEMALE', label: 'Feminino' },
                { value: 'OTHER', label: 'Outro' },
              ]}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Data de nascimento" type="date" {...register('birthDate')} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Contato de emergência (nome)" {...register('emergencyContactName')} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Contato de emergência (telefone)" {...register('emergencyContactPhone')} />
          </Grid.Col>
        </Grid>

        <FormActions
          isSubmitting={isSubmitting}
          isDirty={isDirty || !isEdit}
          onCancel={() => navigate({ to: '/patients' })}
        />
      </Box>
    </form>
  );
}
