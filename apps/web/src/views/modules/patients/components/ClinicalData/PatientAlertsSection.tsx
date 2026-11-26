import {useState} from 'react';
import {
    getSearchPatientAlertsQueryKey,
    PatientAlertSeverity,
    useCreatePatientAlert,
    useSearchPatientAlerts,
    useUpdatePatientAlert,
    type PatientAlert,
} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {useQueryClient} from '@tanstack/react-query';
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
import {Label} from '@/components/ui/componentes/label';
import {Textarea} from '@/components/ui/componentes/textarea';
import {useCan} from '@/hooks/useCan';
import {css} from '@/styled-system/css';
import {ALERT_PAGE_SIZE, ClinicalPagination} from './PatientClinicalPreview';

const stack = css({display: 'grid', gap: '3'});
const row = css({display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '3', flexWrap: 'wrap'});
const alertList = css({display: 'grid', gap: '3', divideY: '1px'});
const alertItem = css({display: 'grid', gap: '1.5', py: '3', overflowWrap: 'anywhere'});
const title = css({fontWeight: 'semibold'});
const description = css({whiteSpace: 'pre-wrap', fontSize: 'sm', color: 'text.secondary'});
const field = css({display: 'grid', gap: '1.5'});
const fields = css({display: 'grid', gap: '3', mb: '4'});
const select = css({
    w: 'full',
    px: '3',
    py: '2',
    borderWidth: '1px',
    borderRadius: 'md',
    bg: 'bg.card',
    fontSize: 'sm',
});
const formError = css({fontSize: 'sm', color: 'red.700'});
const schema = z.object({
    title: z.string().trim().min(1).max(255),
    description: z.string(),
    severity: z.nativeEnum(PatientAlertSeverity),
    isActive: z.boolean(),
});

function AlertDialog({
    patientId,
    alert,
    onClose,
}: {
    patientId: string;
    alert: PatientAlert | null;
    onClose: () => void;
}) {
    const {t} = useTranslation();
    const client = useQueryClient();
    const create = useCreatePatientAlert();
    const update = useUpdatePatientAlert();
    const saving = create.isPending || update.isPending;
    const {
        register,
        handleSubmit,
        formState: {dirtyFields, errors},
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            title: alert?.title ?? '',
            description: alert?.description ?? '',
            severity: alert?.severity ?? PatientAlertSeverity.MEDIUM,
            isActive: alert?.isActive ?? true,
        },
    });

    const save = handleSubmit(async (values) => {
        const data = {...values, description: values.description.trim() || null};

        try {
            if (alert) {
                await update.mutateAsync({
                    patientId,
                    alertId: alert.id,
                    data: {
                        title: dirtyFields.title ? data.title : undefined,
                        description: dirtyFields.description ? data.description : undefined,
                        severity: dirtyFields.severity ? data.severity : undefined,
                        isActive: dirtyFields.isActive ? data.isActive : undefined,
                    },
                });
            } else {
                await create.mutateAsync({patientId, data});
            }

            await client.invalidateQueries({queryKey: getSearchPatientAlertsQueryKey(patientId)});
            toast.success(t('states.saved'));
            onClose();
        } catch {
            toast.error(t('clinicalData.saveError'));
        }
    });

    return (
        <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t(alert ? 'clinicalData.editAlert' : 'clinicalData.addAlert')}</DialogTitle>
                    <DialogDescription>{t('clinicalData.alertDescription')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={save}>
                    <div className={fields}>
                        <div className={field}>
                            <Label htmlFor="patient-alert-title">{t('clinicalData.alertTitle')}</Label>
                            <Input id="patient-alert-title" maxLength={255} {...register('title')} />
                            {errors.title && (
                                <p role="alert" className={formError}>
                                    {t('clinicalData.invalidTitle')}
                                </p>
                            )}
                        </div>
                        <div className={field}>
                            <Label htmlFor="patient-alert-description">{t('clinicalData.description')}</Label>
                            <Textarea id="patient-alert-description" {...register('description')} />
                        </div>
                        <div className={field}>
                            <Label htmlFor="patient-alert-severity">{t('clinicalData.severityLabel')}</Label>
                            <select id="patient-alert-severity" className={select} {...register('severity')}>
                                {Object.values(PatientAlertSeverity).map((severity) => (
                                    <option key={severity} value={severity}>
                                        {t(`clinicalData.severity.${severity}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Label className={css({display: 'flex', gap: '2', alignItems: 'center'})}>
                            <input type="checkbox" {...register('isActive')} />
                            {t('clinicalData.activeAlert')}
                        </Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
                            {t('actions.cancel')}
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? t('states.saving') : t('actions.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function PatientAlertsSection({patientId, canWrite}: {patientId: string; canWrite: boolean}) {
    const {t} = useTranslation();
    const canCreate = useCan({has: 'patient-alert:create'}) && canWrite;
    const canUpdate = useCan({has: 'patient-alert:update'}) && canWrite;
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState<PatientAlert | null | undefined>(undefined);
    const query = useSearchPatientAlerts(patientId, {limit: ALERT_PAGE_SIZE, page});

    return (
        <div className={stack}>
            {canCreate && (
                <div>
                    <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
                        {t('clinicalData.addAlert')}
                    </Button>
                </div>
            )}
            {query.isLoading && (
                <p role="status" className={description}>
                    {t('states.loading')}
                </p>
            )}
            {query.isError && (
                <p role="alert" className={description}>
                    {t('clinicalData.loadError')}
                </p>
            )}
            {query.isSuccess && query.data.totalCount === 0 && (
                <p className={description}>{t('clinicalData.noAlerts')}</p>
            )}
            {query.isSuccess && query.data.totalCount > 0 && (
                <>
                    <ul className={alertList}>
                        {query.data.data.map((alert) => (
                            <li key={alert.id} className={alertItem}>
                                <div className={row}>
                                    <p className={title}>{alert.title}</p>
                                    <Badge severity={alert.severity}>
                                        {t(`clinicalData.severity.${alert.severity}`)}
                                    </Badge>
                                    {!alert.isActive && <Badge variant="outline">{t('clinicalData.inactive')}</Badge>}
                                    {canUpdate && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            aria-label={t('clinicalData.editAlertNamed', {title: alert.title})}
                                            onClick={() => setEditing(alert)}
                                        >
                                            {t('actions.edit')}
                                        </Button>
                                    )}
                                </div>
                                {alert.description && <p className={description}>{alert.description}</p>}
                            </li>
                        ))}
                    </ul>
                    <ClinicalPagination page={page} totalCount={query.data.totalCount} onPage={setPage} />
                </>
            )}
            {editing !== undefined && (editing ? canUpdate : canCreate) && (
                <AlertDialog patientId={patientId} alert={editing} onClose={() => setEditing(undefined)} />
            )}
        </div>
    );
}
