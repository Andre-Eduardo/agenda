import { useEffect, useRef, useState } from 'react';
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import { Box, Stack, TextInput, Textarea, Select, Checkbox, NumberInput, Group, Title, Text, Button, Alert } from '@mantine/core';
import { useGetById, useSaveDraft, useComplete } from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { EmptyState } from '../../../../components/EmptyState';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';

export const Route = createFileRoute('/_stackedLayout/patients/$patientId/forms/$patientFormId')({
  component: FillPatientFormPage,
});

function FillPatientFormPage() {
  const { patientId, patientFormId } = useParams({
    from: '/_stackedLayout/patients/$patientId/forms/$patientFormId',
  });
  const navigate = useNavigate();
  const { data, isLoading } = useGetById(patientId, patientFormId);
  const saveDraft = useSaveDraft();
  const complete = useComplete();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = data as any;
  const template = form?.template ?? form?.version ?? {};
  const fields: any[] = template?.schema?.fields ?? template?.fields ?? [];
  const isCompleted = form?.status === 'COMPLETED';

  useEffect(() => {
    if (form?.responses) setValues(form.responses);
  }, [form?.id]);

  const onChange = (name: string, value: unknown) => {
    if (isCompleted) return;
    const next = { ...values, [name]: value };
    setValues(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveDraft.mutate({ patientId, patientFormId, data: { responses: next } as any });
    }, 1500);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const onComplete = () => {
    complete.mutate(
      { patientId, patientFormId, data: { responses: values } as any },
      { onSuccess: () => navigate({ to: '/patients/$patientId', params: { patientId } as any }) },
    );
  };

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (!form) return <EmptyState icon="description" title="Formulário não encontrado" />;

  return (
    <Page title={template?.name ?? 'Formulário'} subtitle={template?.description}>
      {isCompleted && (
        <Alert color="green" mb="md" title="Formulário concluído">
          Este formulário está em modo somente leitura.
        </Alert>
      )}
      {template?.status === 'DEPRECATED' && (
        <Alert color="yellow" mb="md" title="Template descontinuado">
          Este template foi descontinuado. Conclua rapidamente.
        </Alert>
      )}

      <Box style={{ backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
        <Stack gap="md">
          {fields.length === 0 ? (
            <Text c="dimmed">Nenhum campo configurado neste template.</Text>
          ) : (
            fields.map((field) => (
              <FieldRenderer
                key={field.name ?? field.id}
                field={field}
                value={values[field.name]}
                onChange={(v) => onChange(field.name, v)}
                disabled={isCompleted}
              />
            ))
          )}
        </Stack>

        {!isCompleted && (
          <Group justify="space-between" mt="xl">
            <Text size="xs" c="dimmed">
              {saveDraft.isPending ? 'Salvando rascunho...' : 'Rascunho salvo automaticamente'}
            </Text>
            <Group>
              <Button
                variant="default"
                onClick={() => navigate({ to: '/patients/$patientId', params: { patientId } })}
              >
                Voltar
              </Button>
              <Button loading={complete.isPending} onClick={() => setConfirmOpen(true)}>
                Concluir formulário
              </Button>
            </Group>
          </Group>
        )}
      </Box>

      <ConfirmDialog
        opened={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onComplete();
        }}
        title="Concluir formulário"
        message="Após concluir, o formulário não poderá ser editado. Deseja continuar?"
      />
    </Page>
  );
}

interface FieldProps {
  field: any;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
}

function FieldRenderer({ field, value, onChange, disabled }: FieldProps) {
  const label = field.label ?? field.name;
  const required = !!field.required;

  switch (field.type) {
    case 'number':
      return (
        <NumberInput
          label={label}
          value={(value as number) ?? ''}
          onChange={(v) => onChange(v)}
          required={required}
          disabled={disabled}
        />
      );
    case 'boolean':
      return (
        <Checkbox
          label={label}
          checked={!!value}
          onChange={(e) => onChange(e.currentTarget.checked)}
          disabled={disabled}
        />
      );
    case 'select':
      return (
        <Select
          label={label}
          value={(value as string) ?? null}
          onChange={(v) => onChange(v)}
          data={(field.options ?? []).map((o: any) =>
            typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value },
          )}
          required={required}
          disabled={disabled}
        />
      );
    case 'date':
      return (
        <TextInput
          label={label}
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.currentTarget.value)}
          required={required}
          disabled={disabled}
        />
      );
    case 'textarea':
      return (
        <Textarea
          label={label}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.currentTarget.value)}
          required={required}
          disabled={disabled}
          minRows={3}
        />
      );
    case 'text':
    default:
      return (
        <TextInput
          label={label}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.currentTarget.value)}
          required={required}
          disabled={disabled}
        />
      );
  }
}
