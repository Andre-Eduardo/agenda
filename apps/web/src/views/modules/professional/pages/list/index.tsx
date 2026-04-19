import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Box, Table, Button, Text, Badge } from '@mantine/core';
import { useSearchProfessionals } from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { ListToolbar } from '../../../../components/ListToolbar';
import { EmptyState } from '../../../../components/EmptyState';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import type { PaginatedResult } from '../../../../../utils/apiTypes';

export const Route = createFileRoute('/_stackedLayout/professionals')({
  component: ProfessionalListPage,
});

function ProfessionalListPage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const { data, isLoading } = useSearchProfessionals({ term, cursor: null, limit: 20, sort: null } as any);
  const items = ((data as unknown as PaginatedResult<any> | undefined)?.items ?? []) as any[];

  return (
    <Page
      title="Profissionais"
      subtitle="Cadastro de profissionais da clínica"
      actions={
        <Button onClick={() => navigate({ to: '/professionals/new' })}>
          Novo profissional
        </Button>
      }
    >
      <ListToolbar searchValue={term} onSearchChange={setTerm} searchPlaceholder="Buscar por nome" />
      <Box style={{ backgroundColor: 'white', borderRadius: 10, padding: 16 }}>
        {isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : items.length === 0 ? (
          <EmptyState icon="medical_services" title="Sem profissionais" />
        ) : (
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Documento</Table.Th>
                <Table.Th>Especialidades</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td><Text fw={600}>{p.name}</Text></Table.Td>
                  <Table.Td><Text size="sm">{p.documentId ?? "—"}</Text></Table.Td>
                  <Table.Td>
                    {(p.profiles ?? []).map((s: string) => (
                      <Badge key={s} variant="light" mr={4}>{s}</Badge>
                    ))}
                  </Table.Td>
                  <Table.Td>
                    <Button component={Link} to="/professionals/$professionalId/edit" params={{ professionalId: p.id } as any} size="xs" variant="subtle">
                      Editar
                    </Button>
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
