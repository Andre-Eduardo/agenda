import {useState} from 'react';
import {
    useGetCurrentClinicMember,
    useGrantProfessionalAgendaAccess,
    useListClinicMembers,
    useListProfessionalAgendaAccess,
    useRevokeProfessionalAgendaAccess,
    type ClinicMemberRolesItem,
} from '@agenda-app/client';
import {createFileRoute, Link} from '@tanstack/react-router';
import {ArrowLeft, ShieldCheck, Trash2} from 'lucide-react';
import {toast} from 'sonner';
import {Badge, type badgeVariants} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/componentes/select';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {AgendaScheduleEditor} from '@/views/components/AgendaScheduleEditor';
import {Page} from '@/views/components/Page';
import {Card, backLink, cardSub, cardTitle, grantForm, grantList, grantRow, grantSelect, headerRow} from './styles';

export const Route = createFileRoute('/_stackedLayout/team/$memberId')({
    component: TeamMemberDetailPage,
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

function TeamMemberDetailPage() {
    const {memberId} = Route.useParams();

    const meQuery = useGetCurrentClinicMember();
    const clinicId = meQuery.data?.clinicId;

    const membersQuery = useListClinicMembers({clinicId: clinicId ?? ''}, {query: {enabled: !!clinicId}});
    const grantsQuery = useListProfessionalAgendaAccess(memberId);

    const grantAccess = useGrantProfessionalAgendaAccess();
    const revokeAccess = useRevokeProfessionalAgendaAccess();

    const [selectedGrantee, setSelectedGrantee] = useState<string>('');

    const members = membersQuery.data ?? [];
    const member = members.find((m) => m.id === memberId);
    const grants = grantsQuery.data ?? [];

    const availableGrantees = members.filter(
        (m) => m.id !== memberId && !grants.some((g) => g.granteeMemberId === m.id)
    );

    function memberLabel(id: string): string {
        return members.find((m) => m.id === id)?.displayName ?? 'Membro sem nome';
    }

    function handleGrant() {
        if (!selectedGrantee) return;

        grantAccess.mutate(
            {memberId, data: {granteeMemberId: selectedGrantee}},
            {
                onSuccess: () => {
                    toast.success('Acesso concedido');
                    setSelectedGrantee('');
                    void grantsQuery.refetch();
                },
                onError: () => toast.error('Erro ao conceder acesso.'),
            }
        );
    }

    function handleRevoke(granteeMemberId: string) {
        revokeAccess.mutate(
            {memberId, granteeMemberId},
            {
                onSuccess: () => {
                    toast.success('Acesso revogado');
                    void grantsQuery.refetch();
                },
                onError: () => toast.error('Erro ao revogar acesso.'),
            }
        );
    }

    const isLoading = meQuery.isLoading || membersQuery.isLoading;

    return (
        <Page
            title={member?.displayName ?? 'Membro'}
            subtitle={
                <div className={headerRow}>
                    <Link to="/team" className={backLink} aria-label="Voltar para Equipe">
                        <ArrowLeft size={16} />
                    </Link>
                    {member?.roles.map((role) => (
                        <Badge key={role} variant={ROLE_BADGE_VARIANT[role]}>
                            {ROLE_LABELS[role]}
                        </Badge>
                    ))}
                </div>
            }
        >
            {isLoading ? (
                <Skeleton style={{height: '3rem'}} />
            ) : (
                <>
                    <Card>
                        <div className={cardTitle}>Expediente e bloqueios de agenda</div>
                        <p className={cardSub}>
                            Configure o expediente semanal e os bloqueios (férias, ausências) deste membro.
                        </p>
                        <AgendaScheduleEditor memberId={memberId} />
                    </Card>

                    <Card>
                        <div className={cardTitle}>Quem pode gerenciar esta agenda</div>
                        <p className={cardSub}>
                            Além do próprio membro e de administradores (que sempre têm acesso), você pode liberar
                            outros membros (ex: secretária) para gerenciar o expediente e os bloqueios acima.
                        </p>

                        <div className={grantList}>
                            {grantsQuery.isLoading && <Skeleton style={{height: '3rem'}} />}
                            {!grantsQuery.isLoading && grants.length === 0 && (
                                <p className={cardSub}>Nenhum acesso concedido além do padrão (self / admin).</p>
                            )}
                            {!grantsQuery.isLoading &&
                                grants.map((grant) => {
                                    const granteeName = memberLabel(grant.granteeMemberId);

                                    return (
                                        <div key={grant.id} className={grantRow} role="group" aria-label={granteeName}>
                                            <span>{granteeName}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label="Revogar acesso"
                                                disabled={revokeAccess.isPending}
                                                onClick={() => handleRevoke(grant.granteeMemberId)}
                                            >
                                                <Trash2 size={13} />
                                            </Button>
                                        </div>
                                    );
                                })}
                        </div>

                        <div className={grantForm}>
                            <Select value={selectedGrantee} onValueChange={setSelectedGrantee}>
                                <SelectTrigger className={grantSelect} aria-label="Selecionar membro">
                                    <SelectValue placeholder="Selecionar membro…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableGrantees.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.displayName ?? 'Sem nome definido'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!selectedGrantee || grantAccess.isPending}
                                onClick={handleGrant}
                            >
                                <ShieldCheck size={13} />
                                Conceder acesso
                            </Button>
                        </div>
                    </Card>
                </>
            )}
        </Page>
    );
}
