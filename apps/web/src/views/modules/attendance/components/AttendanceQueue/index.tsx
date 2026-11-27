import {useEffect, useState} from 'react';
import {
    getListAttendanceQueryKey,
    getSearchAppointmentsQueryKey,
    type AttendanceItem,
    type ListAttendanceScope,
    useCallAttendance,
    useFinishAttendance,
    useListAttendance,
} from '@agenda-app/client';
import {useQueryClient} from '@tanstack/react-query';
import {Link} from '@tanstack/react-router';
import {ArrowRight, CheckCheck, ClipboardList, PhoneCall, RefreshCw} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {useCan} from '@/hooks/useCan';
import {invalidateAppointmentRevenue} from '@/utils/appointment-revenue';
import {ConfirmDialog} from '@/views/components/ConfirmDialog';
import {TriageDialog} from '@/views/modules/attendance/components/TriageDialog';
import styles from './styles.module.css';

const LAST_DESTINATION_KEY = 'attendance.lastDestination';

function readLastDestination(): string {
    try {
        return window.localStorage.getItem(LAST_DESTINATION_KEY) ?? '';
    } catch {
        return '';
    }
}

function rememberDestination(destination: string) {
    try {
        window.localStorage.setItem(LAST_DESTINATION_KEY, destination);
    } catch {
        // Private mode or blocked storage: the prefill is only a convenience.
    }
}

function localDayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function useLocalDay(): string {
    const [day, setDay] = useState(() => localDayKey(new Date()));

    useEffect(() => {
        const timer = window.setInterval(() => setDay(localDayKey(new Date())), 60_000);

        return () => window.clearInterval(timer);
    }, []);

    return day;
}

type Action =
    | {kind: 'call'; item: AttendanceItem}
    | {kind: 'finish'; item: AttendanceItem}
    | {kind: 'triage'; item: AttendanceItem};

/**
 * Fila de atendimento do dia: quem chegou e quem está em atendimento.
 * `scope="mine"` no dashboard do profissional; `scope="all"` na recepção
 * (todas as agendas que o membro acessa — o servidor decide quais).
 */
export function AttendanceQueue({scope}: {scope: ListAttendanceScope}) {
    const {t, i18n} = useTranslation();
    const queryClient = useQueryClient();
    const day = useLocalDay();
    const [action, setAction] = useState<Action | null>(null);
    const canCall = useCan({has: 'appointment:call'});
    const canFinish = useCan({has: 'appointment:update'});
    const canTriage = useCan({has: 'appointment:triage'});
    const canOpenPatient = useCan({has: 'patient:view'});
    const params = {
        scope,
        dateFrom: new Date(`${day}T00:00:00`).toISOString(),
        dateTo: new Date(`${day}T23:59:59.999`).toISOString(),
    };
    const queue = useListAttendance(params, {query: {refetchInterval: 10_000, refetchOnWindowFocus: true}});
    const options = {mutation: {retry: false, onError: () => undefined}};
    const call = useCallAttendance(options);
    const finish = useFinishAttendance(options);
    const busy = call.isPending || finish.isPending;
    const time = new Intl.DateTimeFormat(i18n.language, {hour: '2-digit', minute: '2-digit'});
    const triageRequired = queue.data?.triageRequired === true;
    const items = queue.data?.items ?? [];
    const title = scope === 'mine' ? t('attendance.dashboardTitle') : t('attendance.receptionTitle');
    const subtitle = scope === 'mine' ? t('attendance.dashboardSub') : t('attendance.receptionSub');

    async function refresh() {
        await Promise.all([
            queryClient.invalidateQueries({queryKey: getListAttendanceQueryKey()}),
            queryClient.invalidateQueries({queryKey: getSearchAppointmentsQueryKey()}),
        ]);
    }

    async function submitCall(item: AttendanceItem, destination: string) {
        try {
            const result = await call.mutateAsync({id: item.appointmentId, data: {destination}});

            rememberDestination(destination);
            toast.success(t(result.announced ? 'attendance.called' : 'attendance.calledNoPanel', {destination}));
        } catch {
            toast.error(t('attendance.actionError'));
        } finally {
            setAction(null);
            await refresh();
        }
    }

    async function submitFinish(item: AttendanceItem) {
        try {
            const appointment = await finish.mutateAsync({id: item.appointmentId});

            invalidateAppointmentRevenue(queryClient, appointment.clinicId);
            toast.success(t('attendance.finished'));
        } catch {
            toast.error(t('attendance.actionError'));
        } finally {
            setAction(null);
            await refresh();
        }
    }

    function triageEditable(item: AttendanceItem): boolean {
        return canTriage && item.status === 'ARRIVED';
    }

    function statusLabel(item: AttendanceItem): string {
        if (item.status === 'IN_PROGRESS') {
            return item.destination
                ? `${t('attendance.status.inProgress')} · ${item.destination}`
                : t('attendance.status.inProgress');
        }

        if (triageRequired && !item.triageReleased) return t('attendance.status.waitingTriage');

        return triageRequired ? t('attendance.status.released') : t('attendance.status.waiting');
    }

    return (
        <section className={styles.queue} aria-labelledby={`attendance-${scope}`}>
            <header className={styles.header}>
                <div>
                    <h2 id={`attendance-${scope}`} className={styles.heading}>
                        {title}
                    </h2>
                    <p className={styles.sub}>{subtitle}</p>
                </div>
                <div className={styles.actions}>
                    {queue.isSuccess && <Badge variant="secondary">{items.length}</Badge>}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-label={t('reception.refresh')}
                        onClick={() => void queue.refetch()}
                    >
                        <RefreshCw size={14} aria-hidden />
                    </Button>
                </div>
            </header>

            {queue.isPending && <p className={styles.empty}>{t('patientCall.connecting')}</p>}
            {queue.isError && (
                <div className={styles.empty} role="alert">
                    {t('attendance.loadError')}{' '}
                    <Button type="button" variant="outline" size="sm" onClick={() => void queue.refetch()}>
                        {t('attendance.retry')}
                    </Button>
                </div>
            )}
            {queue.isSuccess && items.length === 0 && <p className={styles.empty}>{t('attendance.empty')}</p>}
            {queue.isSuccess && items.length > 0 && (
                <ol className={styles.rows}>
                    {items.map((item) => (
                        <li key={item.appointmentId} className={styles.row}>
                            <div className={styles.identity}>
                                <strong>{item.patientName}</strong>
                                <span className={styles.meta}>
                                    {[
                                        item.arrivedAt &&
                                            t('attendance.arrivedAt', {time: time.format(new Date(item.arrivedAt))}),
                                        t('attendance.scheduledAt', {time: time.format(new Date(item.startAt))}),
                                        scope === 'all' &&
                                            item.attendedByName &&
                                            t('attendance.professional', {name: item.attendedByName}),
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </span>
                            </div>
                            <Badge variant={item.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                                {statusLabel(item)}
                            </Badge>
                            <div className={styles.actions}>
                                {canOpenPatient && (
                                    <Button asChild variant="outline" size="sm">
                                        <Link to="/patients/$patientId" params={{patientId: item.patientId}}>
                                            {t('reception.openPatient')} <ArrowRight size={14} aria-hidden />
                                        </Link>
                                    </Button>
                                )}
                                {((item.status === 'ARRIVED' && triageRequired && canTriage) || item.triageStarted) && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={item.triageReleased || !triageEditable(item) ? 'outline' : 'default'}
                                        disabled={busy}
                                        onClick={() => setAction({kind: 'triage', item})}
                                    >
                                        <ClipboardList size={14} aria-hidden />
                                        {triageEditable(item) ? t('attendance.triage') : t('attendance.viewTriage')}
                                    </Button>
                                )}
                                {item.status === 'ARRIVED' && canCall && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={busy || !item.callable}
                                        title={item.callable ? undefined : t('attendance.triageBlocked')}
                                        onClick={() => setAction({kind: 'call', item})}
                                    >
                                        <PhoneCall size={14} aria-hidden />
                                        {t('attendance.call')}
                                    </Button>
                                )}
                                {item.status === 'IN_PROGRESS' && canCall && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={busy}
                                        onClick={() => setAction({kind: 'call', item})}
                                    >
                                        <PhoneCall size={14} aria-hidden />
                                        {t('attendance.recall')}
                                    </Button>
                                )}
                                {item.status === 'IN_PROGRESS' && canFinish && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={busy}
                                        onClick={() => setAction({kind: 'finish', item})}
                                    >
                                        <CheckCheck size={14} aria-hidden />
                                        {t('attendance.finish')}
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            {action?.kind === 'call' && (
                <CallDialog
                    key={action.item.appointmentId}
                    item={action.item}
                    busy={busy}
                    onCancel={() => setAction(null)}
                    onConfirm={(destination) => void submitCall(action.item, destination)}
                />
            )}
            <ConfirmDialog
                opened={action?.kind === 'finish'}
                title={t('attendance.finishTitle')}
                message={t('attendance.finishConfirmation', {name: action?.item.patientName ?? ''})}
                confirmLabel={t('attendance.finish')}
                isLoading={busy}
                onConfirm={() => {
                    if (action?.kind === 'finish') void submitFinish(action.item);
                }}
                onCancel={() => setAction(null)}
            />
            {action?.kind === 'triage' && (
                <TriageDialog
                    key={action.item.appointmentId}
                    appointmentId={action.item.appointmentId}
                    patientName={action.item.patientName}
                    editable={triageEditable(action.item)}
                    onClose={() => {
                        setAction(null);
                        void refresh();
                    }}
                />
            )}
        </section>
    );
}

function CallDialog({
    item,
    busy,
    onCancel,
    onConfirm,
}: {
    item: AttendanceItem;
    busy: boolean;
    onCancel: () => void;
    onConfirm: (destination: string) => void;
}) {
    const {t} = useTranslation();
    const [destination, setDestination] = useState(
        () => item.destination ?? item.suggestedDestination ?? readLastDestination()
    );
    const [touched, setTouched] = useState(false);
    const trimmed = destination.trim();
    const invalid = trimmed.length === 0 || trimmed.length > 80;

    return (
        <Dialog open onOpenChange={(open) => !open && !busy && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {item.status === 'IN_PROGRESS' ? t('attendance.recallTitle') : t('attendance.callTitle')}
                    </DialogTitle>
                    <DialogDescription>{t('attendance.callDescription', {name: item.patientName})}</DialogDescription>
                </DialogHeader>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        event.preventDefault();
                        setTouched(true);

                        if (!invalid) onConfirm(trimmed);
                    }}
                >
                    <label className={styles.field}>
                        {t('attendance.destination')}
                        <Input
                            value={destination}
                            maxLength={80}
                            autoFocus
                            required
                            onChange={(event) => setDestination(event.target.value)}
                        />
                        <span className={styles.hint}>{t('attendance.destinationHint')}</span>
                    </label>
                    {touched && invalid && (
                        <p role="alert" className={styles.warning}>
                            {t('attendance.destinationRequired')}
                        </p>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
                            {t('actions.cancel')}
                        </Button>
                        <Button type="submit" disabled={busy}>
                            <PhoneCall size={14} aria-hidden />
                            {item.status === 'IN_PROGRESS' ? t('attendance.recall') : t('attendance.call')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
