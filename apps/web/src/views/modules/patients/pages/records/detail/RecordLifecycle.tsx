import {useId, useState} from 'react';
import {
    AxiosError,
    getGetRecordAmendmentsQueryKey,
    getGetRecordQueryKey,
    getSearchRecordsQueryKey,
    useGetRecordAmendments,
    useReopenRecord,
    useSignRecord,
    useUpdateRecord,
    type ApiProblem,
    type Record as MedicalRecord,
    type UpdateRecordInputDto,
} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {useQueryClient} from '@tanstack/react-query';
import {LockKeyhole, Pencil, UnlockKeyhole} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {z} from 'zod';
import {Button} from '@/components/ui/componentes/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/componentes/dialog';
import {Label} from '@/components/ui/componentes/label';
import {Textarea} from '@/components/ui/componentes/textarea';
import {useCan} from '@/hooks/useCan';
import {translateApiError} from '@/utils/translate-api-error';
import {ConfirmDialog} from '@/views/components/ConfirmDialog';
import {SectionCard} from './styles';
import styles from './record-lifecycle.module.css';

const reopenSchema = z.object({justification: z.string().trim().min(1).max(2000)});
const editSchema = z.object({
    description: z.string(),
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    plan: z.string(),
    freeNotes: z.string(),
});

type EditFields = z.infer<typeof editSchema>;
const fields: ReadonlyArray<keyof EditFields> = [
    'description',
    'subjective',
    'objective',
    'assessment',
    'plan',
    'freeNotes',
];

function fieldText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

export function RecordLifecycleActions({record}: {record: MedicalRecord}) {
    const {t} = useTranslation();
    const canUpdate = useCan({has: 'record:update'});
    const client = useQueryClient();
    const [action, setAction] = useState<'sign' | 'reopen' | 'edit' | null>(null);
    const sign = useSignRecord();
    const reopen = useReopenRecord();
    const update = useUpdateRecord();

    function refreshRecord() {
        void client.invalidateQueries({queryKey: getGetRecordQueryKey(record.id)});
        void client.invalidateQueries({queryKey: getGetRecordAmendmentsQueryKey(record.id)});
        void client.invalidateQueries({queryKey: getSearchRecordsQueryKey()});
    }

    function success(saved: MedicalRecord, message: string) {
        client.setQueryData(getGetRecordQueryKey(record.id), saved);
        refreshRecord();
        setAction(null);
        toast.success(message);
    }

    function failure(error: unknown) {
        const fallback = t('recordLifecycle.error');
        const detail =
            error instanceof AxiosError ? (error.response?.data as ApiProblem | undefined)?.detail : undefined;

        toast.error(detail ? translateApiError(detail, fallback) : fallback);
        refreshRecord();
    }

    if (!canUpdate) return null;

    return (
        <>
            {record.isLocked ? (
                <Button variant="outline" size="sm" onClick={() => setAction('reopen')}>
                    <UnlockKeyhole />
                    {t('recordLifecycle.reopen')}
                </Button>
            ) : (
                <>
                    <Button size="sm" onClick={() => setAction('sign')}>
                        <LockKeyhole />
                        {t('recordLifecycle.sign')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAction('edit')}>
                        <Pencil />
                        {t('recordLifecycle.edit')}
                    </Button>
                </>
            )}
            {action === 'sign' && !record.isLocked && (
                <ConfirmDialog
                    opened
                    title={t('recordLifecycle.signTitle')}
                    message={t('recordLifecycle.signMessage')}
                    confirmLabel={t('recordLifecycle.sign')}
                    isLoading={sign.isPending}
                    onCancel={() => setAction(null)}
                    onConfirm={() =>
                        sign.mutate(
                            {id: record.id},
                            {
                                onSuccess: (saved) => success(saved, t('recordLifecycle.signed')),
                                onError: failure,
                            }
                        )
                    }
                />
            )}
            {action === 'reopen' && record.isLocked && (
                <ReopenDialog
                    pending={reopen.isPending}
                    close={() => setAction(null)}
                    submit={(justification) =>
                        reopen.mutate(
                            {id: record.id, data: {justification}},
                            {
                                onSuccess: (saved) => success(saved, t('recordLifecycle.reopened')),
                                onError: failure,
                            }
                        )
                    }
                />
            )}
            {action === 'edit' && !record.isLocked && (
                <EditDialog
                    record={record}
                    pending={update.isPending}
                    close={() => setAction(null)}
                    submit={(data) =>
                        update.mutate(
                            {id: record.id, data},
                            {
                                onSuccess: (saved) => success(saved, t('recordLifecycle.saved')),
                                onError: failure,
                            }
                        )
                    }
                />
            )}
        </>
    );
}

function ReopenDialog({
    submit,
    close,
    pending,
}: {
    submit: (reason: string) => void;
    close: () => void;
    pending: boolean;
}) {
    const {t} = useTranslation();
    const id = useId();
    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<z.infer<typeof reopenSchema>>({
        resolver: zodResolver(reopenSchema),
        defaultValues: {justification: ''},
    });

    return (
        <Dialog open onOpenChange={(open) => !open && !pending && close()}>
            <DialogContent className={styles.dialog}>
                <DialogHeader>
                    <DialogTitle>{t('recordLifecycle.reopen')}</DialogTitle>
                    <DialogDescription>{t('recordLifecycle.reopenMessage')}</DialogDescription>
                </DialogHeader>
                <form
                    id={id}
                    className={styles.form}
                    onSubmit={handleSubmit(({justification}) => submit(justification))}
                >
                    <Label htmlFor={`${id}-reason`}>{t('recordLifecycle.reason')}</Label>
                    <Textarea
                        id={`${id}-reason`}
                        rows={3}
                        maxLength={2000}
                        aria-invalid={!!errors.justification}
                        aria-describedby={errors.justification ? `${id}-reason-error` : undefined}
                        {...register('justification')}
                    />
                    {errors.justification && (
                        <p id={`${id}-reason-error`} role="alert">
                            {t('recordLifecycle.reasonRequired')}
                        </p>
                    )}
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={close} disabled={pending}>
                        {t('actions.cancel')}
                    </Button>
                    <Button type="submit" form={id} disabled={pending}>
                        {t('recordLifecycle.confirmReopen')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditDialog({
    record,
    submit,
    close,
    pending,
}: {
    record: MedicalRecord;
    submit: (data: UpdateRecordInputDto) => void;
    close: () => void;
    pending: boolean;
}) {
    const {t} = useTranslation();
    const id = useId();
    const {
        register,
        handleSubmit,
        formState: {isDirty, dirtyFields},
    } = useForm<EditFields>({
        resolver: zodResolver(editSchema),
        defaultValues: {
            description: fieldText(record.description),
            subjective: fieldText(record.subjective),
            objective: fieldText(record.objective),
            assessment: fieldText(record.assessment),
            plan: fieldText(record.plan),
            freeNotes: fieldText(record.freeNotes),
        },
    });

    const onSubmit = handleSubmit((values) => {
        const data: UpdateRecordInputDto = {};

        for (const field of fields) {
            if (!dirtyFields[field]) continue;
            const value = values[field].trim();

            if (field === 'description') data.description = value || null;
            else data[field] = value;
        }

        submit(data);
    });

    return (
        <Dialog open onOpenChange={(open) => !open && !pending && close()}>
            <DialogContent className={styles.dialog}>
                <DialogHeader>
                    <DialogTitle>{t('recordLifecycle.edit')}</DialogTitle>
                </DialogHeader>
                <form id={id} className={styles.editForm} onSubmit={onSubmit}>
                    {fields.map((field) => (
                        <div key={field} className={styles.form}>
                            <Label htmlFor={`${id}-${field}`}>{t(`recordLifecycle.fields.${field}`)}</Label>
                            <Textarea id={`${id}-${field}`} rows={2} {...register(field)} />
                        </div>
                    ))}
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={close} disabled={pending}>
                        {t('actions.cancel')}
                    </Button>
                    <Button type="submit" form={id} disabled={!isDirty || pending}>
                        {t('actions.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function RecordAmendmentsSection({recordId}: {recordId: string}) {
    const {t, i18n} = useTranslation();
    const headingId = useId();
    const amendments = useGetRecordAmendments(recordId);
    const format = new Intl.DateTimeFormat(i18n.resolvedLanguage, {dateStyle: 'short', timeStyle: 'short'});

    return (
        <SectionCard aria-labelledby={headingId}>
            <div className="head">
                <h2 id={headingId} className="title">
                    {t('recordLifecycle.history')}
                </h2>
            </div>
            {amendments.isPending && <p role="status">{t('states.loading')}</p>}
            {amendments.isError && (
                <div role="alert">
                    <p>{t('recordLifecycle.historyError')}</p>
                    <Button variant="outline" size="sm" onClick={() => void amendments.refetch()}>
                        {t('recordLifecycle.retry')}
                    </Button>
                </div>
            )}
            {amendments.data?.length === 0 && <p className="empty">{t('recordLifecycle.noAmendments')}</p>}
            {!!amendments.data?.length && (
                <ol className={styles.history}>
                    {amendments.data.map((amendment) => (
                        <li key={amendment.id}>
                            <p>
                                {t('recordLifecycle.reopenedBy', {
                                    name: amendment.requestedByName ?? amendment.requestedByMemberId,
                                })}{' '}
                                <time dateTime={amendment.reopenedAt}>
                                    {format.format(new Date(amendment.reopenedAt))}
                                </time>
                            </p>
                            <p className={styles.reason}>{amendment.justification}</p>
                            {amendment.relockedAt && (
                                <p>
                                    {t('recordLifecycle.resignedAt')}{' '}
                                    <time dateTime={amendment.relockedAt}>
                                        {format.format(new Date(amendment.relockedAt))}
                                    </time>
                                </p>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </SectionCard>
    );
}
