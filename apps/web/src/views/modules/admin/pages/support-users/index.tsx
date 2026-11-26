import {useState} from 'react';
import {
    getListSupportUsersQueryKey,
    useListSupportUsers,
    useRevokeSupportUser,
    type SupportUser,
} from '@agenda-app/client';
import {useQueryClient} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {LifeBuoy, Plus} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {EmptyStateCard} from '@/components/ui/componentes/empty-state';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/componentes/table';
import {ConfirmDialog} from '@/views/components/ConfirmDialog';
import {Page} from '@/views/components/Page';
import {SupportUserDialog} from '../../components/SupportUserDialog';
import {actionsCell, skeletonRow, userName, userSub} from './styles';

export const Route = createFileRoute('/_stackedLayout/admin/support-users')({
    component: SupportUsersPage,
});

/** Global support users (platform admin): they enter any clinic, read-only, without being employees. */
export function SupportUsersPage() {
    const queryClient = useQueryClient();
    const [creating, setCreating] = useState(false);
    const [revoking, setRevoking] = useState<SupportUser | null>(null);
    const query = useListSupportUsers();
    const revoke = useRevokeSupportUser();
    const users = query.data ?? [];

    const refresh = () => queryClient.invalidateQueries({queryKey: getListSupportUsersQueryKey()});

    function confirmRevoke() {
        if (revoking === null) return;

        revoke.mutate(
            {id: revoking.id},
            {
                onSuccess: () => {
                    toast.success('Acesso de suporte revogado');
                    setRevoking(null);
                    void refresh();
                },
                onError: () => toast.error('Erro ao revogar o acesso de suporte'),
            }
        );
    }

    return (
        <Page
            title="Usuários de suporte"
            subtitle="Entram em qualquer clínica para avaliar a configuração. Só leitura, sem dados clínicos."
            actions={
                <Button onClick={() => setCreating(true)}>
                    <Plus size={16} aria-hidden />
                    Novo usuário de suporte
                </Button>
            }
        >
            {query.isLoading && (
                <div>
                    <Skeleton className={skeletonRow} />
                    <Skeleton className={skeletonRow} />
                </div>
            )}

            {!query.isLoading && users.length === 0 && (
                <EmptyStateCard
                    icon={<LifeBuoy size={24} />}
                    title="Nenhum usuário de suporte"
                    description="Crie um usuário para a equipe de suporte entrar nas clínicas."
                />
            )}

            {!query.isLoading && users.length > 0 && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className={userName}>{user.name}</div>
                                    <div className={userSub}>{user.username}</div>
                                </TableCell>
                                <TableCell>{user.email ?? '—'}</TableCell>
                                <TableCell>
                                    <div className={actionsCell}>
                                        <Button variant="outline" size="sm" onClick={() => setRevoking(user)}>
                                            Revogar
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {creating && <SupportUserDialog onClose={() => setCreating(false)} onCreated={() => void refresh()} />}

            <ConfirmDialog
                opened={revoking !== null}
                title="Revogar acesso de suporte"
                message={`${revoking?.name ?? ''} deixa de entrar nas clínicas na hora, mesmo com a sessão aberta.`}
                confirmLabel="Revogar"
                danger
                isLoading={revoke.isPending}
                onConfirm={confirmRevoke}
                onCancel={() => setRevoking(null)}
            />
        </Page>
    );
}
