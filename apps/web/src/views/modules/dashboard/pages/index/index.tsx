import {
    useGetCurrentUser,
    useSearchAppointments,
    useSearchRecords,
    AppointmentStatus,
    AppointmentType,
    type Appointment,
    type Record as ClinicalRecord,
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
import {cva} from 'class-variance-authority';
import {Button} from '@/components/ui/componentes/button';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Page} from '@/views/components/Page';
import styles from './styles.module.css';

const statIcon = cva(styles.statIconBase, {
    variants: {
        tone: {
            neutral: styles.statIconNeutral,
            success: styles.statIconSuccess,
            muted: styles.statIconMuted,
            primary: styles.statIconPrimary,
        },
    },
    defaultVariants: {tone: 'neutral'},
});

const statusBadge = cva(styles.statusBadgeBase, {
    variants: {
        status: {
            SCHEDULED: styles.statusBadgeScheduled,
            CONFIRMED: styles.statusBadgeConfirmed,
            COMPLETED: styles.statusBadgeCompleted,
            CANCELLED: styles.statusBadgeCancelled,
            NO_SHOW: styles.statusBadgeNoShow,
            ARRIVED: styles.statusBadgeArrived,
            IN_PROGRESS: styles.statusBadgeInProgress,
        },
    },
    defaultVariants: {status: 'SCHEDULED'},
});

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_stackedLayout/dashboard')({
    component: DashboardPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaginatedPage<T> {
    data: T[];
    totalCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(iso: string) {
    return iso.slice(0, 10); // YYYY-MM-DD
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

const ACTIVE_STATUSES = new Set([
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_PROGRESS,
]);

// ─── Page ────────────────────────────────────────────────────────────────────

export function DashboardPage() {
    const navigate = useNavigate();

    // Current user
    const userQuery = useGetCurrentUser();
    const user = userQuery.data;
    const firstName = user?.name?.split(' ')[0] ?? '…';

    // Appointments — fetch a generous batch, filter client-side
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

    // Recent records (evolutions)
    const recentQuery = useSearchRecords({
        term: '',
        limit: 5,
        cursor: null,
        patientId: '',
        attendanceType: undefined as unknown as string,
        clinicalStatus: undefined as unknown as string,
        dateStart: '',
        dateEnd: '',
        source: undefined as unknown as string,
        sort: {eventDate: 'desc'},
    }) as unknown as UseQueryResult<PaginatedPage<ClinicalRecord>>;

    const recentRecords = recentQuery.data?.data ?? [];
    const isLoading = apptQuery.isLoading || userQuery.isLoading;

    return (
        <Page title="Dashboard" className={styles.page}>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className={styles.header}>
                <div>
                    {isLoading ? (
                        <Skeleton className={styles.skeletonGreeting} />
                    ) : (
                        <h1 className={styles.greeting}>
                            {greeting()}, {firstName}
                        </h1>
                    )}
                    <p className={styles.dateLabel}>{fmtFullDate()}</p>
                </div>
                <div className={styles.agentBadge}>
                    <span className={styles.agentDot} />
                    <span className={styles.agentLabel}>Agente IA ativo</span>
                    <Sparkles size={12} />
                </div>
            </div>

            {/* ── Stats ──────────────────────────────────────────────────────── */}
            <div className={styles.statsGrid}>
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

            {/* ── Two-column body ────────────────────────────────────────────── */}
            <div className={styles.cols}>
                {/* Left column */}
                <div className={styles.colMain}>
                    {/* Today's appointments */}
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHead}>
                            <div>
                                <div className={styles.sectionTitle}>Consultas de hoje</div>
                                {counts.total > 0 && (
                                    <div className={styles.sectionSub}>
                                        {counts.total}{' '}
                                        {counts.total === 1 ? 'consulta agendada' : 'consultas agendadas'}
                                    </div>
                                )}
                            </div>
                            <button type="button" className={styles.secLink} onClick={() => navigate({to: '/appointments'})}>
                                Ver agenda <ArrowUpRight size={12} />
                            </button>
                        </div>
                        <div className={styles.sectionBody}>
                            {/* eslint-disable-next-line no-nested-ternary -- loading/empty/list pattern is a clear render branch */}
                            {isLoading ? (
                                <AppointmentSkeleton rows={3} />
                            ) : todayAppts.length === 0 ? (
                                <div className={styles.empty}>
                                    <CalendarX2 size={28} className={styles.emptyIcon} />
                                    <div className={styles.emptyTitle}>Sem consultas hoje</div>
                                    <p className={styles.emptySub}>
                                        Aproveite para revisar pendências ou criar novos agendamentos.
                                    </p>
                                </div>
                            ) : (
                                <div className={styles.apptList}>
                                    {todayAppts.map((apt) => (
                                        <ApptRow key={apt.id} apt={apt} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Recent records */}
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHead}>
                            <div>
                                <div className={styles.sectionTitle}>Atividade recente</div>
                                <div className={styles.sectionSub}>Últimas evoluções registradas</div>
                            </div>
                            <button type="button" className={styles.secLink}>
                                Ver todas <ArrowUpRight size={12} />
                            </button>
                        </div>
                        <div className={styles.sectionBody}>
                            {/* eslint-disable-next-line no-nested-ternary -- loading/empty/list pattern is a clear render branch */}
                            {recentQuery.isLoading ? (
                                <div className={styles.skeletonListCol}>
                                    {Array.from({length: 3}).map((_, i) => (
                                        <div key={i} className={styles.skeletonListRow}>
                                            <Skeleton className={styles.skeletonAvatar} />
                                            <div className="flex-1">
                                                <Skeleton className={styles.skeletonNameMd} />
                                                <Skeleton className="h-3 w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentRecords.length === 0 ? (
                                <div className={styles.empty}>
                                    <FileText size={24} className={styles.emptyIcon} />
                                    <div className={styles.emptyTitle}>Nenhuma evolução registrada</div>
                                </div>
                            ) : (
                                <div className={styles.evolList}>
                                    {recentRecords.map((rec) => (
                                        <RecentRecordRow key={rec.id} record={rec} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right column */}
                <div className={styles.colSide}>
                    {/* Quick actions */}
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHead}>
                            <div className={styles.sectionTitle}>Ações rápidas</div>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.qaGrid}>
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
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHead}>
                            <div>
                                <div className={styles.sectionTitle}>Próximas consultas</div>
                                <div className={styles.sectionSub}>A partir de amanhã</div>
                            </div>
                            <button type="button" className={styles.secLink} onClick={() => navigate({to: '/appointments'})}>
                                Ver agenda <ArrowUpRight size={12} />
                            </button>
                        </div>
                        <div className={styles.sectionBody}>
                            {/* eslint-disable-next-line no-nested-ternary -- loading/empty/list pattern is a clear render branch */}
                            {isLoading ? (
                                <AppointmentSkeleton rows={3} compact />
                            ) : upcomingAppts.length === 0 ? (
                                <div className={styles.empty}>
                                    <CalendarX2 size={22} className={styles.emptyIcon} />
                                    <div className={styles.emptyTitle}>Nenhuma consulta agendada</div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate({to: '/appointments'})}
                                        className="mt-1"
                                    >
                                        <CalendarPlus size={13} />
                                        Criar agendamento
                                    </Button>
                                </div>
                            ) : (
                                <div className={styles.upList}>
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

// ─── Sub-components ──────────────────────────────────────────────────────────

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
        <div className={styles.statCard}>
            <div className={statIcon({tone})}>{icon}</div>
            <div>
                {loading ? <Skeleton className={styles.skeletonStatValue} /> : <div className={styles.statValue}>{value}</div>}
                <div className={styles.statLabel}>{label}</div>
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
        <div className={styles.apptRow}>
            {/* Time */}
            <div className={styles.apptTime}>
                <span className={styles.apptTimeStart}>{start}</span>
                <span className={styles.apptTimeEnd}>{end}</span>
            </div>

            {/* Patient placeholder (no patient enrichment here) */}
            <div className={styles.apptPatBtn}>
                <div className={styles.patientInitialsAvatar}>—</div>
                <div className="min-w-0">
                    <div className={styles.apptPatName}>Paciente</div>
                    <div className={styles.apptPatType}>{TYPE_LABELS[apt.type] ?? apt.type}</div>
                </div>
            </div>

            {/* Status badge */}
            <span className={statusBadge({status})}>
                <span className={styles.statusDot} />
                {STATUS_LABELS[status] ?? status}
            </span>

            {/* Action */}
            {isActive && (
                <Button size="sm" variant="outline" className={styles.apptStartBtn}>
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
              const [_y, m, d] = (record.eventDate as string).split('-').map(Number);
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
        <div className={styles.evolRow}>
            <div className={styles.patientInitialsAvatar}>P</div>
            <div className={styles.evolBody}>
                <div className={styles.evolMeta}>
                    {dateLabel && <span className={styles.evolDate}>{dateLabel}</span>}
                    {record.attendanceType && (
                        <>
                            <span>·</span>
                            <span>{record.attendanceType}</span>
                        </>
                    )}
                    {record.source === 'AI' && (
                        <span className={styles.aiBadge}>
                            <Sparkles size={9} />
                            Origem IA
                        </span>
                    )}
                </div>
                <div className={styles.evolExcerpt}>{excerpt}</div>
            </div>
        </div>
    );
}

function UpcomingRow({apt}: {apt: Appointment}) {
    const dateStr = toDateStr(apt.startAt);
    const dayLabel = fmtDayLabel(dateStr);
    const timeLabel = fmtTime(apt.startAt);

    return (
        <div className={styles.upRow}>
            <div className={styles.upDate}>
                <span className={styles.upDay}>{dayLabel}</span>
                <span className={styles.upTime}>{timeLabel}</span>
            </div>
            <div className={styles.upInfo}>
                <div className={styles.upName}>Paciente</div>
                <div className={styles.upType}>{TYPE_LABELS[apt.type] ?? apt.type}</div>
            </div>
            <ChevronRight size={14} className={styles.upChevron} />
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
        <button type="button" className={styles.qaBtn} onClick={onClick}>
            <span className={styles.qaIcon}>{icon}</span>
            <div>
                <div className={styles.qaLabel}>{label}</div>
                {sub && <div className={styles.qaSub}>{sub}</div>}
            </div>
        </button>
    );
}

function AppointmentSkeleton({rows, compact}: {rows: number; compact?: boolean}) {
    return (
        <div className={styles.skeletonApptCol}>
            {Array.from({length: rows}).map((_, i) => (
                <div key={i} className={styles.skeletonApptRow}>
                    {!compact && <Skeleton className="h-9 w-12" />}
                    <Skeleton className={styles.skeletonAvatar} />
                    <div className="flex-1">
                        <Skeleton className={styles.skeletonNameSm} />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className={styles.skeletonStatusBadge} />
                </div>
            ))}
        </div>
    );
}
