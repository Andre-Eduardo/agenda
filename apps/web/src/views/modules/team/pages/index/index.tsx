import {useState} from 'react';
import {useGetCurrentClinicMember, useListClinicMembers, type ClinicMemberRolesItem} from '@agenda-app/client';
import {createFileRoute, Link} from '@tanstack/react-router';
import {ChevronRight, Plus, UserCog} from 'lucide-react';
import {AvatarInitials} from '@/components/ui/componentes/avatar';
import {Badge, type badgeVariants} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {EmptyStateCard} from '@/components/ui/componentes/empty-state';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/componentes/table';
import {useCan} from '@/hooks/useCan';
import {Page} from '@/views/components/Page';
import {AddMemberDialog} from '../../components/AddMemberDialog';
import {linkCell, memberCell, memberName, roleBadges, skeletonRow} from './styles';

export const Route = createFileRoute('/_stackedLayout/team')({
    component: TeamPage,
});

const ROLE_LABELS: Record<ClinicMemberRolesItem, string> = {
    OWNER: 'Proprietário(a)',
    ADMIN: 'Administrador(a)',
    PROFESSIONAL: 'Profissional',
    SECRETARY: 'Secretária(o)',
    VIEWER: 'Visualizador(a)',
};

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];

const ROLE_BADGE_VARIANT: Record<ClinicMemberRolesItem, BadgeVariant> = {
    OWNER: 'default',
    ADMIN: 'default',
    PROFESSIONAL: 'success',
    SECRETARY: 'warning',
    VIEWER: 'secondary',
};

function TeamPage() {
    const meQuery = useGetCurrentClinicMember();
    const clinicId = meQuery.data?.clinicId;
    const canAddMember = useCan({has: 'clinic-member:create'});

    const membersQuery = useListClinicMembers({clinicId: clinicId ?? ''}, {query: {enabled: !!clinicId}});
    const [showAddMember, setShowAddMember] = useState(false);

    const isLoading = meQuery.isLoading || membersQuery.isLoading;
    const members = membersQuery.data ?? [];

    return (
        <Page
            title="Equipe"
            subtitle="Membros da clínica e gestão de acesso à agenda de cada profissional."
            actions={
                canAddMember && (
                    <Button size="sm" onClick={() => setShowAddMember(true)}>
                        <Plus size={16} />
                        Adicionar membro
                    </Button>
                )
            }
        >
            {showAddMember && (
                <AddMemberDialog
                    onClose={() => setShowAddMember(false)}
                    onCreated={() => void membersQuery.refetch()}
                />
            )}
            {isLoading && (
                <div>
                    <Skeleton className={skeletonRow} />
                    <Skeleton className={skeletonRow} />
                    <Skeleton className={skeletonRow} />
                </div>
            )}
            {!isLoading && members.length === 0 && (
                <EmptyStateCard
                    icon={<UserCog size={24} />}
                    title="Nenhum membro encontrado"
                    description="Convide membros para a clínica para vê-los aqui."
                />
            )}
            {!isLoading && members.length > 0 && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Membro</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <div className={memberCell}>
                                        <AvatarInitials name={member.displayName ?? '—'} size="sm" />
                                        <span className={memberName}>{member.displayName ?? 'Sem nome definido'}</span>
                                        {member.id === meQuery.data?.id && <Badge variant="outline">Você</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className={roleBadges}>
                                        {member.roles.map((role) => (
                                            <Badge key={role} variant={ROLE_BADGE_VARIANT[role]}>
                                                {ROLE_LABELS[role]}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={member.isActive ? 'success' : 'destructive'}>
                                        {member.isActive ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Link
                                        to="/team/$memberId"
                                        params={{memberId: member.id}}
                                        className={linkCell}
                                        aria-label="Ver detalhes do membro"
                                    >
                                        <ChevronRight size={16} />
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </Page>
    );
}
