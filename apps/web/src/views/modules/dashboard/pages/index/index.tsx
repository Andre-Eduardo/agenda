import {
    useGetCurrentClinicMember,
    useSearchOperationalAppointments,
    useSearchRecords,
    getGetPatientQueryOptions,
    AppointmentStatus,
    AppointmentType,
    type OperationalAppointment,
    type Patient,
    type Record as ClinicalRecord,
    type SearchRecordsParams,
} from '@agenda-app/client';
import {useQueries, type UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {ArrowUpRight, CalendarX2, CalendarPlus, ChevronRight, FileText, Stethoscope, UserPlus} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/componentes/button';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {useCan} from '@/hooks/useCan';
import {css, cva} from '@/styled-system/css';
import {Page} from '@/views/components/Page';
import {AttendanceQueue} from '@/views/modules/attendance/components/AttendanceQueue';
import {flex1, minW0, mt1, skeletonH3W20, skeletonH9W12} from './styles';

// ── Styles ────────────────────────────────────────────────────────────────────

const page = css({
    maxW: '[1280px]',
    mx: 'auto',
    w: 'full',
});

const content = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
});

const statsGrid = css({
    display: 'grid',
    gridTemplateColumns: {base: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))'},
    gap: '3',
});

const statCard = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2',
    p: '4',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    minW: '0',
});

const statValue = css({
    fontSize: '2xl',
    fontWeight: 'medium',
    color: 'text.primary',
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 'none',
});

const statLabel = css({
    fontSize: 'xs',
    color: 'text.secondary',
    mt: '0',
});

const cols = css({
    display: 'grid',
    gridTemplateColumns: {base: 'repeat(1, minmax(0, 1fr))', lg: 'minmax(0, 1fr) 340px'},
    gap: '6',
    alignItems: 'flex-start',
});

const colMain = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
});

const colSide = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
});

const sectionCard = css({
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    minW: '0',
});

const sectionHead = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4',
    px: '5',
    pt: '5',
    pb: '4',
});

const sectionTitle = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
});

const sectionSub = css({
    fontSize: 'xs',
    color: 'text.secondary',
    mt: '0.5',
});

const sectionBody = css({
    px: '5',
    pb: '5',
});

const secLink = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'primary.text',
    flexShrink: '0',
    transitionProperty: 'opacity',
    transitionDuration: 'base',
    _hover: {opacity: '0.8'},
});

const apptList = css({
    display: 'flex',
    flexDirection: 'column',
    '& > * + *': {
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'border',
    },
});

const apptRow = css({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    py: '3.5',
    _first: {pt: '0'},
    _last: {pb: '0'},
});

const apptTime = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    w: '12',
    flexShrink: '0',
});

const apptTimeStart = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.primary',
    lineHeight: 'none',
});

const apptTimeEnd = css({
    fontSize: '[11px]',
    color: 'text.tertiary',
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    mt: '0.5',
});

const apptPatBtn = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2.5',
    flex: '1',
    minW: '0',
    textAlign: 'left',
});

const apptPatName = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 'none',
});

const apptPatType = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    fontSize: '[11px]',
    color: 'text.tertiary',
    mt: '0.5',
});

const statusBadge = cva({
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1.5',
        rounded: 'full',
        px: '2',
        py: '0.5',
        fontSize: '[11px]',
        fontWeight: 'medium',
        flexShrink: '0',
    },
    variants: {
        status: {
            SCHEDULED: {bg: 'text.tertiary/10', color: 'text.secondary'},
            CONFIRMED: {bg: 'primary/10', color: 'primary'},
            COMPLETED: {bg: 'success/10', color: 'success'},
            CANCELLED: {bg: 'danger/10', color: 'danger'},
            NO_SHOW: {bg: 'warning/10', color: 'warning'},
            ARRIVED: {bg: 'primary/15', color: 'primary'},
            IN_PROGRESS: {bg: 'primary/15', color: 'primary'},
        },
    },
    defaultVariants: {status: 'SCHEDULED'},
});

const statusDot = css({
    w: '1.5',
    h: '1.5',
    rounded: 'full',
    bg: 'currentColor',
    flexShrink: '0',
});

const empty = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3',
    py: '8',
    textAlign: 'center',
});

const emptyIcon = css({color: 'text.tertiary'});

const emptyTitle = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
});

const emptySub = css({
    fontSize: 'xs',
    color: 'text.secondary',
    maxW: '[220px]',
});

const evolList = css({
    display: 'flex',
    flexDirection: 'column',
    '& > * + *': {
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'border',
    },
});

const evolRow = css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '3',
    py: '3.5',
    _first: {pt: '0'},
    _last: {pb: '0'},
    transitionProperty: 'background-color',
    transitionDuration: 'base',
    _hover: {bg: 'bg.surface'},
    _focusVisible: {outlineWidth: '2px', outlineStyle: 'solid', outlineColor: 'primary'},
});

const evolBody = css({flex: '1', minW: '0'});

const evolHeading = css({
    display: 'flex',
    alignItems: 'baseline',
    gap: '3',
});

const evolName = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
    overflow: 'hidden',
    lineClamp: '2',
    lineHeight: 'snug',
});

const evolMeta = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    flexWrap: 'wrap',
    fontSize: '[11px]',
    color: 'text.secondary',
    mt: '0.5',
});

const evolExcerpt = css({
    fontSize: 'xs',
    color: 'text.secondary',
    mt: '1',
    lineClamp: '2',
    lineHeight: 'relaxed',
});

const evolDate = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'});
const evolChevron = css({color: 'text.secondary', flexShrink: '0', alignSelf: 'center'});

const patientInitialsAvatar = css({
    display: 'flex',
    h: '8',
    w: '8',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    bg: 'text.tertiary/15',
    fontSize: '[11px]',
    fontWeight: 'medium',
    color: 'text.secondary',
});

const qaGrid = css({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '2',
});

const qaBtn = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '2',
    p: '3',
    minH: '[104px]',
    minW: '0',
    rounded: '[8px]',
    textAlign: 'left',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
    transitionProperty: 'all',
    transitionDuration: 'base',
    cursor: 'pointer',
    _hover: {bg: 'bg.card', borderColor: 'primary/30'},
});

const qaIcon = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    w: '8',
    h: '8',
    rounded: '[6px]',
    flexShrink: '0',
    bg: 'primary/10',
    color: 'primary',
});

const qaLabel = css({
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.primary',
    lineHeight: 'snug',
    overflowWrap: 'anywhere',
});

const qaSub = css({
    fontSize: '[11px]',
    color: 'text.secondary',
    mt: '0.5',
});

const upList = css({
    display: 'flex',
    flexDirection: 'column',
    '& > * + *': {
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'border',
    },
});

const upRow = css({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    py: '3',
    _first: {pt: '0'},
    _last: {pb: '0'},
    transitionProperty: 'background-color',
    transitionDuration: 'base',
    _hover: {bg: 'bg.surface'},
    _focusVisible: {outlineWidth: '2px', outlineStyle: 'solid', outlineColor: 'primary'},
});

const upDate = css({display: 'flex', flexDirection: 'column', w: '14', flexShrink: '0'});

const upDay = css({fontSize: 'xs', fontWeight: 'medium', color: 'text.primary'});

const upTime = css({
    fontSize: '[11px]',
    color: 'text.secondary',
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    mt: '0.5',
});

const upInfo = css({flex: '1', minW: '0'});

const upName = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
    overflow: 'hidden',
    lineClamp: '2',
    lineHeight: 'snug',
});

const upType = css({
    fontSize: '[11px]',
    color: 'text.secondary',
    mt: '0.5',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const upChevron = css({color: 'text.secondary', flexShrink: '0'});

const skeletonStatValue = css({h: '6', w: '8', mb: '1'});
const skeletonApptCol = css({display: 'flex', flexDirection: 'column', gap: '3'});
const skeletonApptRow = css({display: 'flex', alignItems: 'center', gap: '3'});
const skeletonAvatar = css({h: '8', w: '8', rounded: 'full', flexShrink: '0'});
const skeletonNameMd = css({h: '3.5', w: '32', mb: '1.5'});
const skeletonNameSm = css({h: '3.5', w: '28', mb: '1.5'});
const skeletonStatusBadge = css({h: '5', w: '20', rounded: 'full'});

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_stackedLayout/dashboard')({
    component: DashboardPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginatedPage<T> {
    data: T[];
    totalCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(iso: string) {
    const date = new Date(iso);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayStr() {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function fmtTime(iso: string) {
    const d = new Date(iso);

    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtFullDate() {
    const now = new Date();
    const weekdays = [
        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado',
    ];
    const months = [
        'janeiro',
        'fevereiro',
        'março',
        'abril',
        'maio',
        'junho',
        'julho',
        'agosto',
        'setembro',
        'outubro',
        'novembro',
        'dezembro',
    ];

    return `${weekdays[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
}

function fmtDayLabel(iso: string) {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    const diff = Math.round((dt.getTime() - today.getTime()) / 86_400_000);

    if (diff === 1) return 'Amanhã';
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    if (diff < 7) return weekdays[dt.getDay()];

    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

function fmtRecordDate(iso: string | null) {
    if (!iso) return '';

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);

    if (!match) return '';

    const month = Number(match[2]);
    const day = Number(match[3]);
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    if (month < 1 || month > 12 || day < 1 || day > 31) return '';

    return `${String(day).padStart(2, '0')} ${months[month - 1]}`;
}

function recordPreview(record: ClinicalRecord, emptyLabel: string) {
    const values: unknown[] = [record.subjective, record.description, record.freeNotes];
    const source = values.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
    const text = source?.replace(/\s+/g, ' ').trim() ?? emptyLabel;

    if (text.length <= 140) return text;

    const beforeLimit = text.slice(0, 140);
    const lastSpace = beforeLimit.lastIndexOf(' ');

    return `${beforeLimit.slice(0, lastSpace > 100 ? lastSpace : 140).trimEnd()}…`;
}

const STATUS_LABELS: Record<string, string> = {
    [AppointmentStatus.SCHEDULED]: 'Agendado',
    [AppointmentStatus.CONFIRMED]: 'Confirmado',
    [AppointmentStatus.COMPLETED]: 'Realizado',
    [AppointmentStatus.CANCELLED]: 'Cancelado',
    [AppointmentStatus.NO_SHOW]: 'Não compareceu',
    [AppointmentStatus.ARRIVED]: 'Chegou',
    [AppointmentStatus.IN_PROGRESS]: 'Em atendimento',
};

const TYPE_LABELS: Record<string, string> = {
    [AppointmentType.FIRST_VISIT]: 'Primeira consulta',
    [AppointmentType.RETURN]: 'Retorno',
    [AppointmentType.WALK_IN]: 'Urgência',
    [AppointmentType.TELEMEDICINE]: 'Teleconsulta',
    [AppointmentType.PROCEDURE]: 'Procedimento',
};

const RECORD_TYPE_LABELS: Record<string, string> = {
    FIRST_VISIT: 'Primeira consulta',
    FOLLOW_UP: 'Retorno',
    EVALUATION: 'Avaliação',
    PROCEDURE: 'Procedimento',
    TELEMEDICINE: 'Telemedicina',
    INTERCURRENCE: 'Intercorrência',
};

const ACTIVE_STATUSES = new Set<AppointmentStatus>([
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_PROGRESS,
]);

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
    const navigate = useNavigate();
    const canViewAppointments = useCan({has: 'appointment:view'});
    const canCreateAppointment = useCan({has: 'appointment:create'});
    const canViewRecords = useCan({has: 'record:view'});
    const canCreateRecord = useCan({hasAll: ['record:create', 'record:view', 'patient:view']});
    const canCreatePatient = useCan({has: 'patient:create'});
    const canViewPatients = useCan({has: 'patient:view'});
    const memberQuery = useGetCurrentClinicMember();
    // Quem atende vê os próprios pacientes que chegaram, para chamar e finalizar.
    const attendsPatients = memberQuery.data?.roles.includes('PROFESSIONAL') === true;

    const today = todayStr();
    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);

    const apptQuery = useSearchOperationalAppointments(
        {
            limit: 200,
            cursor: null,
            sort: {startAt: 'asc'},
            dateFrom: todayStart.toISOString(),
            dateTo: null,
        },
        {query: {enabled: canViewAppointments}}
    );

    const allAppts = canViewAppointments ? (apptQuery.data?.data ?? []) : [];

    const todayAppts = allAppts
        .filter((a) => toDateStr(a.startAt) === today)
        .sort((a, b) => a.startAt.localeCompare(b.startAt));

    const upcomingAppts = allAppts
        .filter((a) => toDateStr(a.startAt) > today && ACTIVE_STATUSES.has(a.status))
        .sort((a, b) => a.startAt.localeCompare(b.startAt))
        .slice(0, 5);

    const counts = {
        total: todayAppts.length,
        confirmed: todayAppts.filter((a) => a.status === AppointmentStatus.CONFIRMED).length,
        done: todayAppts.filter((a) => a.status === AppointmentStatus.COMPLETED).length,
        pending: todayAppts.filter((a) => ACTIVE_STATUSES.has(a.status)).length,
    };

    // SearchRecordsParams marks these filters as required strings even though the server
    // treats them as optional; omit rather than send '' (see patients/pages/detail).
    const recentQuery = useSearchRecords(
        {
            term: '',
            limit: 5,
            cursor: null,
            sort: {eventDate: 'desc'},
        } as SearchRecordsParams,
        {query: {enabled: canViewRecords}}
    ) as unknown as UseQueryResult<PaginatedPage<ClinicalRecord>>;

    const recentRecords = canViewRecords ? (recentQuery.data?.data ?? []) : [];
    const {isLoading} = apptQuery;
    const patientIds = [
        ...new Set([
            ...todayAppts.map((apt) => apt.patientId),
            ...upcomingAppts.map((apt) => apt.patientId),
            ...recentRecords.map((record) => record.patientId),
        ]),
    ];
    const patientQueries = useQueries({
        queries: canViewPatients
            ? patientIds.map((id) => getGetPatientQueryOptions(id, {query: {staleTime: 5 * 60_000}}))
            : [],
    });
    const patientsById = new Map<string, {patient?: Patient; loading: boolean}>(
        patientIds.map((id, index) => [
            id,
            {patient: patientQueries[index]?.data, loading: patientQueries[index]?.isPending ?? false},
        ])
    );

    return (
        <Page title="Hoje na clínica" subtitle={fmtFullDate()} className={page}>
            <div className={content}>
                {/* ── Stats ─────────────────────────────────────────────────────── */}
                {canViewAppointments && (
                    <div className={statsGrid}>
                        <StatCard label="Consultas hoje" value={counts.total} loading={isLoading} />
                        <StatCard label="Confirmadas" value={counts.confirmed} loading={isLoading} />
                        <StatCard label="Realizadas" value={counts.done} loading={isLoading} />
                        <StatCard label="Pendentes" value={counts.pending} loading={isLoading} />
                    </div>
                )}

                {/* ── Two-column body ───────────────────────────────────────────── */}
                <div className={cols}>
                    {/* Left column */}
                    <div className={colMain}>
                        {canViewAppointments && attendsPatients && <AttendanceQueue scope="mine" />}

                        {/* Today's appointments */}
                        {canViewAppointments && (
                            <section className={sectionCard}>
                                <div className={sectionHead}>
                                    <div>
                                        <div className={sectionTitle}>Consultas de hoje</div>
                                        {counts.total > 0 && (
                                            <div className={sectionSub}>
                                                {counts.total}{' '}
                                                {counts.total === 1 ? 'consulta agendada' : 'consultas agendadas'}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className={secLink}
                                        onClick={() => navigate({to: '/appointments'})}
                                    >
                                        Ver agenda <ArrowUpRight size={12} />
                                    </button>
                                </div>
                                <div className={sectionBody}>
                                    {/* eslint-disable-next-line no-nested-ternary -- loading/empty/list pattern is a clear render branch */}
                                    {isLoading ? (
                                        <AppointmentSkeleton rows={3} />
                                    ) : todayAppts.length === 0 ? (
                                        <div className={empty}>
                                            <CalendarX2 size={28} className={emptyIcon} />
                                            <div className={emptyTitle}>Sem consultas hoje</div>
                                            <p className={emptySub}>
                                                Aproveite para revisar pendências ou criar novos agendamentos.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className={apptList}>
                                            {todayAppts.map((apt) => (
                                                <ApptRow
                                                    key={apt.id}
                                                    apt={apt}
                                                    patientName={patientsById.get(apt.patientId)?.patient?.name}
                                                    patientLoading={patientsById.get(apt.patientId)?.loading}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Recent records */}
                        {recentRecords.length > 0 && (
                            <section className={sectionCard}>
                                <div className={sectionHead}>
                                    <div>
                                        <div className={sectionTitle}>Atividade recente</div>
                                        <div className={sectionSub}>Últimas evoluções registradas</div>
                                    </div>
                                </div>
                                <div className={sectionBody}>
                                    <div className={evolList}>
                                        {recentRecords.map((rec) => (
                                            <RecentRecordRow
                                                key={rec.id}
                                                record={rec}
                                                patientName={patientsById.get(rec.patientId)?.patient?.name}
                                                patientLoading={patientsById.get(rec.patientId)?.loading}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right column */}
                    <div className={colSide}>
                        {/* Quick actions */}
                        <section className={sectionCard}>
                            <div className={sectionHead}>
                                <div className={sectionTitle}>Ações rápidas</div>
                            </div>
                            <div className={sectionBody}>
                                <div className={qaGrid}>
                                    {canCreatePatient && (
                                        <QuickAction
                                            icon={<UserPlus size={16} />}
                                            label="Novo paciente"
                                            onClick={() => navigate({to: '/patients/new'})}
                                        />
                                    )}
                                    {canCreateRecord && (
                                        <QuickAction
                                            icon={<FileText size={16} />}
                                            label="Nova evolução"
                                            sub="Buscar paciente"
                                            onClick={() => navigate({to: '/patients'})}
                                        />
                                    )}
                                    {canCreateAppointment && (
                                        <QuickAction
                                            icon={<CalendarPlus size={16} />}
                                            label="Novo agendamento"
                                            onClick={() => navigate({to: '/appointments'})}
                                        />
                                    )}
                                    {canViewPatients && (
                                        <QuickAction
                                            icon={<Stethoscope size={16} />}
                                            label="Ver pacientes"
                                            onClick={() => navigate({to: '/patients'})}
                                        />
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Upcoming appointments */}
                        {canViewAppointments && (
                            <section className={sectionCard}>
                                <div className={sectionHead}>
                                    <div>
                                        <div className={sectionTitle}>Próximas consultas</div>
                                        <div className={sectionSub}>A partir de amanhã</div>
                                    </div>
                                    <button
                                        type="button"
                                        className={secLink}
                                        onClick={() => navigate({to: '/appointments'})}
                                    >
                                        Ver agenda <ArrowUpRight size={12} />
                                    </button>
                                </div>
                                <div className={sectionBody}>
                                    {/* eslint-disable-next-line no-nested-ternary -- loading/empty/list pattern is a clear render branch */}
                                    {isLoading ? (
                                        <AppointmentSkeleton rows={3} compact />
                                    ) : upcomingAppts.length === 0 ? (
                                        <div className={empty}>
                                            <CalendarX2 size={22} className={emptyIcon} />
                                            <div className={emptyTitle}>Nenhuma consulta agendada</div>
                                            {canCreateAppointment && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate({to: '/appointments'})}
                                                    className={mt1}
                                                >
                                                    <CalendarPlus size={13} />
                                                    Criar agendamento
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={upList}>
                                            {upcomingAppts.map((apt) => (
                                                <UpcomingRow
                                                    key={apt.id}
                                                    apt={apt}
                                                    patientName={patientsById.get(apt.patientId)?.patient?.name}
                                                    patientLoading={patientsById.get(apt.patientId)?.loading}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </Page>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({label, value, loading}: {label: string; value: number; loading?: boolean}) {
    return (
        <div className={statCard}>
            <div className={statLabel}>{label}</div>
            {loading ? <Skeleton className={skeletonStatValue} /> : <div className={statValue}>{value}</div>}
        </div>
    );
}

function ApptRow({
    apt,
    patientName,
    patientLoading,
}: {
    apt: OperationalAppointment;
    patientName?: string;
    patientLoading?: boolean;
}) {
    const {t} = useTranslation();
    const start = fmtTime(apt.startAt);
    const end = fmtTime(apt.endAt);
    const {status} = apt;

    return (
        <div className={apptRow}>
            <div className={apptTime}>
                <span className={apptTimeStart}>{start}</span>
                <span className={apptTimeEnd}>{end}</span>
            </div>

            <div className={apptPatBtn}>
                <div className={patientInitialsAvatar}>{patientName?.charAt(0).toUpperCase() ?? 'P'}</div>
                <div className={minW0}>
                    {patientLoading ? (
                        <Skeleton className={skeletonNameSm} />
                    ) : (
                        <div className={apptPatName}>{patientName ?? t('dashboard.patientUnavailable')}</div>
                    )}
                    <div className={apptPatType}>{TYPE_LABELS[apt.type] ?? apt.type}</div>
                </div>
            </div>

            <span className={statusBadge({status})}>
                <span className={statusDot} />
                {STATUS_LABELS[status] ?? status}
            </span>
        </div>
    );
}

function RecentRecordRow({
    record,
    patientName,
    patientLoading,
}: {
    record: ClinicalRecord;
    patientName?: string;
    patientLoading?: boolean;
}) {
    const {t} = useTranslation();
    const dateLabel = fmtRecordDate(record.eventDate ?? record.createdAt);
    const titleValue: unknown = record.title;
    const title = typeof titleValue === 'string' ? titleValue.trim() : '';
    const typeLabel = record.attendanceType
        ? (RECORD_TYPE_LABELS[record.attendanceType] ?? record.attendanceType)
        : t('dashboard.record');

    return (
        <Link
            to="/patients/$patientId/records/$recordId"
            params={{patientId: record.patientId, recordId: record.id}}
            className={evolRow}
            aria-label={t('dashboard.openRecord', {patient: patientName ?? t('dashboard.patient'), date: dateLabel})}
        >
            <div className={patientInitialsAvatar}>{patientName?.charAt(0).toUpperCase() ?? 'P'}</div>
            <div className={evolBody}>
                <div className={evolHeading}>
                    {patientLoading ? (
                        <Skeleton className={skeletonNameMd} />
                    ) : (
                        <span className={evolName}>{patientName ?? t('dashboard.patientUnavailable')}</span>
                    )}
                </div>
                <div className={evolMeta}>
                    {dateLabel && <span className={evolDate}>{dateLabel}</span>}
                    <span>{title || typeLabel}</span>
                </div>
                <div className={evolExcerpt}>{recordPreview(record, t('dashboard.noContent'))}</div>
            </div>
            <ChevronRight size={14} aria-hidden className={evolChevron} />
        </Link>
    );
}

function UpcomingRow({
    apt,
    patientName,
    patientLoading,
}: {
    apt: OperationalAppointment;
    patientName?: string;
    patientLoading?: boolean;
}) {
    const {t} = useTranslation();
    const dateStr = toDateStr(apt.startAt);
    const dayLabel = fmtDayLabel(dateStr);
    const timeLabel = fmtTime(apt.startAt);

    return (
        <Link
            to="/appointments"
            search={{date: dateStr, appointmentId: apt.id}}
            className={upRow}
            aria-label={t('dashboard.openAppointment', {
                patient: patientName ?? t('dashboard.patient'),
                date: dayLabel,
                time: timeLabel,
            })}
        >
            <div className={upDate}>
                <span className={upDay}>{dayLabel}</span>
                <span className={upTime}>{timeLabel}</span>
            </div>
            <div className={upInfo}>
                {patientLoading ? (
                    <Skeleton className={skeletonNameSm} />
                ) : (
                    <div className={upName}>{patientName ?? t('dashboard.patientUnavailable')}</div>
                )}
                <div className={upType}>{TYPE_LABELS[apt.type] ?? apt.type}</div>
            </div>
            <ChevronRight size={14} aria-hidden className={upChevron} />
        </Link>
    );
}

function QuickAction({
    icon,
    label,
    sub,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    sub?: string;
    onClick?: () => void;
}) {
    return (
        <button type="button" className={qaBtn} onClick={onClick}>
            <span className={qaIcon}>{icon}</span>
            <div>
                <div className={qaLabel}>{label}</div>
                {sub && <div className={qaSub}>{sub}</div>}
            </div>
        </button>
    );
}

function AppointmentSkeleton({rows, compact}: {rows: number; compact?: boolean}) {
    return (
        <div className={skeletonApptCol}>
            {Array.from({length: rows}).map((_, i) => (
                <div key={i} className={skeletonApptRow}>
                    {!compact && <Skeleton className={skeletonH9W12} />}
                    <Skeleton className={skeletonAvatar} />
                    <div className={flex1}>
                        <Skeleton className={skeletonNameSm} />
                        <Skeleton className={skeletonH3W20} />
                    </div>
                    <Skeleton className={skeletonStatusBadge} />
                </div>
            ))}
        </div>
    );
}
