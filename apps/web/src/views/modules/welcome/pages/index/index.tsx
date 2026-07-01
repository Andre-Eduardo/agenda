import type {ReactNode} from 'react';
import {useSearchPatients, useSearchAppointments} from '@agenda-app/client';
import type {Appointment} from '@agenda-app/client';
import type {UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {Play} from 'lucide-react';
import {Button} from '@/components/ui/componentes/button';
import {Card, CardContent, CardHeader} from '@/components/ui/componentes/card';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Page} from '@/views/components/Page';
import {css, cva} from '@/styled-system/css';

export const Route = createFileRoute('/_stackedLayout/')({
    component: DashboardPage,
});

// ── Void-cast helpers ────────────────────────────────────────────────────────

interface PatientPage {
    totalCount: number;
    data: unknown[];
}

interface AppointmentPage {
    totalCount: number;
    data: Appointment[];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const statsGrid = css({
    mb: '6',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '3',
});

const mainGrid = css({
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '4',
});

const statTileRoot = css({
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    px: '4',
    py: '[14px]',
});

const statTileLabel = css({
    fontSize: 'sm',
    lineHeight: '[1.4]',
    color: 'text.secondary',
});

const statTileValue = css({
    mt: '1',
    fontFamily: 'mono',
    fontSize: 'xl',
    fontWeight: 'medium',
    lineHeight: '[1.2]',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.primary',
});

const statTileDelta = css({
    mt: '0.5',
    fontSize: 'xs',
    lineHeight: '[1.4]',
    color: 'success',
});

const statTileSkeleton = css({
    mt: '1',
    h: '7',
    w: '14',
});

const clinicalBadgeDot = css({
    fontSize: '[8px]',
    lineHeight: '1',
});

const clinicalBadge = cva({
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1',
        rounded: 'badge',
        px: '[10px]',
        py: '1',
        fontSize: 'xs',
        fontWeight: 'medium',
    },
    variants: {
        variant: {
            'ai-soft': {
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'ai.border/30',
                bg: 'ai.bg',
                color: 'ai.text',
            },
            primary: {
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'primary.border',
                bg: 'primary.surface',
                color: 'primary.text',
            },
            neutral: {
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'border',
                bg: 'bg.surface',
                color: 'text.secondary',
            },
            info: {
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'info/30',
                bg: 'info.surface',
                color: 'info',
            },
        },
    },
    defaultVariants: {variant: 'neutral'},
});

const panelCardRoot = css({
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    boxShadow: 'none',
});

const panelCardHeader = css({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    px: '4',
    py: '3',
});

const panelCardTitle = css({
    fontSize: 'sm-body',
    fontWeight: 'medium',
    color: 'text.primary',
});

const panelCardContent = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
    px: '4',
    pb: '4',
    pt: '0',
});

const panelCardEmpty = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    py: '8',
    fontSize: 'sm',
    color: 'text.tertiary',
});

const appointmentTitle = css({
    fontSize: 'lead',
    fontWeight: 'medium',
    lineHeight: '[1.3]',
    color: 'text.primary',
});

const appointmentTime = css({
    mt: '[2px]',
    fontFamily: 'mono',
    fontSize: 'xs',
    lineHeight: '[1.4]',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.secondary',
});

const appointmentBadgeRow = css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5',
});

const appointmentActionRow = css({
    mt: '1',
    display: 'flex',
    gap: '2',
});

const appointmentSkeletonStack = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
});

// ── Sub-components ────────────────────────────────────────────────────────────

function StatTile({
    label,
    value,
    delta,
    loading = false,
}: {
    label: string;
    value: string | number;
    delta?: string;
    loading?: boolean;
}) {
    return (
        <div className={statTileRoot}>
            <p className={statTileLabel}>{label}</p>

            {loading ? (
                <Skeleton className={statTileSkeleton} />
            ) : (
                <p className={statTileValue}>{value}</p>
            )}

            {delta && !loading && <p className={statTileDelta}>{delta}</p>}
        </div>
    );
}

function ClinicalBadge({
    variant = 'neutral',
    children,
    dot,
}: {
    variant?: 'ai-soft' | 'primary' | 'neutral' | 'info';
    children: ReactNode;
    dot?: boolean;
}) {
    return (
        <span className={clinicalBadge({variant})}>
            {dot && <span className={clinicalBadgeDot}>●</span>}
            {children}
        </span>
    );
}

function appointmentTypeLabel(type: Appointment['type']): string {
    const map: Record<string, string> = {
        FIRST_VISIT: 'Primeira consulta',
        RETURN: 'Retorno',
        WALK_IN: 'Encaixe',
        TELEMEDICINE: 'Telemedicina',
        PROCEDURE: 'Procedimento',
    };

    return map[type] ?? type;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
}

function minutesUntil(iso: string): number {
    return Math.floor((new Date(iso).getTime() - Date.now()) / 60_000);
}

function getPageSubtitle(appointmentsTotal: number | undefined, isLoading: boolean) {
    const now = new Date();
    const dayName = now.toLocaleDateString('pt-BR', {weekday: 'long'});
    const dayMonth = now.toLocaleDateString('pt-BR', {day: 'numeric', month: 'long'});
    const capitalDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    let apptPart = '';

    if (isLoading) {
        apptPart = 'carregando…';
    } else if (appointmentsTotal !== undefined) {
        apptPart = `${appointmentsTotal} consultas agendadas`;
    }

    return `${capitalDay}, ${dayMonth}${apptPart ? ` · ${apptPart}` : ''}`;
}

function NextAppointmentContent({
    isLoading,
    appointment,
    onNavigate,
}: {
    isLoading: boolean;
    appointment: Appointment | undefined;
    onNavigate: () => void;
}) {
    if (isLoading) {
        return (
            <div className={appointmentSkeletonStack}>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-8 w-32" />
            </div>
        );
    }

    if (!appointment) {
        return <div className={panelCardEmpty}>Nenhuma consulta agendada</div>;
    }

    return (
        <>
            <div>
                <p className={appointmentTitle}>Consulta agendada</p>
                <p className={appointmentTime}>
                    {formatTime(appointment.startAt)} · {appointment.durationMinutes} min
                </p>
            </div>
            <div className={appointmentBadgeRow}>
                <ClinicalBadge variant="neutral">{appointmentTypeLabel(appointment.type)}</ClinicalBadge>
            </div>
            <div className={appointmentActionRow}>
                <Button size="sm" onClick={onNavigate}>
                    <Play className="size-4" />
                    Ver pacientes
                </Button>
            </div>
        </>
    );
}

function NextBadge({
    isLoading,
    isSoon,
    minsUntil,
    appointment,
}: {
    isLoading: boolean;
    isSoon: boolean;
    minsUntil: number | null;
    appointment: Appointment | undefined;
}) {
    if (isLoading) return <Skeleton className="h-6 w-20" />;

    if (isSoon) {
        return (
            <ClinicalBadge variant="primary" dot>
                em {minsUntil} min
            </ClinicalBadge>
        );
    }

    if (appointment) {
        return <ClinicalBadge variant="neutral">{formatTime(appointment.startAt)}</ClinicalBadge>;
    }

    return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
    const navigate = useNavigate();

    const patientsQuery = useSearchPatients({
        term: '',
        limit: 1,
        cursor: null,
        sort: null,
    }) as unknown as UseQueryResult<PatientPage>;

    const appointmentsQuery = useSearchAppointments({
        term: '',
        limit: 5,
        cursor: null,
        sort: {startAt: 'asc' as const},
    }) as unknown as UseQueryResult<AppointmentPage>;

    const totalPatients = patientsQuery.data?.totalCount;
    const totalAppointments = appointmentsQuery.data?.totalCount;
    const appointments = appointmentsQuery.data?.data ?? [];

    const now = new Date();
    const nextAppointment = appointments.find((a) => new Date(a.startAt) >= now) ?? appointments[0];
    const minsUntilNext = nextAppointment ? minutesUntil(nextAppointment.startAt) : null;
    const nextIsUpcoming = minsUntilNext !== null && minsUntilNext > 0;
    const nextIsSoon = nextIsUpcoming && minsUntilNext <= 30;

    return (
        <Page title="Hoje" subtitle={getPageSubtitle(totalAppointments, appointmentsQuery.isLoading)}>
            {/* Stat tiles */}
            <div className={statsGrid}>
                <StatTile
                    label="Consultas agendadas"
                    value={totalAppointments ?? '—'}
                    loading={appointmentsQuery.isLoading}
                />
                <StatTile label="Pré-evoluções IA" value="—" delta="aguardam revisão" />
                <StatTile label="Pacientes ativos" value={totalPatients ?? '—'} loading={patientsQuery.isLoading} />
                <StatTile label="Tempo médio consulta" value="—" />
            </div>

            <div className={mainGrid}>
                {/* AI pre-evolutions */}
                <Card className={panelCardRoot}>
                    <CardHeader className={panelCardHeader}>
                        <h3 className={panelCardTitle}>Pré-evoluções aguardando revisão</h3>
                        <ClinicalBadge variant="ai-soft">— pendentes</ClinicalBadge>
                    </CardHeader>
                    <CardContent className={panelCardContent}>
                        <div className={panelCardEmpty}>Nenhuma pré-evolução pendente</div>
                    </CardContent>
                </Card>

                {/* Next appointment */}
                <Card className={panelCardRoot}>
                    <CardHeader className={panelCardHeader}>
                        <h3 className={panelCardTitle}>Próxima consulta</h3>
                        <NextBadge
                            isLoading={appointmentsQuery.isLoading}
                            isSoon={nextIsSoon}
                            minsUntil={minsUntilNext}
                            appointment={nextAppointment}
                        />
                    </CardHeader>
                    <CardContent className={panelCardContent}>
                        <NextAppointmentContent
                            isLoading={appointmentsQuery.isLoading}
                            appointment={nextAppointment}
                            onNavigate={() => navigate({to: '/patients'})}
                        />
                    </CardContent>
                </Card>
            </div>
        </Page>
    );
}
