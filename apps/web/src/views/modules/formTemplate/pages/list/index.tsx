import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Box, Table, TextInput, Badge, Text, Group } from '@mantine/core';
import { useSearchFormTemplates } from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { EmptyState } from '../../../../components/EmptyState';

export const Route = createFileRoute('/_stackedLayout/form-templates')({
  component: FormTemplatesListPage,
});

function FormTemplatesListPage() {
  const [term, setTerm] = useState('');

  const { data, isLoading } = useSearchFormTemplates({
    term: term || undefined,
    limit: 50,
  } as any);

  const items = ((data as any)?.items ?? []) as any[];

  return (
    <Page title="Templates de Formulário" subtitle="Modelos clínicos dinâmicos">
      <Box mb="md">
        <TextInput
          placeholder="Buscar template..."
          value={term}
          onChange={(e) => setTerm(e.currentTarget.value)}
          style={{ maxWidth: 360 }}
        />
      </Box>

      <Box style={{ backgroundColor: 'white', borderRadius: 10, padding: 16 }}>
        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : items.length === 0 ? (
          <EmptyState icon="description" title="Nenhum template" message="Crie um template via API ou seed." />
        ) : (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Categoria</Table.Th>
                <Table.Th>Versão</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((t: any) => (
                <Table.Tr key={t.id}>
                  <Table.Td>
                    <Text fw={500}>{t.name}</Text>
                    {t.description && <Text size="xs" c="dimmed">{t.description}</Text>}
                  </Table.Td>
                  <Table.Td>{t.category ?? '—'}</Table.Td>
                  <Table.Td>{t.currentVersion ?? t.version ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge color={t.status === 'PUBLISHED' ? 'green' : t.status === 'DEPRECATED' ? 'red' : 'gray'}>
                      {t.status ?? 'DRAFT'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Box>
    </Page>
  );
}
