import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { Box, Grid, TextInput, Textarea, Select } from '@mantine/core';
import { useCreateRecord, useUpdateRecord } from '@agenda-app/client';
import { FormActions } from '../../../components/FormActions';

const schema = z.object({
  attendanceType: z.string().min(1),
  clinicalStatus: z.string().optional().nullable(),
  eventDate: z.string().min(1),
  subjective: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  assessment: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  freeNotes: z.string().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  patientId: string;
  record?: any;
}

export function RecordForm({ patientId, record }: Props) {
  const navigate = useNavigate();
  const isEdit = !!record;

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      attendanceType: record?.attendanceType ?? 'CONSULTATION',
      clinicalStatus: record?.clinicalStatus ?? '',
      eventDate: record?.eventDate ? new Date(record.eventDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      subjective: record?.subjective ?? '',
      objective: record?.objective ?? '',
      assessment: record?.assessment ?? '',
      plan: record?.plan ?? '',
      freeNotes: record?.freeNotes ?? '',
    },
  });

  const createMutation = useCreateRecord();
  const updateMutation = useUpdateRecord();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit((data) => {
    const payload = {
      patientId,
      attendanceType: data.attendanceType,
      clinicalStatus: data.clinicalStatus || null,
      eventDate: new Date(data.eventDate).toISOString(),
      subjective: data.subjective || null,
      objective: data.objective || null,
      assessment: data.assessment || null,
      plan: data.plan || null,
      freeNotes: data.freeNotes || null,
    };
    if (isEdit) {
      updateMutation.mutate(
        { id: record.id, data: payload as any },
        { onSuccess: () => navigate({ to: '/patients/$patientId', params: { patientId } }) },
      );
    } else {
      createMutation.mutate(
        { data: payload as any },
        { onSuccess: () => navigate({ to: '/patients/$patientId', params: { patientId } }) },
      );
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Box style={{ backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Tipo de atendimento"
              value={watch('attendanceType')}
              onChange={(v) => setValue('attendanceType', v ?? '', { shouldDirty: true })}
              data={[
                { value: 'CONSULTATION', label: 'Consulta' },
                { value: 'EMERGENCY', label: 'Emergência' },
                { value: 'FOLLOW_UP', label: 'Retorno' },
                { value: 'TELEMEDICINE', label: 'Telemedicina' },
              ]}
              required
              error={errors.attendanceType?.message}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput label="Data do evento" type="datetime-local" required {...register('eventDate')} error={errors.eventDate?.message} />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea label="Subjetivo (S)" minRows={3} {...register('subjective')} />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea label="Objetivo (O)" minRows={3} {...register('objective')} />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea label="Avaliação (A)" minRows={3} {...register('assessment')} />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea label="Plano (P)" minRows={3} {...register('plan')} />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea label="Notas livres" minRows={2} {...register('freeNotes')} />
          </Grid.Col>
        </Grid>
        <FormActions
          isSubmitting={isSubmitting}
          isDirty={isDirty || !isEdit}
          onCancel={() => navigate({ to: '/patients/$patientId', params: { patientId } })}
        />
      </Box>
    </form>
  );
}
