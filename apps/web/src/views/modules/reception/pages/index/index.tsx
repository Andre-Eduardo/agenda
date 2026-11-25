import {useEffect, useState} from 'react';
import {
    getGetPatientQueryOptions,
    useCallAppointment,
    useCheckinAppointment,
    useMarkNoShowAppointment,
    useSearchAppointments,
    type Appointment,
    type AppointmentStatus,
} from '@agenda-app/client';
import {useQueries, useQueryClient, type UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, Link} from '@tanstack/react-router';
import {ArrowRight, CalendarDays, PhoneCall, RefreshCw, UserCheck, UserX} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {EmptyStateCard} from '@/components/ui/componentes/empty-state';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {useCan, useCanState} from '@/hooks/useCan';
import {invalidateAppointmentRevenue} from '@/utils/appointment-revenue';
import {ConfirmDialog} from '@/views/components/ConfirmDialog';
import {Page} from '@/views/components/Page';
import styles from './styles.module.css';

export const Route = createFileRoute('/_stackedLayout/reception')({
    component: ReceptionPage,
});

interface PaginatedAppointments {
    data: Appointment[];
    totalCount: number;
}

type Transition = 'checkin' | 'call' | 'noShow';
type Group = 'waiting' | 'arrived' | 'inProgress' | 'finished';

const PAGE_LIMIT = 500;
const GROUPS: Group[] = ['waiting', 'arrived', 'inProgress', 'finished'];

const STATUS_GROUP: Record<AppointmentStatus, Group> = {
    SCHEDULED: 'waiting',
    CONFIRMED: 'waiting',
    ARRIVED: 'arrived',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'finished',
    NO_SHOW: 'finished',
    CANCELLED: 'finished',
};

function localDayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function ReceptionPage() {
    const {t, i18n} = useTranslation();
    const queryClient = useQueryClient();
    const [day, setDay] = useState(() => localDayKey(new Date()));
    const [busyId, setBusyId] = useState<string | null>(null);
    const [noShowId, setNoShowId] = useState<string | null>(null);
    const appointmentAccess = useCanState({has: 'appointment:view'});
    const canCheckin = useCan({has: 'appointment:checkin'});
    const canCall = useCan({has: 'appointment:call'});
    const canMarkNoShow = useCan({has: 'appointment:update'});
    const canOpenPatient = useCan({has: 'patient:view'});

    useEffect(() => {
        const timer = window.setInterval(() => setDay(localDayKey(new Date())), 60_000);

        return () => window.clearInterval(timer);
    }, []);

    const params = {
        term: '',
        limit: PAGE_LIMIT,
        cursor: null,
        sort: {startAt: 'asc' as const},
        dateFrom: new Date(`${day}T00:00:00`).toISOString(),
        dateTo: new Date(`${day}T23:59:59.999`).toISOString(),
    };
    const appointmentsQuery = useSearchAppointments(params, {
        query: {enabled: appointmentAccess.allowed, refetchInterval: 60_000, refetchOnWindowFocus: true},
    }) as unknown as UseQueryResult<PaginatedAppointments>;
    const appointments = appointmentsQuery.data?.data ?? [];
    const patientIds = [...new Set(appointments.map((appointment) => appointment.patientId))];
    const patientQueries = useQueries({
        queries: patientIds.map((id) => getGetPatientQueryOptions(id, {query: {staleTime: 5 * 60_000}})),
    });
    const patientNames = new Map(patientIds.map((id, index) => [id, patientQueries[index]?.data?.name]));
    const grouped = Object.fromEntries(
        GROUPS.map((group) => [group, appointments.filter((appointment) => STATUS_GROUP[appointment.status] === group)])
    ) as Record<Group, Appointment[]>;
    const dateLabel = new Intl.DateTimeFormat(i18n.language, {dateStyle: 'full'}).format(new Date(`${day}T12:00:00`));

    const checkin = useCheckinAppointment();
    const call = useCallAppointment();
    const noShow = useMarkNoShowAppointment();

    async function transition(id: string, kind: Transition) {
        if (busyId !== null) return;

        setBusyId(id);

        try {
            if (kind === 'checkin') {
                await checkin.mutateAsync({id});
            } else if (kind === 'call') {
                await call.mutateAsync({id});
            } else {
                const appointment = await noShow.mutateAsync({id});

                invalidateAppointmentRevenue(queryClient, appointment.clinicId);
            }

            toast.success(t(`reception.success.${kind}`));
        } catch {
            toast.error(t('reception.actionError'));
        } finally {
            await appointmentsQuery.refetch();
            setBusyId(null);
            setNoShowId(null);
        }
    }

    const selectedNoShow = appointments.find((appointment) => appointment.id === noShowId);

    return (
        <Page
            title={t('reception.title')}
            subtitle={dateLabel}
            responsiveActions
            actions={
                <Button type="button" size="sm" variant="outline" onClick={() => void appointmentsQuery.refetch()}>
                    <RefreshCw size={16} aria-hidden />
                    {t('reception.refresh')}
                </Button>
            }
        >
            <div className={styles.root}>
                {appointmentAccess.isLoading && <ReceptionSkeleton />}

                {!appointmentAccess.isLoading && !appointmentAccess.allowed && (
                    <EmptyStateCard
                        icon={<CalendarDays size={24} aria-hidden />}
                        title={t('reception.accessDenied')}
                        description={t('reception.accessDeniedDescription')}
                    />
                )}

                {appointmentAccess.allowed && appointmentsQuery.isLoading && <ReceptionSkeleton />}

                {appointmentAccess.allowed && appointmentsQuery.isError && (
                    <EmptyStateCard
                        icon={<CalendarDays size={24} aria-hidden />}
                        title={t('reception.loadError')}
                        description={t('reception.loadErrorDescription')}
                        action={
                            <Button type="button" variant="outline" onClick={() => void appointmentsQuery.refetch()}>
                                {t('reception.retry')}
                            </Button>
                        }
                    />
                )}

                {appointmentAccess.allowed && appointmentsQuery.isSuccess && appointments.length === 0 && (
                    <EmptyStateCard
                        icon={<CalendarDays size={24} aria-hidden />}
                        title={t('reception.empty')}
                        description={t('reception.emptyDescription')}
                    />
                )}

                {appointmentAccess.allowed && appointmentsQuery.isSuccess && appointments.length > 0 && (
                    <>
                        <div className={styles.metrics} role="group" aria-label={t('reception.summary')}>
                            {GROUPS.map((group) => (
                                <div key={group} className={styles.metric}>
                                    <span className={styles.metricNumber}>{grouped[group].length}</span>
                                    <span className={styles.metricLabel}>{t(`reception.groups.${group}`)}</span>
                                </div>
                            ))}
                        </div>

                        {appointmentsQuery.data.totalCount > PAGE_LIMIT && (
                            <p className={styles.notice}>{t('reception.limitNotice', {limit: PAGE_LIMIT})}</p>
                        )}

                        {GROUPS.map((group) => (
                            <section key={group} className={styles.section} aria-labelledby={`reception-${group}`}>
                                <header className={styles.sectionHeader}>
                                    <h2 id={`reception-${group}`} className={styles.sectionTitle}>
                                        {t(`reception.groups.${group}`)}
                                    </h2>
                                    <Badge variant="secondary">{grouped[group].length}</Badge>
                                </header>

                                {grouped[group].length === 0 ? (
                                    <p className={styles.sectionEmpty}>{t('reception.noAppointmentsInGroup')}</p>
                                ) : (
                                    <div className={styles.rows}>
                                        {grouped[group].map((appointment) => (
                                            <article
                                                key={appointment.id}
                                                className={styles.row}
                                                aria-label={t('reception.appointmentFor', {
                                                    name:
                                                        patientNames.get(appointment.patientId) ??
                                                        t('reception.patientUnavailable'),
                                                })}
                                            >
                                                <time dateTime={appointment.startAt} className={styles.time}>
                                                    {new Intl.DateTimeFormat(i18n.language, {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }).format(new Date(appointment.startAt))}
                                                </time>
                                                <div className={styles.identity}>
                                                    <span className={styles.patientName}>
                                                        {patientNames.get(appointment.patientId) ??
                                                            t('reception.patientUnavailable')}
                                                    </span>
                                                    <span className={styles.status}>
                                                        {t(`reception.status.${appointment.status}`)}
                                                    </span>
                                                </div>
                                                <div className={styles.actions}>
                                                    {canOpenPatient && (
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link
                                                                to="/patients/$patientId"
                                                                params={{patientId: appointment.patientId}}
                                                                aria-label={t('reception.openPatientFor', {
                                                                    name:
                                                                        patientNames.get(appointment.patientId) ??
                                                                        t('reception.patientUnavailable'),
                                                                })}
                                                            >
                                                                {t('reception.openPatient')}{' '}
                                                                <ArrowRight size={14} aria-hidden />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    {(appointment.status === 'SCHEDULED' ||
                                                        appointment.status === 'CONFIRMED') &&
                                                        canCheckin && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                disabled={busyId !== null}
                                                                onClick={() =>
                                                                    void transition(appointment.id, 'checkin')
                                                                }
                                                            >
                                                                <UserCheck size={14} aria-hidden />
                                                                {t('reception.checkin')}
                                                            </Button>
                                                        )}
                                                    {appointment.status === 'ARRIVED' && canCall && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            disabled={busyId !== null}
                                                            onClick={() => void transition(appointment.id, 'call')}
                                                        >
                                                            <PhoneCall size={14} aria-hidden />
                                                            {t('reception.call')}
                                                        </Button>
                                                    )}
                                                    {(appointment.status === 'SCHEDULED' ||
                                                        appointment.status === 'CONFIRMED') &&
                                                        canMarkNoShow && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={busyId !== null}
                                                                onClick={() => setNoShowId(appointment.id)}
                                                            >
                                                                <UserX size={14} aria-hidden />
                                                                {t('reception.markNoShow')}
                                                            </Button>
                                                        )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                    </>
                )}
            </div>

            <ConfirmDialog
                opened={selectedNoShow !== undefined}
                title={t('reception.confirmNoShowTitle')}
                message={t('reception.confirmNoShowMessage', {
                    name: selectedNoShow
                        ? (patientNames.get(selectedNoShow.patientId) ?? t('reception.patientUnavailable'))
                        : '',
                })}
                confirmLabel={t('reception.markNoShow')}
                isLoading={busyId !== null}
                onConfirm={() => {
                    if (selectedNoShow) void transition(selectedNoShow.id, 'noShow');
                }}
                onCancel={() => setNoShowId(null)}
            />
        </Page>
    );
}

function ReceptionSkeleton() {
    return (
        <div className={styles.skeleton} aria-busy="true">
            <Skeleton className={styles.skeletonMetric} />
            <Skeleton className={styles.skeletonRow} />
            <Skeleton className={styles.skeletonRow} />
            <Skeleton className={styles.skeletonRow} />
        </div>
    );
}
