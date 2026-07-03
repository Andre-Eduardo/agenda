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
import {css} from '@/styled-system/css';
import {
    icon15,
    icon35,
    icon4,
    icon6,
    monoNums,
    py6,
    skeletonH3Full,
    skeletonH3W24,
    skeletonH3_5W32,
    skeletonH4W28,
    skeletonH4W8,
    skeletonTextStack,
} from './styles';

export const Route = createFileRoute('/_stackedLayout/patients')({
    component: PatientsPage,
});

// ── Types ────────────────────────────────────────────────────────────────────

type Layout = 'table' | 'cards';
type StatusFilter = 'all' | 'active' | 'inactive';

interface PatientPage {
    totalCount: number;
    data: Patient[];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const statsGrid = css({mb: '6', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '3'});

const statsDelta = css({fontWeight: 'medium', color: 'success'});

const toolbarRoot = css({mb: '3.5', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2.5'});

const toolbarSearch = css({
    display: 'flex',
    minW: '[280px]',
    flex: '1',
    alignItems: 'center',
    gap: '2',
    rounded: 'input',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    px: '3',
    py: '[9px]',
    transitionProperty: 'all',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _focusWithin: {borderColor: 'primary'},
});

const toolbarSearchInput = css({
    flex: '1',
    bg: 'transparent',
    fontSize: 'sm-body',
    color: 'text.primary',
    _placeholder: {color: 'text.tertiary'},
    _focus: {outline: 'none'},
});

const toolbarSearchKbd = css({
    flexShrink: '0',
    rounded: '[4px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    px: '1.5',
    py: '0.5',
    fontFamily: 'mono',
    fontSize: '2xs',
    color: 'text.tertiary',
});

const toolbarClearBtn = css({
    rounded: '[6px]',
    px: '2',
    py: '1.5',
    fontSize: 'sm',
    color: 'primary.text',
    transitionProperty: 'color, background-color',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _hover: {bg: 'primary.surface'},
});

const toolbarClearIcon = css({mr: '1', display: 'inline', w: '3.5', h: '3.5'});

const toolbarSearchIcon = css({w: '4', h: '4', flexShrink: '0', color: 'text.tertiary'});

const toolbarCount = css({fontFamily: 'mono', fontSize: 'sm', fontVariantNumeric: 'tabular-nums', color: 'text.tertiary'});

const tableRoot = css({
    overflow: 'hidden',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
});

const tableHead = css({
    display: 'grid',
    alignItems: 'center',
    gap: '4',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    bg: 'bg.surface',
    px: '[18px]',
    py: '[11px]',
});

const tableHeadCell = css({
    fontSize: '2xs',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: '[0.06em]',
    color: 'text.tertiary',
});

const tableFooter = css({
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
});

const tableRowRoot = css({
    display: 'grid',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '4',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    px: '[18px]',
    py: '[14px]',
    transitionProperty: 'color, background-color',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _last: {borderBottomWidth: '0'},
    _hover: {bg: 'bg.surface'},
});

const tableRowNameCell = css({display: 'flex', minW: '0', alignItems: 'center', gap: '3'});

const tableRowNameBlock = css({minW: '0'});

const tableRowName = css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 'sm-body',
    fontWeight: 'medium',
    color: 'text.primary',
});

const tableRowEmail = css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 'xs',
    color: 'text.tertiary',
});

const tableRowAgeWrapper = css({
    position: 'relative',
    cursor: 'help',
    '&:hover [data-age-tooltip]': {opacity: '1'},
});

const tableRowAge = css({fontFamily: 'mono', fontSize: 'sm-body', fontVariantNumeric: 'tabular-nums', color: 'text.primary'});

const tableRowAgeUnit = css({ml: '0.5', color: 'text.tertiary'});

const tableRowAgeTooltip = css({
    pointerEvents: 'none',
    position: 'absolute',
    left: '0',
    top: '[calc(100%+6px)]',
    zIndex: '10',
    whiteSpace: 'nowrap',
    rounded: '[6px]',
    bg: 'text.primary',
    px: '2',
    py: '1',
    fontFamily: 'mono',
    fontSize: '2xs',
    fontVariantNumeric: 'tabular-nums',
    color: 'bg.card',
    opacity: '0',
    transitionProperty: 'opacity',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
});

const tableRowDocument = css({fontFamily: 'mono', fontSize: 'sm', fontVariantNumeric: 'tabular-nums', color: 'text.secondary'});

const tableRowInsuranceBadge = css({
    display: 'inline-flex',
    alignItems: 'center',
    rounded: 'badge',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
    px: '2',
    py: '0.5',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.secondary',
});

const tableRowInsuranceEmpty = css({fontSize: 'xs', color: 'text.tertiary'});

const tableRowActionWrapper = css({position: 'relative', display: 'flex', justifyContent: 'flex-end'});

const tableRowActionBtn = css({
    display: 'flex',
    w: '8',
    h: '8',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[8px]',
    color: 'text.tertiary',
    transitionProperty: 'all',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _hover: {bg: 'bg.card', color: 'text.primary'},
});

const tableRowDangerItem = css({
    color: 'danger',
    _hover: {bg: 'danger.surface'},
    _focus: {bg: 'danger.surface'},
});

const tableRowSkeletonRoot = css({
    display: 'grid',
    alignItems: 'center',
    gap: '4',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    px: '[18px]',
    py: '[14px]',
    _last: {borderBottomWidth: '0'},
});

const tableRowSkeletonNameCell = css({display: 'flex', alignItems: 'center', gap: '3'});

const tableRowSkeletonAvatar = css({w: '8', h: '8', flexShrink: '0', rounded: 'full'});

const tableRowSkeletonStatusBadge = css({h: '5', w: '20', rounded: 'full'});

const tableRowSkeletonBadgeSm = css({h: '5', w: '6', rounded: 'full'});

const tableRowSkeletonActionBtn = css({ml: 'auto', w: '7', h: '7', rounded: '[8px]'});

const patientCardRoot = css({
    display: 'flex',
    cursor: 'pointer',
    flexDirection: 'column',
    gap: '3',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    p: '4',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _hover: {borderColor: 'border.hover'},
});

const patientCardTop = css({display: 'flex', alignItems: 'flex-start', gap: '3'});

const patientCardNameBlock = css({minW: '0', flex: '1'});

const patientCardName = css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 'sm-body',
    fontWeight: 'medium',
    color: 'text.primary',
});

const patientCardMeta = css({mt: '0.5', fontSize: 'xs', color: 'text.tertiary'});

const patientCardDetails = css({display: 'flex', flexDirection: 'column', gap: '1.5'});

const patientCardDetailRow = css({display: 'flex', alignItems: 'center', justifyContent: 'space-between'});

const patientCardDetailLabel = css({fontSize: '2xs', color: 'text.tertiary'});

const patientCardDetailValue = css({fontFamily: 'mono', fontSize: '2xs', fontVariantNumeric: 'tabular-nums', color: 'text.secondary'});

const skeletonCardRoot = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    p: '4',
});

const skeletonCardTop = css({display: 'flex', alignItems: 'center', gap: '3'});

const skeletonCardNameBlock = css({flex: '1', display: 'flex', flexDirection: 'column', gap: '1.5'});

const skeletonCardDetails = css({display: 'flex', flexDirection: 'column', gap: '2'});

const skeletonCardAvatar = css({w: '10', h: '10', flexShrink: '0', rounded: 'full'});

const cardsGrid = css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '3',
});

const cardsFooter = css({
    mt: '3.5',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
});

const paginationRoot = css({display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: '[18px]', py: '[14px]'});

const paginationInfo = css({fontSize: 'sm', color: 'text.secondary'});

const paginationInfoStrong = css({fontWeight: 'medium', fontVariantNumeric: 'tabular-nums', color: 'text.primary'});

const paginationControls = css({display: 'flex', alignItems: 'center', gap: '1'});

const paginationBtnDisabled = css({
    display: 'inline-flex',
    h: '8',
    minW: '8',
    cursor: 'not-allowed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1',
    rounded: '[8px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    px: '2.5',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.secondary',
    opacity: '0.45',
});

const paginationBtnActive = css({
    display: 'inline-flex',
    h: '8',
    minW: '8',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[8px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'primary',
    bg: 'primary',
    px: '2.5',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'white',
});

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
        <div className={tableRowRoot} style={{gridTemplateColumns: TABLE_COLS}} onClick={onClick}>
            <div className={tableRowNameCell}>
                <PatientAvatar name={patient.name} id={patient.id} />
                <div className={tableRowNameBlock}>
                    <p className={tableRowName}>{patient.name}</p>
                    <p className={tableRowEmail}>{typeof patient.email === 'string' ? patient.email : '—'}</p>
                </div>
            </div>

            <div className={tableRowAgeWrapper}>
                <span className={tableRowAge}>
                    {age !== null ? (
                        <>
                            {age}
                            <span className={tableRowAgeUnit}> anos</span>
                        </>
                    ) : (
                        '—'
                    )}
                </span>
                {age !== null && (
                    <span data-age-tooltip className={tableRowAgeTooltip}>
                        Nasc. {formatBirthDate(patient.birthDate)}
                    </span>
                )}
            </div>

            <p className={tableRowDocument}>{patient.documentId}</p>

            {patient.insurancePlan ? (
                <span className={tableRowInsuranceBadge}>{patient.insurancePlan.name}</span>
            ) : (
                <span className={tableRowInsuranceEmpty}>—</span>
            )}

            <GenderBadge gender={patient.gender} />

            <div className={tableRowActionWrapper} onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button type="button" aria-label="Ações" className={tableRowActionBtn}>
                            <MoreHorizontal className={icon4} strokeWidth={1.5} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onClick}>
                            <UserRound className={icon35} />
                            Ver perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Pencil className={icon35} />
                            Editar cadastro
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <CalendarPlus className={icon35} />
                            Agendar consulta
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className={tableRowDangerItem}>
                            <Archive className={icon35} />
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
        <div className={tableRowSkeletonRoot} style={{gridTemplateColumns: TABLE_COLS}}>
            <div className={tableRowSkeletonNameCell}>
                <Skeleton className={tableRowSkeletonAvatar} />
                <div className={skeletonTextStack}>
                    <Skeleton className={skeletonH3_5W32} />
                    <Skeleton className={skeletonH3W24} />
                </div>
            </div>
            <Skeleton className={skeletonH4W8} />
            <Skeleton className={skeletonH4W28} />
            <Skeleton className={tableRowSkeletonStatusBadge} />
            <Skeleton className={tableRowSkeletonBadgeSm} />
            <Skeleton className={tableRowSkeletonActionBtn} />
        </div>
    );
}

function PatientCard({patient, onClick}: {patient: Patient; onClick: () => void}) {
    const age = getAge(patient.birthDate);

    return (
        <div className={patientCardRoot} onClick={onClick}>
            <div className={patientCardTop}>
                <PatientAvatar name={patient.name} id={patient.id} size="lg" />
                <div className={patientCardNameBlock}>
                    <p className={patientCardName}>{patient.name}</p>
                    <p className={patientCardMeta}>
                        {age !== null ? `${age} anos` : '—'} · {typeof patient.email === 'string' ? patient.email : '—'}
                    </p>
                </div>
            </div>
            <div className={patientCardDetails}>
                <div className={patientCardDetailRow}>
                    <span className={patientCardDetailLabel}>Documento</span>
                    <span className={patientCardDetailValue}>{patient.documentId}</span>
                </div>
                <div className={patientCardDetailRow}>
                    <span className={patientCardDetailLabel}>Convênio</span>
                    <span className={patientCardDetailValue}>{patient.insurancePlan?.name ?? '—'}</span>
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className={skeletonCardRoot}>
            <div className={skeletonCardTop}>
                <Skeleton className={skeletonCardAvatar} />
                <div className={skeletonCardNameBlock}>
                <Skeleton className={skeletonH4W28} />
                <Skeleton className={skeletonH3W24} />
            </div>
        </div>
        <div className={skeletonCardDetails}>
            <Skeleton className={skeletonH3Full} />
            <Skeleton className={skeletonH3Full} />
        </div>

        </div>
    );
}

function Pagination({from, to, total}: {from: number; to: number; total: number}) {
    return (
        <div className={paginationRoot}>
            <p className={paginationInfo}>
                Mostrando <strong className={paginationInfoStrong}>{from}</strong>–
                <strong className={paginationInfoStrong}>{to}</strong> de{' '}
                <strong className={paginationInfoStrong}>{total}</strong> pacientes
            </p>
            <div className={paginationControls}>
                <button type="button" disabled className={paginationBtnDisabled}>
                    <ChevronLeft className={icon35} />
                    Anterior
                </button>
                <button type="button" className={paginationBtnActive}>
                    1
                </button>
                <button type="button" disabled className={paginationBtnDisabled}>
                    Próxima
                    <ChevronRight className={icon35} />
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
}) {
    if (!isLoading && patients.length === 0) {
        return (
            <EmptyStateCard
                icon={<SearchX className={icon6} strokeWidth={1.5} />}
                title="Nenhum paciente encontrado"
                description={
                    search ? `Nenhum resultado para "${search}"` : 'Ajuste os filtros para ver mais resultados'
                }
                action={
                    <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                        <X className={icon4} />
                        Limpar busca
                    </Button>
                }
            />
        );
    }

    if (layout === 'table') {
        return (
            <div className={tableRoot}>
                <div className={tableHead} style={{gridTemplateColumns: TABLE_COLS}}>
                    {['Paciente', 'Idade', 'Documento', 'Convênio', 'Gênero', ''].map((h, i) => (
                        <span key={i} className={tableHeadCell}>
                            {h}
                        </span>
                    ))}
                </div>

                {isLoading
                    ? Array.from({length: 8}).map((_, i) => <SkeletonTableRow key={i} />)
                    : patients.map((p) => <PatientTableRow key={p.id} patient={p} onClick={() => onOpen(p)} />)}

                <div className={tableFooter}>
                    <Pagination from={Math.min(1, patients.length)} to={patients.length} total={totalCount} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={cardsGrid}>
                {isLoading
                    ? Array.from({length: 6}).map((_, i) => <SkeletonCard key={i} />)
                    : patients.map((p) => <PatientCard key={p.id} patient={p} onClick={() => onOpen(p)} />)}
            </div>
            <div className={cardsFooter}>
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
            <span className={monoNums}>{statsQuery.isLoading ? '…' : totalAll}</span>
            {' pacientes ativos no consultório'}
        </span>
    );

    return (
        <Page
            title="Pacientes"
            subtitle={subtitle}
            actions={
                <Button size="sm" onClick={() => navigate({to: '/patients/new'})}>
                    <Plus className={icon4} />
                    Novo paciente
                </Button>
            }
        >
            {/* Stats */}
            <div className={statsGrid}>
                <StatTile
                    label="Total de pacientes"
                    value={totalAll}
                    delta={
                        <span>
                            <span className={statsDelta}>+4</span> nos últimos 30 dias
                        </span>
                    }
                    loading={statsQuery.isLoading}
                    icon={<Users className={icon4} strokeWidth={1.5} />}
                    iconIntent="primary"
                />
                <StatTile
                    label="Total de consultas"
                    value={totalAppointments ?? 0}
                    loading={appointmentsQuery.isLoading}
                    icon={<CalendarDays className={icon4} strokeWidth={1.5} />}
                    iconIntent="info"
                />
                <StatTile
                    label="Pré-evoluções IA"
                    value="—"
                    delta="conectar módulo IA"
                    loading={false}
                    icon={<Sparkles className={icon4} strokeWidth={1.5} />}
                    iconIntent="ai"
                />
            </div>

            {/* Toolbar */}
            <div className={toolbarRoot}>
                <div className={toolbarSearch}>
                    <Search className={toolbarSearchIcon} strokeWidth={1.5} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou documento…"
                        aria-label="Buscar pacientes"
                        className={toolbarSearchInput}
                    />
                    <span className={toolbarSearchKbd}>⌘K</span>
                </div>

                <SegmentedControl value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SegmentedControl.Item value="all">Todos</SegmentedControl.Item>
                    <SegmentedControl.Item value="active">Ativos</SegmentedControl.Item>
                    <SegmentedControl.Item value="inactive">Inativos</SegmentedControl.Item>
                </SegmentedControl>

                <SegmentedControl value={layout} onValueChange={(v) => setLayout(v as Layout)}>
                    <SegmentedControl.Item value="table" title="Tabela">
                        <Rows3 className={icon15} />
                    </SegmentedControl.Item>
                    <SegmentedControl.Item value="cards" title="Cards">
                        <LayoutGrid className={icon15} />
                    </SegmentedControl.Item>
                </SegmentedControl>

                {hasFilters && (
                    <button type="button" className={toolbarClearBtn} onClick={clearFilters}>
                        <X className={toolbarClearIcon} />
                        Limpar filtros
                    </button>
                )}

                <span className={toolbarCount}>
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
