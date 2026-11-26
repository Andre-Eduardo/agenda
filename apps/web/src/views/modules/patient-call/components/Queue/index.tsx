import {useId, useState} from 'react';
import {
    type PatientCallQueueItem,
    useAnnouncePatientCall,
    useRecallPatientCall,
    useRemovePatientCall,
} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import type {UseQueryResult} from '@tanstack/react-query';
import {useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {z} from 'zod';
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
import {Textarea} from '@/components/ui/componentes/textarea';
import styles from './styles.module.css';

type Action = {operation: 'announce' | 'recall' | 'remove'; entry: PatientCallQueueItem};

const destinationSchema = z.object({place: z.enum(['ROOM', 'DESK']), number: z.number().int().min(1).max(9999)});
const removalSchema = z.object({reason: z.string().trim().min(1).max(250)});

export function PatientCallQueue({
    queue,
    published,
    isStarting,
    shownAppointmentIds,
    onStart,
}: {
    queue: UseQueryResult<PatientCallQueueItem[]>;
    published: boolean;
    isStarting: boolean;
    shownAppointmentIds: Set<string>;
    onStart?: (id: string) => void;
}) {
    const {t, i18n} = useTranslation();
    const [action, setAction] = useState<Action | null>(null);
    const options = {mutation: {retry: false, onError: () => undefined}};
    const announce = useAnnouncePatientCall(options);
    const recall = useRecallPatientCall(options);
    const remove = useRemovePatientCall(options);
    const busy = announce.isPending || recall.isPending || remove.isPending;
    const arrivalTime = new Intl.DateTimeFormat(i18n.language, {dateStyle: 'short', timeStyle: 'short'});

    async function perform(operation: () => Promise<unknown>, translation: 'announced' | 'removed') {
        try {
            await operation();
            toast.success(t(`patientCall.${translation}`));
        } catch {
            toast.error(t('patientCall.queueActionError'));
        } finally {
            setAction(null);
            await queue.refetch();
        }
    }

    return (
        <section className={styles.queue} aria-labelledby="patient-call-queue">
            <header className={styles.header}>
                <h2 id="patient-call-queue" className={styles.heading}>
                    {t('patientCall.queue')}
                </h2>
                {!published && <Badge variant="outline">{t('patientCall.unpublished')}</Badge>}
            </header>
            {queue.isPending && <p className={styles.empty}>{t('patientCall.connecting')}</p>}
            {queue.isError && (
                <div className={styles.empty} role="alert">
                    {t('reception.loadErrorDescription')}{' '}
                    <Button type="button" variant="outline" size="sm" onClick={() => void queue.refetch()}>
                        {t('reception.retry')}
                    </Button>
                </div>
            )}
            {queue.isSuccess && queue.data.length === 0 && (
                <p className={styles.empty}>{t('patientCall.queueEmpty')}</p>
            )}
            {queue.isSuccess && queue.data.length > 0 && (
                <ol className={styles.rows}>
                    {queue.data.map((entry) => (
                        <li className={styles.row} key={entry.appointmentId}>
                            <div className={styles.identity}>
                                <strong>{entry.patientName}</strong>
                                <time dateTime={entry.arrivedAt}>{arrivalTime.format(new Date(entry.arrivedAt))}</time>
                            </div>
                            <Badge variant="outline">{entry.destination ?? t('patientCall.waiting')}</Badge>
                            <div className={styles.actions}>
                                {entry.callCount === 0 ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setAction({operation: 'announce', entry})}
                                        disabled={!published || busy}
                                    >
                                        {t('patientCall.announce')}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setAction({operation: 'recall', entry})}
                                        disabled={!published || busy}
                                    >
                                        {t('patientCall.recall')}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAction({operation: 'remove', entry})}
                                    disabled={busy}
                                >
                                    {t('patientCall.remove')}
                                </Button>
                                {onStart && !shownAppointmentIds.has(entry.appointmentId) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isStarting}
                                        onClick={() => onStart(entry.appointmentId)}
                                    >
                                        {t('patientCall.start')}
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            )}
            {action && (
                <QueueDialog
                    action={action}
                    busy={busy}
                    onClose={() => setAction(null)}
                    onAnnounce={(data) =>
                        void perform(() => announce.mutateAsync({id: action.entry.appointmentId, data}), 'announced')
                    }
                    onRecall={() =>
                        void perform(
                            () =>
                                recall.mutateAsync({
                                    id: action.entry.appointmentId,
                                    data: {callCount: action.entry.callCount},
                                }),
                            'announced'
                        )
                    }
                    onRemove={(data) =>
                        void perform(() => remove.mutateAsync({id: action.entry.appointmentId, data}), 'removed')
                    }
                />
            )}
        </section>
    );
}

function QueueDialog({
    action,
    busy,
    onClose,
    onAnnounce,
    onRecall,
    onRemove,
}: {
    action: Action;
    busy: boolean;
    onClose: () => void;
    onAnnounce: (data: z.infer<typeof destinationSchema>) => void;
    onRecall: () => void;
    onRemove: (data: z.infer<typeof removalSchema>) => void;
}) {
    const {t} = useTranslation();
    const destination = useForm({resolver: zodResolver(destinationSchema), defaultValues: {place: 'ROOM'}});
    const removal = useForm({resolver: zodResolver(removalSchema), defaultValues: {reason: ''}});
    const destinationId = useId();
    const label = t(`patientCall.${action.operation}`);

    return (
        <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{label}</DialogTitle>
                    <DialogDescription>
                        {action.entry.patientName}
                        {action.operation === 'recall' && action.entry.destination
                            ? ` · ${action.entry.destination}`
                            : ''}
                    </DialogDescription>
                </DialogHeader>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        if (action.operation === 'announce') void destination.handleSubmit(onAnnounce)(event);
                        else if (action.operation === 'remove') void removal.handleSubmit(onRemove)(event);
                        else {
                            event.preventDefault();
                            onRecall();
                        }
                    }}
                >
                    {action.operation === 'announce' && (
                        <>
                            <div className={styles.field}>
                                <label htmlFor={destinationId}>{t('patientCall.destination')}</label>
                                <select id={destinationId} className={styles.select} {...destination.register('place')}>
                                    <option value="ROOM">{t('patientCall.room')}</option>
                                    <option value="DESK">{t('patientCall.desk')}</option>
                                </select>
                            </div>
                            <label className={styles.field}>
                                {t('patientCall.destinationNumber')}
                                <Input
                                    type="number"
                                    min={1}
                                    max={9999}
                                    required
                                    {...destination.register('number', {valueAsNumber: true})}
                                />
                            </label>
                        </>
                    )}
                    {action.operation === 'remove' && (
                        <label className={styles.field}>
                            {t('patientCall.removalReason')}
                            <Textarea {...removal.register('reason')} required maxLength={250} />
                        </label>
                    )}
                    {(Object.keys(destination.formState.errors).length > 0 ||
                        Object.keys(removal.formState.errors).length > 0) && (
                        <p role="alert">{t('patientCall.invalidFields')}</p>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
                            {t('actions.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant={action.operation === 'remove' ? 'destructive' : 'default'}
                            disabled={busy}
                        >
                            {label}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
