import {useState, useEffect} from 'react';
import {useSearchPatients, useSearchAppointments} from '@agenda-app/client';
import type {Patient, PatientGender} from '@agenda-app/client';
import type {UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {
    Search,
    Plus,
    MoreHorizontal,
    Rows3,
    LayoutGrid,
    Users,
    CalendarDays,
    Sparkles,
    UserRound,
    Pencil,
    CalendarPlus,
    Archive,
    ChevronLeft,
    ChevronRight,
    SearchX,
    X,
} from 'lucide-react';
import {AvatarInitials, avatarColorVariants} from '@/components/ui/componentes/avatar';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/componentes/dropdown-menu';
import {EmptyStateCard} from '@/components/ui/componentes/empty-state';
import {SegmentedControl} from '@/components/ui/componentes/segmented-control';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {StatTile} from '@/components/ui/componentes/stat-tile';
import {Page} from '@/views/components/Page';
import styles from './styles.module.css';

export const Route = createFileRoute('/_stackedLayout/patients')({
    component: PatientsPage,
});

// ── Types ────────────────────────────────────────────────────────────────────

type Layout = 'table' | 'cards';
// NOTE: Patient API does not yet expose a `status` field.
// This filter is a UI placeholder — wire to SearchPatientsParams when the
// backend adds status support.
type StatusFilter = 'all' | 'active' | 'inactive';

interface PatientPage {
    totalCount: number;
    data: Patient[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAvatarColorIndex(id: string): number {
    let hash = 0;

    // eslint-disable-next-line no-bitwise -- standard string-hash uint32 pattern
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;

    return hash % avatarColorVariants.length;
}

function getAge(birthDate: unknown): number | null {
    if (!birthDate || typeof birthDate !== 'string') return null;
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;

    return age;
}

function formatBirthDate(birthDate: unknown): string {
    if (!birthDate || typeof birthDate !== 'string') return '—';

    return new Date(birthDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PatientAvatar({name, id, size = 'md'}: {name: string; id: string; size?: 'sm' | 'md' | 'lg'}) {
    return <AvatarInitials name={name} colorIndex={getAvatarColorIndex(id)} size={size} />;
}

function GenderBadge({gender}: {gender: PatientGender}) {
    if (!gender) return null;

    const labels: Record<NonNullable<PatientGender>, string> = {FEMALE: 'F', MALE: 'M', OTHER: 'O'};

    return (
        <Badge gender={gender} size="sm">
            {labels[gender]}
        </Badge>
    );
}

const TABLE_COLS = 'minmax(260px,1.6fr) 90px 1.2fr 1.2fr 130px 56px';

function PatientTableRow({patient, onClick}: {patient: Patient; onClick: () => void}) {
    const age = getAge(patient.birthDate);

    return (
        <div className={styles.tableRowRoot} style={{gridTemplateColumns: TABLE_COLS}} onClick={onClick}>
            <div className={styles.tableRowNameCell}>
                <PatientAvatar name={patient.name} id={patient.id} />
                <div className={styles.tableRowNameBlock}>
                    <p className={styles.tableRowName}>{patient.name}</p>
                    <p className={styles.tableRowEmail}>{typeof patient.email === 'string' ? patient.email : '—'}</p>
                </div>
            </div>

            <div className={styles.tableRowAgeWrapper}>
                <span className={styles.tableRowAge}>
                    {age !== null ? (
                        <>
                            {age}
                            <span className={styles.tableRowAgeUnit}> anos</span>
                        </>
                    ) : (
                        '—'
                    )}
                </span>
                {age !== null && (
                    <span className={styles.tableRowAgeTooltip}>Nasc. {formatBirthDate(patient.birthDate)}</span>
                )}
            </div>

            <p className={styles.tableRowDocument}>{patient.documentId}</p>

            {patient.insurancePlan ? (
                <span className={styles.tableRowInsuranceBadge}>{patient.insurancePlan.name}</span>
            ) : (
                <span className={styles.tableRowInsuranceEmpty}>—</span>
            )}

            <GenderBadge gender={patient.gender} />

            <div className={styles.tableRowActionWrapper} onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button type="button" aria-label="Ações" className={styles.tableRowActionBtn}>
                            <MoreHorizontal className="size-4" strokeWidth={1.5} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onClick}>
                            <UserRound className="size-3.5" />
                            Ver perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Pencil className="size-3.5" />
                            Editar cadastro
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <CalendarPlus className="size-3.5" />
                            Agendar consulta
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className={styles.tableRowDangerItem}>
                            <Archive className="size-3.5" />
                            Arquivar paciente
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function SkeletonTableRow() {
    return (
        <div className={styles.tableRowSkeletonRoot} style={{gridTemplateColumns: TABLE_COLS}}>
            <div className={styles.tableRowSkeletonNameCell}>
                <Skeleton className={styles.tableRowSkeletonAvatar} />
                <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className={styles.tableRowSkeletonStatusBadge} />
            <Skeleton className={styles.tableRowSkeletonBadgeSm} />
            <Skeleton className={styles.tableRowSkeletonActionBtn} />
        </div>
    );
}

function PatientCard({patient, onClick}: {patient: Patient; onClick: () => void}) {
    const age = getAge(patient.birthDate);

    return (
        <div className={styles.patientCardRoot} onClick={onClick}>
            <div className={styles.patientCardTop}>
                <PatientAvatar name={patient.name} id={patient.id} size="lg" />
                <div className={styles.patientCardNameBlock}>
                    <p className={styles.patientCardName}>{patient.name}</p>
                    <p className={styles.patientCardMeta}>
                        {age !== null ? `${age} anos` : '—'} · {typeof patient.email === 'string' ? patient.email : '—'}
                    </p>
                </div>
            </div>
            <div className={styles.patientCardDetails}>
                <div className={styles.patientCardDetailRow}>
                    <span className={styles.patientCardDetailLabel}>Documento</span>
                    <span className={styles.patientCardDetailValue}>{patient.documentId}</span>
                </div>
                <div className={styles.patientCardDetailRow}>
                    <span className={styles.patientCardDetailLabel}>Convênio</span>
                    <span className={styles.patientCardDetailValue}>{patient.insurancePlan?.name ?? '—'}</span>
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className={styles.skeletonCardRoot}>
            <div className={styles.skeletonCardTop}>
                <Skeleton className={styles.skeletonCardAvatar} />
                <div className={styles.skeletonCardNameBlock}>
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-28" />
                </div>
            </div>
            <div className={styles.skeletonCardDetails}>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
            </div>
        </div>
    );
}

function Pagination({from, to, total}: {from: number; to: number; total: number}) {
    return (
        <div className={styles.paginationRoot}>
            <p className={styles.paginationInfo}>
                Mostrando <strong className={styles.paginationInfoStrong}>{from}</strong>–
                <strong className={styles.paginationInfoStrong}>{to}</strong> de{' '}
                <strong className={styles.paginationInfoStrong}>{total}</strong> pacientes
            </p>
            <div className={styles.paginationControls}>
                <button type="button" disabled className={styles.paginationBtnDisabled}>
                    <ChevronLeft className="size-3.5" />
                    Anterior
                </button>
                <button type="button" className={styles.paginationBtnActive}>
                    1
                </button>
                <button type="button" disabled className={styles.paginationBtnDisabled}>
                    Próxima
                    <ChevronRight className="size-3.5" />
                </button>
            </div>
        </div>
    );
}

// ── Patients content ─────────────────────────────────────────────────────────

function PatientsContent({
    isLoading,
    patients,
    layout,
    search,
    setSearch,
    totalCount,
    onOpen,
}: {
    isLoading: boolean;
    patients: Patient[];
    layout: Layout;
    search: string;
    setSearch: (v: string) => void;
    totalCount: number;
    onOpen: (p: Patient) => void;
    // NOTE: statusFilter is intentionally not propagated here — filtering happens
    // at the API layer once the backend adds status support.
}) {
    if (!isLoading && patients.length === 0) {
        return (
            <EmptyStateCard
                icon={<SearchX className="size-6" strokeWidth={1.5} />}
                title="Nenhum paciente encontrado"
                description={
                    search ? `Nenhum resultado para "${search}"` : 'Ajuste os filtros para ver mais resultados'
                }
                action={
                    <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                        <X className="size-4" />
                        Limpar busca
                    </Button>
                }
            />
        );
    }

    if (layout === 'table') {
        return (
            <div className={styles.tableRoot}>
                <div className={styles.tableHead} style={{gridTemplateColumns: TABLE_COLS}}>
                    {['Paciente', 'Idade', 'Documento', 'Convênio', 'Gênero', ''].map((h, i) => (
                        <span key={i} className={styles.tableHeadCell}>
                            {h}
                        </span>
                    ))}
                </div>

                {isLoading
                    ? Array.from({length: 8}).map((_, i) => <SkeletonTableRow key={i} />)
                    : patients.map((p) => <PatientTableRow key={p.id} patient={p} onClick={() => onOpen(p)} />)}

                <div className={styles.tableFooter}>
                    <Pagination from={Math.min(1, patients.length)} to={patients.length} total={totalCount} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.cardsGrid}>
                {isLoading
                    ? Array.from({length: 6}).map((_, i) => <SkeletonCard key={i} />)
                    : patients.map((p) => <PatientCard key={p.id} patient={p} onClick={() => onOpen(p)} />)}
            </div>
            <div className={styles.cardsFooter}>
                <Pagination from={Math.min(1, patients.length)} to={patients.length} total={totalCount} />
            </div>
        </>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function PatientsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [layout, setLayout] = useState<Layout>('table');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);

        return () => clearTimeout(t);
    }, [search]);

    const query = useSearchPatients({
        term: debouncedSearch,
        limit: 50,
        cursor: null,
        sort: null,
    }) as unknown as UseQueryResult<PatientPage>;

    const statsQuery = useSearchPatients({
        term: '',
        limit: 1,
        cursor: null,
        sort: null,
    }) as unknown as UseQueryResult<PatientPage>;

    interface AppointmentPage {
        totalCount: number;
        data: unknown[];
    }

    const appointmentsQuery = useSearchAppointments({
        term: '',
        limit: 1,
        cursor: null,
        sort: null,
    }) as unknown as UseQueryResult<AppointmentPage>;

    const patients = query.data?.data ?? [];
    const totalCount = query.data?.totalCount ?? 0;
    const totalAll = statsQuery.data?.totalCount ?? 0;
    const totalAppointments = appointmentsQuery.data?.totalCount;
    const {isLoading} = query;

    const hasFilters = !!search || statusFilter !== 'all';

    function openPatient(patient: Patient) {
        void navigate({to: '/patients/$patientId', params: {patientId: patient.id}});
    }

    function clearFilters() {
        setSearch('');
        setStatusFilter('all');
    }

    const subtitle = (
        <span>
            <span className="font-mono tabular-nums">{statsQuery.isLoading ? '…' : totalAll}</span>
            {' pacientes ativos no consultório'}
        </span>
    );

    return (
        <Page
            title="Pacientes"
            subtitle={subtitle}
            actions={
                <Button size="sm" onClick={() => navigate({to: '/patients/new'})}>
                    <Plus className="size-4" />
                    Novo paciente
                </Button>
            }
        >
            {/* Stats */}
            <div className={styles.statsGrid}>
                <StatTile
                    label="Total de pacientes"
                    value={totalAll}
                    delta={
                        <span>
                            <span className={styles.statsDelta}>+4</span> nos últimos 30 dias
                        </span>
                    }
                    loading={statsQuery.isLoading}
                    icon={<Users className="size-4" strokeWidth={1.5} />}
                    iconIntent="primary"
                />
                <StatTile
                    label="Total de consultas"
                    value={totalAppointments ?? 0}
                    loading={appointmentsQuery.isLoading}
                    icon={<CalendarDays className="size-4" strokeWidth={1.5} />}
                    iconIntent="info"
                />
                <StatTile
                    label="Pré-evoluções IA"
                    value="—"
                    delta="conectar módulo IA"
                    loading={false}
                    icon={<Sparkles className="size-4" strokeWidth={1.5} />}
                    iconIntent="ai"
                />
            </div>

            {/* Toolbar */}
            <div className={styles.toolbarRoot}>
                {/* Search */}
                <div className={styles.toolbarSearch}>
                    <Search className={styles.toolbarSearchIcon} strokeWidth={1.5} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou documento…"
                        className={styles.toolbarSearchInput}
                    />
                    <span className={styles.toolbarSearchKbd}>⌘K</span>
                </div>

                {/* Status filter */}
                <SegmentedControl value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SegmentedControl.Item value="all">Todos</SegmentedControl.Item>
                    <SegmentedControl.Item value="active">Ativos</SegmentedControl.Item>
                    <SegmentedControl.Item value="inactive">Inativos</SegmentedControl.Item>
                </SegmentedControl>

                {/* Layout toggle */}
                <SegmentedControl value={layout} onValueChange={(v) => setLayout(v as Layout)}>
                    <SegmentedControl.Item value="table" title="Tabela">
                        <Rows3 className="size-[15px]" />
                    </SegmentedControl.Item>
                    <SegmentedControl.Item value="cards" title="Cards">
                        <LayoutGrid className="size-[15px]" />
                    </SegmentedControl.Item>
                </SegmentedControl>

                {hasFilters && (
                    <button type="button" className={styles.toolbarClearBtn} onClick={clearFilters}>
                        <X className={styles.toolbarClearIcon} />
                        Limpar filtros
                    </button>
                )}

                <span className={styles.toolbarCount}>
                    {isLoading ? '…' : `${patients.length} resultado${patients.length !== 1 ? 's' : ''}`}
                </span>
            </div>

            <PatientsContent
                isLoading={isLoading}
                patients={patients}
                layout={layout}
                search={search}
                setSearch={setSearch}
                totalCount={totalCount}
                onOpen={openPatient}
            />
        </Page>
    );
}
