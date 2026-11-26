import {useEffect, useState} from 'react';
import {useEnterClinic, useGetClinicLicense, useSearchClinics, type Clinic} from '@agenda-app/client';
import {useQueryClient, type UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {Building2, ChevronRight, LogIn, Search} from 'lucide-react';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {EmptyStateCard} from '@/components/ui/componentes/empty-state';
import {Input} from '@/components/ui/componentes/input';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/componentes/table';
import {useCan} from '@/hooks/useCan';
import {MODULE_LABELS} from '@/utils/ai-modules';
import {Page} from '@/views/components/Page';
import {
    actionsCell,
    clinicName,
    clinicSub,
    emptyText,
    licenseCell,
    linkCell,
    moduleBadges,
    searchRow,
    seatText,
    skeletonBadge,
    skeletonRow,
} from './styles';

export const Route = createFileRoute('/_stackedLayout/admin/clinics')({
    component: AdminClinicsPage,
});

const SEARCH_LIMIT = 200;

function ClinicLicenseSummary({clinicId}: {clinicId: string}) {
    const licenseQuery = useGetClinicLicense(clinicId);
    const license = licenseQuery.data;

    if (licenseQuery.isLoading) return <Skeleton className={skeletonBadge} />;

    if (!license) return <span className={emptyText}>—</span>;

    const maxLabel = license.professionals.max !== null ? ` de ${license.professionals.max}` : '';

    return (
        <div className={licenseCell}>
            <span className={seatText}>
                {license.professionals.active}/{license.professionals.included + license.professionals.extra}
                {maxLabel} profissionais
            </span>
            <div className={moduleBadges}>
                {license.modules.length === 0 && <Badge variant="secondary">Sem pacote de IA</Badge>}
                {license.modules.map((module) => (
                    <Badge key={module.type} variant="default">
                        {MODULE_LABELS[module.type]} · {module.memberIds.length}/
                        {module.includedSeats + module.extraSeats}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

/** Enters the clinic as a global support user (read-only, audited) and opens its dashboard. */
function EnterClinicButton({clinic}: {clinic: Clinic}) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const enterClinic = useEnterClinic();

    function handleEnter() {
        enterClinic.mutate(
            {clinicId: clinic.id},
            {
                onSuccess: () => {
                    // Everything cached so far belongs to no clinic or to another one.
                    queryClient.clear();
                    toast.success(`Você entrou em ${clinic.name} como suporte`);
                    void navigate({to: '/dashboard'});
                },
                onError: () => toast.error('Não foi possível entrar na clínica'),
            }
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleEnter}
            disabled={enterClinic.isPending}
            aria-label={`Entrar em ${clinic.name} como suporte`}
        >
            <LogIn size={14} aria-hidden />
            Entrar
        </Button>
    );
}

export function AdminClinicsPage() {
    const canManageLicenses = useCan({has: 'clinic-license:manage'});
    const canEnter = useCan({has: 'support-access:enter'});
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search), 300);

        return () => clearTimeout(timeout);
    }, [search]);

    // Orval mistypes the paginated response as `never` for this overload — same known
    // codegen issue worked around for useSearchProfessionals/useSearchPatients elsewhere.
    const query = useSearchClinics({
        term: debouncedSearch,
        limit: SEARCH_LIMIT,
        cursor: null,
        sort: null,
    }) as unknown as UseQueryResult<{data: Clinic[]; totalCount: number}>;

    const clinics = query.data?.data ?? [];
    const totalCount = query.data?.totalCount ?? 0;

    return (
        <Page title="Empresas" subtitle={query.isLoading ? 'Carregando…' : `${totalCount} clínica(s) cadastradas`}>
            <div className={searchRow}>
                <Input
                    leadIcon={<Search size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome…"
                    aria-label="Buscar clínicas"
                />
            </div>

            {query.isLoading && (
                <div>
                    <Skeleton className={skeletonRow} />
                    <Skeleton className={skeletonRow} />
                    <Skeleton className={skeletonRow} />
                </div>
            )}

            {!query.isLoading && clinics.length === 0 && (
                <EmptyStateCard
                    icon={<Building2 size={24} />}
                    title="Nenhuma clínica encontrada"
                    description="Ajuste a busca ou aguarde novos cadastros."
                />
            )}

            {!query.isLoading && clinics.length > 0 && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Clínica</TableHead>
                            {canManageLicenses && <TableHead>Licença</TableHead>}
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clinics.map((clinic) => (
                            <TableRow key={clinic.id}>
                                <TableCell>
                                    <div className={clinicName}>{clinic.name}</div>
                                    <div className={clinicSub}>
                                        {[clinic.city, clinic.state].filter(Boolean).join(' - ') || '—'}
                                    </div>
                                </TableCell>
                                {canManageLicenses && (
                                    <TableCell>
                                        <ClinicLicenseSummary clinicId={clinic.id} />
                                    </TableCell>
                                )}
                                <TableCell>
                                    <div className={actionsCell}>
                                        {canEnter && <EnterClinicButton clinic={clinic} />}
                                        {canManageLicenses && (
                                            <Link
                                                to="/admin/clinics/$clinicId"
                                                params={{clinicId: clinic.id}}
                                                className={linkCell}
                                                aria-label="Gerenciar licença da clínica"
                                            >
                                                <ChevronRight size={16} />
                                            </Link>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </Page>
    );
}
