import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Box, Table, Badge, Button, Text } from '@mantine/core';
import { useSearchPatients } from '@agenda-app/client';
import type { Patient } from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { ListToolbar } from '../../../../components/ListToolbar';
import { EmptyState } from '../../../../components/EmptyState';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import type { PaginatedResult } from '../../../../../utils/apiTypes';

export const Route = createFileRoute('/_stackedLayout/patients')({
  component: PatientListPage,
});

function PatientListPage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  const { data, isLoading } = useSearchPatients({
    term,
    cursor: null,
    limit: 20,
    sort: null,
  });

  const page = data as unknown as PaginatedResult<Patient> | undefined;
  const items = page?.items ?? [];

  return (
    <Page
      title="Pacientes"
      subtitle="Gestão de pacientes da clínica"
      actions={
        <Button
          leftSection={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>}
          onClick={() => navigate({ to: '/patients/new' })}
        >
          Novo paciente
        </Button>
      }
    >
      <ListToolbar
        searchValue={term}
        onSearchChange={setTerm}
        searchPlaceholder="Buscar por nome ou CPF"
      />

      <Box
        style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 16,
          boxShadow: 'var(--mantine-shadow-sm)',
        }}
      >
        {isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="people"
            title="Nenhum paciente encontrado"
            message={term ? `Sem resultados para "${term}"` : 'Cadastre o primeiro paciente'}
          />
        ) : (
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Documento</Table.Th>
                <Table.Th>Telefone</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((p) => (
                <Table.Tr key={p.id} style={{ cursor: 'pointer' }}>
                  <Table.Td>
                    <Link
                      to="/patients/$patientId"
                      params={{ patientId: p.id }}
                      style={{ color: 'var(--mantine-color-brand-6)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {p.name}
                    </Link>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{p.documentId}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{String(p.phone ?? '—')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{String(p.email ?? '—')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="green">
                      Ativo
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
