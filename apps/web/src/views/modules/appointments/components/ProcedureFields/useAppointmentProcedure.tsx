import {useId, useState} from 'react';
import {useListActiveProcedures, type ScheduledProcedure} from '@agenda-app/client';
import {useTranslation} from 'react-i18next';
import {Label} from '@/components/ui/componentes/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/componentes/select';
import {useCan} from '@/hooks/useCan';
import {
    ProcedureFields,
    priceInCents,
    procedureFieldsSchema,
    toProcedureFields,
    type ProcedureFieldsValue,
} from './index';
import styles from './styles.module.css';

const NO_PROCEDURE = 'none';

export function useAppointmentProcedure(initial?: ScheduledProcedure & {durationMinutes: number}) {
    const {t} = useTranslation();
    const id = useId();
    const catalog = useListActiveProcedures();
    const canOverride = useCan({has: 'procedure:override'});
    const [selectedId, setSelectedId] = useState(initial?.id ?? NO_PROCEDURE);
    const [edits, setEdits] = useState<ProcedureFieldsValue>();
    const options = catalog.data ?? [];
    const selected = selectedId === initial?.id ? initial : options.find((entry) => entry.id === selectedId);
    const defaults = selected && toProcedureFields(selected);
    const values = canOverride && edits !== undefined ? edits : defaults;

    const validDefaults = values === undefined || procedureFieldsSchema.safeParse(values).success;

    function renderFields(required: boolean) {
        return (
            <>
                <div className={styles.field}>
                    <Label htmlFor={id}>{t('procedure.selection')}</Label>
                    <Select
                        value={selectedId}
                        onValueChange={(value) => {
                            setSelectedId(value);
                            setEdits(undefined);
                        }}
                    >
                        <SelectTrigger id={id} aria-required={required}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {!initial && <SelectItem value={NO_PROCEDURE}>{t('procedure.none')}</SelectItem>}
                            {initial && <SelectItem value={initial.id}>{initial.name}</SelectItem>}
                            {options
                                .filter((entry) => entry.id !== initial?.id)
                                .map((entry) => (
                                    <SelectItem key={entry.id} value={entry.id}>
                                        {entry.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                    {catalog.isPending && <p role="status">{t('procedure.loading')}</p>}
                    {catalog.isError && <p role="alert">{t('procedure.loadError')}</p>}
                    {required && catalog.isSuccess && options.length === 0 && !initial && (
                        <p>{t('procedure.noActive')}</p>
                    )}
                </div>
                {values && <ProcedureFields value={values} readOnly={!canOverride} onChange={setEdits} />}
                {!validDefaults && <p role="alert">{t('procedure.invalidDefaults')}</p>}
            </>
        );
    }

    function buildFields(startAt: string, fallbackDuration: number) {
        const duration = values ? Number(values.duration) : fallbackDuration;
        const changesDuration = defaults === undefined || Number(defaults.duration) !== duration;
        const price = values && priceInCents(values.price);
        const overrides =
            defaults && values && price !== undefined
                ? {
                      ...(values.color !== defaults.color && {color: values.color}),
                      ...(price !== priceInCents(defaults.price) && {priceInCents: price}),
                      ...(values.modality !== defaults.modality && {modality: values.modality}),
                  }
                : {};

        return {
            endAt: changesDuration
                ? new Date(new Date(startAt).getTime() + duration * 60_000).toISOString()
                : undefined,
            procedureId: selected?.id === initial?.id ? undefined : selected?.id,
            procedureOverrides: Object.keys(overrides).length > 0 ? overrides : undefined,
        };
    }

    return {
        hasProcedure: selected !== undefined,
        valid: (selectedId === NO_PROCEDURE || selected !== undefined) && validDefaults,
        renderFields,
        buildFields,
    };
}
