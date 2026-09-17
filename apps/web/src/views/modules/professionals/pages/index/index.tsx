import {useState} from 'react';
import {
    useGetCurrentClinicMember,
    useListClinicMembers,
    useSearchProfessionals,
    type ClinicMember,
    type Professional,
} from '@agenda-app/client';
import type {UseQueryResult} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {Pencil, Stethoscope} from 'lucide-react';
import {AvatarInitials} from '@/components/ui/componentes/avatar';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {EmptyStateCard} from '@/components/ui/componentes/empty-state';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/componentes/table';
import {Page} from '@/views/components/Page';
import {ProfessionalDetailsDialog} from '../../components/ProfessionalDetailsDialog';
import {actionCell, memberCell, memberName, mutedText, skeletonRow} from './styles';

export const Route = createFileRoute('/_stackedLayout/professionals')({
    component: ProfessionalsPage,
});

interface PaginatedPage<T> {
    data: T[];
    totalCount: number;
}

const SPECIALTY_LABELS: Record<string, string> = {
    SAUDE_MENTAL: 'Saúde Mental',
    REABILITACAO: 'Reabilitação',
    MEDICINA_GERAL: 'Medicina Geral',
    MEDICINA_ESPECIALIZADA: 'Medicina Especializada',
    NUTRICAO_DIETETICA: 'Nutrição/Dietética',
    ENFERMAGEM: 'Enfermagem',
    OUTROS: 'Outros',
};

function ProfessionalsPage() {
    const meQuery = useGetCurrentClinicMember();
    const clinicId = meQuery.data?.clinicId;

    const membersQuery = useListClinicMembers({clinicId: clinicId ?? ''}, {query: {enabled: !!clinicId}});
    const professionalsQuery = useSearchProfessionals({
        term: '',
        limit: 200,
        cursor: null,
        sort: null,
    }) as unknown as UseQueryResult<PaginatedPage<Professional>>;

    const [editingMember, setEditingMember] = useState<ClinicMember | null>(null);

    const isLoading = meQuery.isLoading || membersQuery.isLoading || professionalsQuery.isLoading;

    const professionalMembers = (membersQuery.data ?? []).filter((m) => m.roles.includes('PROFESSIONAL'));
    const professionalsByMemberId = new Map(
        (professionalsQuery.data?.data ?? []).map((p) => [p.clinicMemberId, p] as const)
    );

    const editingProfessional = editingMember ? (professionalsByMemberId.get(editingMember.id) ?? null) : null;

    return (
        <Page title="Profissionais" subtitle="Especialidade e registro profissional de cada membro da equipe.">
            {isLoading && (
                <div>
                    <Skeleton className={skeletonRow} />
                    <Skeleton className={skeletonRow} />
                    <Skeleton className={skeletonRow} />
                </div>
            )}
            {!isLoading && professionalMembers.length === 0 && (
                <EmptyStateCard
                    icon={<Stethoscope size={24} />}
                    title="Nenhum profissional encontrado"
                    description='Adicione um membro com papel "Profissional" na página Equipe para vê-lo aqui.'
                />
            )}
            {!isLoading && professionalMembers.length > 0 && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Profissional</TableHead>
                            <TableHead>Especialidade</TableHead>
                            <TableHead>Registro</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {professionalMembers.map((member) => {
                            const professional = professionalsByMemberId.get(member.id) ?? null;

                            return (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className={memberCell}>
                                            <AvatarInitials name={member.displayName ?? '—'} size="sm" />
                                            <span className={memberName}>
                                                {member.displayName ?? 'Sem nome definido'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {professional?.specialtyNormalized
                                            ? (SPECIALTY_LABELS[professional.specialtyNormalized] ??
                                              professional.specialtyNormalized)
                                            : (professional?.specialty ?? <span className={mutedText}>—</span>)}
                                    </TableCell>
                                    <TableCell>{professional?.registrationNumber ?? <span className={mutedText}>—</span>}</TableCell>
                                    <TableCell>
                                        {professional ? (
                                            <Badge variant="success">Completo</Badge>
                                        ) : (
                                            <Badge variant="warning">Cadastro incompleto</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className={actionCell}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label={
                                                    professional ? 'Editar profissional' : 'Completar cadastro'
                                                }
                                                onClick={() => setEditingMember(member)}
                                            >
                                                <Pencil size={14} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}
            {editingMember && (
                <ProfessionalDetailsDialog
                    member={editingMember}
                    professional={editingProfessional}
                    onClose={() => setEditingMember(null)}
                    onSaved={() => {
                        setEditingMember(null);
                        void professionalsQuery.refetch();
                    }}
                />
            )}
        </Page>
    );
}
