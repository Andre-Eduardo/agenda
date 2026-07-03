import {
    useGetCurrentUser,
    useSearchAppointments,
    useSearchRecords,
    AppointmentStatus,
    AppointmentType,
    type Appointment,
    type Record as ClinicalRecord,
    type SearchRecordsAttendanceType,
    type SearchRecordsClinicalStatus,
    type SearchRecordsSource,
} from '@agenda-app/client';
import type {UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {
    ArrowUpRight,
    CalendarX2,
    CalendarPlus,
    CheckCircle2,
    ChevronRight,
    CircleCheckBig,
    Clock,
    FileText,
    Sparkles,
    Stethoscope,
    UserPlus,
} from 'lucide-react';
import {Button} from '@/components/ui/componentes/button';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Page} from '@/views/components/Page';
import {css, cva} from '@/styled-system/css';
import {flex1, minW0, mt1, skeletonH3Full, skeletonH3W20, skeletonH9W12} from './styles';

// ── Styles ────────────────────────────────────────────────────────────────────

const page = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
    p: '6',
    maxW: '[1200px]',
    mx: 'auto',
    w: 'full',
});

const header = css({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '4',
    flexWrap: 'wrap',
});

const greetingText = css({
    fontSize: '[22px]',
    fontWeight: 'medium',
    color: 'text.primary',
    lineHeight: 'snug',
});

const dateLabel = css({
    fontSize: 'sm',
    color: 'text.secondary',
    mt: '0.5',
});

const agentBadge = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    px: '3',
    py: '1.5',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'ai.border',
    bg: 'ai.bg',
    fontSize: 'xs',
    color: 'ai.text',
});

const agentDot = css({
    w: '1.5',
    h: '1.5',
    rounded: 'full',
    bg: 'ai.badgeBg',
});

const agentLabel = css({
    color: 'text.secondary',
});

const statsGrid = css({
    display: 'grid',
    gridTemplateColumns: {base: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))'},
    gap: '3',
});

const statCard = css({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    p: '4',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
});

const statIcon = cva({
    base: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        w: '9',
        h: '9',
        rounded: '[8px]',
        flexShrink: '0',
    },
    variants: {
        tone: {
            neutral: {bg: 'text.secondary/10', color: 'text.secondary'},
            success: {bg: 'success/10', color: 'success'},
            muted: {bg: 'text.tertiary/10', color: 'text.tertiary'},
            primary: {bg: 'primary/10', color: 'primary'},
        },
    },
    defaultVariants: {tone: 'neutral'},
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
    mt: '1',
});

const cols = css({
    display: 'grid',
    gridTemplateColumns: {base: 'repeat(1, minmax(0, 1fr))', lg: '1fr 340px'},
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
    fontSize: '[11px]',
    color: 'text.tertiary',
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
    color: 'primary',
    transitionProperty: 'color',
    transitionDuration: 'base',
    _hover: {color: 'primary/80'},
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
    transitionProperty: 'opacity',
    transitionDuration: 'base',
    textAlign: 'left',
    _hover: {opacity: '0.75'},
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

const apptStartBtn = css({
    flexShrink: '0',
    gap: '1.5',
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

const evolList = css({display: 'flex', flexDirection: 'column', gap: '4'});

const evolRow = css({display: 'flex', alignItems: 'flex-start', gap: '3'});

const evolBody = css({flex: '1', minW: '0'});

const evolMeta = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    flexWrap: 'wrap',
    fontSize: '[11px]',
    color: 'text.tertiary',
});

const evolExcerpt = css({
    fontSize: 'xs',
    color: 'text.secondary',
    mt: '1',
    lineClamp: '2',
    lineHeight: 'relaxed',
});

const evolDate = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums'});

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
    alignItems: 'center',
    gap: '3',
    p: '3',
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
});

const qaSub = css({
    fontSize: '[10px]',
    color: 'text.tertiary',
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
    cursor: 'pointer',
    transitionProperty: 'opacity',
    transitionDuration: 'base',
    _first: {pt: '0'},
    _last: {pb: '0'},
    _hover: {opacity: '0.75'},
});

const upDate = css({display: 'flex', flexDirection: 'column', w: '14', flexShrink: '0'});

const upDay = css({fontSize: 'xs', fontWeight: 'medium', color: 'text.primary'});

const upTime = css({
    fontSize: '[11px]',
    color: 'text.tertiary',
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
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const upType = css({
    fontSize: '[11px]',
    color: 'text.secondary',
    mt: '0.5',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const upChevron = css({color: 'text.tertiary', flexShrink: '0'});

const skeletonGreeting = css({h: '7', w: '48', mb: '1'});
const skeletonStatValue = css({h: '6', w: '8', mb: '1'});
const skeletonListCol = css({display: 'flex', flexDirection: 'column', gap: '4'});
const skeletonListRow = css({display: 'flex', alignItems: 'flex-start', gap: '3'});
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
    return iso.slice(0, 10);
}

function todayStr() {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function fmtTime(iso: string) {
    const d = new Date(iso);

    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function greeting() {
    const h = new Date().getHours();

    if (h < 12) return 'Bom dia';

    if (h < 18) return 'Boa tarde';

    return 'Boa noite';
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

const ACTIVE_STATUSES = new Set<AppointmentStatus>([
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_PROGRESS,
]);

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
    const navigate = useNavigate();

    const userQuery = useGetCurrentUser();
    const user = userQuery.data;
    const firstName = user?.name?.split(' ')[0] ?? '…';

    const apptQuery = useSearchAppointments({
        term: '',
        limit: 200,
        cursor: null,
        sort: {startAt: 'asc'},
    }) as unknown as UseQueryResult<PaginatedPage<Appointment>>;

    const allAppts = apptQuery.data?.data ?? [];
    const today = todayStr();

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

    const recentQuery = useSearchRecords({
        term: '',
        limit: 5,
        cursor: null,
        patientId: '',
        attendanceType: undefined as unknown as SearchRecordsAttendanceType,
        clinicalStatus: undefined as unknown as SearchRecordsClinicalStatus,
        dateStart: '',
        dateEnd: '',
        source: undefined as unknown as SearchRecordsSource,
        sort: {eventDate: 'desc'},
    }) as unknown as UseQueryResult<PaginatedPage<ClinicalRecord>>;

    const recentRecords = recentQuery.data?.data ?? [];
    const isLoading = apptQuery.isLoading || userQuery.isLoading;

    return (
        <Page title="Dashboard" className={page}>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className={header}>
                <div>
                    {isLoading ? (
                        <Skeleton className={skeletonGreeting} />
                    ) : (
                        <h1 className={greetingText}>
                            {greeting()}, {firstName}
                        </h1>
                    )}
                    <p className={dateLabel}>{fmtFullDate()}</p>
                </div>
                <div className={agentBadge}>
                    <span className={agentDot} />
                    <span className={agentLabel}>Agente IA ativo</span>
                    <Sparkles size={12} />
                </div>
            </div>

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <div className={statsGrid}>
                <StatCard
                    label="Consultas hoje"
                    value={counts.total}
                    icon={<Clock size={16} />}
                    tone="neutral"
                    loading={isLoading}
                />
                <StatCard
                    label="Confirmadas"
                    value={counts.confirmed}
                    icon={<CheckCircle2 size={16} />}
                    tone="success"
                    loading={isLoading}
                />
                <StatCard
                    label="Realizadas"
                    value={counts.done}
                    icon={<CircleCheckBig size={16} />}
                    tone="muted"
                    loading={isLoading}
                />
                <StatCard
                    label="Pendentes"
                    value={counts.pending}
                    icon={<Clock size={16} />}
                    tone="primary"
                    loading={isLoading}
                />
            </div>

            {/* ── Two-column body ───────────────────────────────────────────── */}
            <div className={cols}>
                {/* Left column */}
                <div className={colMain}>
                    {/* Today's appointments */}
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
                                        <ApptRow key={apt.id} apt={apt} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Recent records */}
                    <section className={sectionCard}>
                        <div className={sectionHead}>
                            <div>
                                <div className={sectionTitle}>Atividade recente</div>
                                <div className={sectionSub}>Últimas evoluções registradas</div>
                            </div>
                            <button type="button" className={secLink}>
                                Ver todas <ArrowUpRight size={12} />
                            </button>
                        </div>
                        <div className={sectionBody}>
                            {/* eslint-disable-next-line no-nested-ternary -- loading/empty/list pattern is a clear render branch */}
                            {recentQuery.isLoading ? (
                                <div className={skeletonListCol}>
                                    {Array.from({length: 3}).map((_, i) => (
                                        <div key={i} className={skeletonListRow}>
                                            <Skeleton className={skeletonAvatar} />
                                            <div className={flex1}>
                                                <Skeleton className={skeletonNameMd} />
                                        <Skeleton className={skeletonH3Full} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentRecords.length === 0 ? (

                                <div className={empty}>
                                    <FileText size={24} className={emptyIcon} />
                                    <div className={emptyTitle}>Nenhuma evolução registrada</div>
                                </div>
                            ) : (
                                <div className={evolList}>
                                    {recentRecords.map((rec) => (
                                        <RecentRecordRow key={rec.id} record={rec} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
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
                                <QuickAction
                                    icon={<UserPlus size={16} />}
                                    label="Novo paciente"
                                    onClick={() => navigate({to: '/patients/new'})}
                                />
                                <QuickAction
                                    icon={<FileText size={16} />}
                                    label="Nova evolução"
                                    sub="Buscar paciente"
                                    onClick={() => navigate({to: '/patients'})}
                                />
                                <QuickAction
                                    icon={<CalendarPlus size={16} />}
                                    label="Novo agendamento"
                                    onClick={() => navigate({to: '/appointments'})}
                                />
                                <QuickAction
                                    icon={<Stethoscope size={16} />}
                                    label="Ver pacientes"
                                    onClick={() => navigate({to: '/patients'})}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Upcoming appointments */}
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate({to: '/appointments'})}
                                        className={mt1}
                                    >
                                        <CalendarPlus size={13} />
                                        Criar agendamento
                                    </Button>
                                </div>
                            ) : (
                                <div className={upList}>
                                    {upcomingAppts.map((apt) => (
                                        <UpcomingRow key={apt.id} apt={apt} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </Page>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon,
    tone,
    loading,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    tone: 'neutral' | 'success' | 'muted' | 'primary';
    loading?: boolean;
}) {
    return (
        <div className={statCard}>
            <div className={statIcon({tone})}>{icon}</div>
            <div>
                {loading ? (
                    <Skeleton className={skeletonStatValue} />
                ) : (
                    <div className={statValue}>{value}</div>
                )}
                <div className={statLabel}>{label}</div>
            </div>
        </div>
    );
}

function ApptRow({apt}: {apt: Appointment}) {
    const start = fmtTime(apt.startAt);
    const end = fmtTime(apt.endAt);
    const {status} = apt;
    const isActive = ACTIVE_STATUSES.has(status);

    return (
        <div className={apptRow}>
            <div className={apptTime}>
                <span className={apptTimeStart}>{start}</span>
                <span className={apptTimeEnd}>{end}</span>
            </div>

            <div className={apptPatBtn}>
                <div className={patientInitialsAvatar}>—</div>
                <div className={minW0}>
                    <div className={apptPatName}>Paciente</div>
                    <div className={apptPatType}>{TYPE_LABELS[apt.type] ?? apt.type}</div>
                </div>
            </div>

            <span className={statusBadge({status})}>
                <span className={statusDot} />
                {STATUS_LABELS[status] ?? status}
            </span>

            {isActive && (
                <Button size="sm" variant="outline" className={apptStartBtn}>
                    <Stethoscope size={12} />
                    Iniciar
                </Button>
            )}
        </div>
    );
}

function RecentRecordRow({record}: {record: ClinicalRecord}) {
    const dateLabel = record.eventDate
        ? (() => {
              const [_y, m, d] = record.eventDate.split('-').map(Number);
              const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

              return `${String(d).padStart(2, '0')} ${months[m - 1]}`;
          })()
        : '';

    const excerpt =
        (record.subjective as string | null) ??
        (record.description as string | null) ??
        (record.freeNotes as string | null) ??
        'Sem conteúdo';

    return (
        <div className={evolRow}>
            <div className={patientInitialsAvatar}>P</div>
            <div className={evolBody}>
                <div className={evolMeta}>
                    {dateLabel && <span className={evolDate}>{dateLabel}</span>}
                    {record.attendanceType && (
                        <>
                            <span>·</span>
                            <span>{record.attendanceType}</span>
                        </>
                    )}
                </div>
                <div className={evolExcerpt}>{excerpt}</div>
            </div>
        </div>
    );
}

function UpcomingRow({apt}: {apt: Appointment}) {
    const dateStr = toDateStr(apt.startAt);
    const dayLabel = fmtDayLabel(dateStr);
    const timeLabel = fmtTime(apt.startAt);

    return (
        <div className={upRow}>
            <div className={upDate}>
                <span className={upDay}>{dayLabel}</span>
                <span className={upTime}>{timeLabel}</span>
            </div>
            <div className={upInfo}>
                <div className={upName}>Paciente</div>
                <div className={upType}>{TYPE_LABELS[apt.type] ?? apt.type}</div>
            </div>
            <ChevronRight size={14} className={upChevron} />
        </div>
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
