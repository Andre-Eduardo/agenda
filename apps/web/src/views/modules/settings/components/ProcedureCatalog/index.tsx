import {useId, useState} from 'react';
import {
    ProcedureColor,
    ProcedureModality,
    getListActiveProceduresQueryKey,
    getListProcedureCatalogQueryKey,
    useCreateProcedure,
    useListProcedureCatalog,
    useUpdateProcedure,
    type Procedure,
} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {useQueryClient} from '@tanstack/react-query';
import {Plus} from 'lucide-react';
import {Controller, useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';
import {z} from 'zod';
import {Button} from '@/components/ui/componentes/button';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/componentes/dialog';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {formatBRL} from '@/lib/utils';
import {
    ProcedureColorDot,
    ProcedureFields,
    priceInCents,
    procedureFieldsSchema,
    toProcedureFields,
} from '@/views/modules/appointments/components/ProcedureFields';
import {FormCard, PageHeading, formCardP16} from '../../pages/index/styles';
import styles from './styles.module.css';

const catalogFormSchema = z.object({
    name: z.string().trim().min(1).max(120),
    defaults: procedureFieldsSchema,
    active: z.boolean(),
});

type FormValues = z.infer<typeof catalogFormSchema>;

export function ProcedureCatalog() {
    const {t} = useTranslation();
    const catalog = useListProcedureCatalog();
    const [editing, setEditing] = useState<Procedure | 'new' | null>(null);

    return (
        <section>
            <PageHeading>
                <h1 className="title">{t('procedure.title')}</h1>
                <p className="sub">{t('procedure.description')}</p>
            </PageHeading>
            <FormCard className={formCardP16}>
                <Button onClick={() => setEditing('new')}>
                    <Plus />
                    {t('procedure.add')}
                </Button>
                {catalog.isPending && <p role="status">{t('procedure.loading')}</p>}
                {catalog.isError && <p role="alert">{t('procedure.loadError')}</p>}
                {catalog.isSuccess && catalog.data.length === 0 && <p>{t('procedure.empty')}</p>}
                {catalog.data && catalog.data.length > 0 && (
                    <ul className={styles.list}>
                        {catalog.data.map((entry) => (
                            <li key={entry.id} className={styles.item}>
                                <div>
                                    <div className={styles.name}>
                                        <ProcedureColorDot color={entry.color} />
                                        {entry.name}
                                    </div>
                                    <p className={styles.metadata}>
                                        {t('procedure.summary', {
                                            duration: entry.durationMinutes,
                                            price: formatBRL(entry.priceInCents / 100),
                                            modality: t(`procedure.modalities.${entry.modality}`),
                                        })}
                                        {!entry.active && ` · ${t('procedure.inactive')}`}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    aria-label={t('procedure.editItem', {name: entry.name})}
                                    onClick={() => setEditing(entry)}
                                >
                                    {t('procedure.edit')}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </FormCard>
            {editing !== null && (
                <ProcedureDialog entry={editing === 'new' ? undefined : editing} close={() => setEditing(null)} />
            )}
        </section>
    );
}

function ProcedureDialog({entry, close}: {entry?: Procedure; close: () => void}) {
    const {t} = useTranslation();
    const formId = useId();
    const queryClient = useQueryClient();
    const create = useCreateProcedure();
    const update = useUpdateProcedure();
    const {register, control, handleSubmit, formState} = useForm<FormValues>({
        resolver: zodResolver(catalogFormSchema),
        defaultValues: {
            name: entry?.name ?? '',
            defaults: entry
                ? toProcedureFields(entry)
                : {
                      duration: '30',
                      price: '0.00',
                      color: ProcedureColor.BLUE,
                      modality: ProcedureModality.IN_PERSON,
                  },
            active: entry?.active ?? true,
        },
    });

    const submit = handleSubmit(async ({name, defaults, active}) => {
        const data = {
            name,
            durationMinutes: Number(defaults.duration),
            priceInCents: priceInCents(defaults.price),
            color: defaults.color,
            modality: defaults.modality,
        };

        try {
            if (entry) {
                await update.mutateAsync({id: entry.id, data: {...data, active}});
            } else {
                await create.mutateAsync({data});
            }

            await Promise.all([
                queryClient.invalidateQueries({queryKey: getListProcedureCatalogQueryKey()}),
                queryClient.invalidateQueries({queryKey: getListActiveProceduresQueryKey()}),
            ]);
            toast.success(t('procedure.saved'));
            close();
        } catch {
            toast.error(t('procedure.saveError'));
        }
    });

    return (
        <Dialog open onOpenChange={(open) => !open && close()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t(entry ? 'procedure.edit' : 'procedure.add')}</DialogTitle>
                </DialogHeader>
                <form id={formId} className={styles.form} onSubmit={submit} noValidate>
                    <div className={styles.field}>
                        <Label htmlFor={`${formId}-name`}>{t('procedure.name')}</Label>
                        <Input
                            id={`${formId}-name`}
                            maxLength={120}
                            {...register('name')}
                            aria-invalid={!!formState.errors.name}
                        />
                    </div>
                    <Controller
                        name="defaults"
                        control={control}
                        render={({field}) => <ProcedureFields value={field.value} onChange={field.onChange} />}
                    />
                    {entry && (
                        <Label>
                            <input type="checkbox" {...register('active')} />
                            {t('procedure.active')}
                        </Label>
                    )}
                    {(formState.errors.name || formState.errors.defaults) && (
                        <p role="alert">{t('procedure.invalid')}</p>
                    )}
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={close}>
                        {t('actions.cancel')}
                    </Button>
                    <Button type="submit" form={formId} disabled={formState.isSubmitting}>
                        {t('actions.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
