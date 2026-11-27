import {type AppointmentTriage, useGetAttendanceTriage, useSaveAttendanceTriage} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
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
import {Input} from '@/components/ui/componentes/input';
import {Textarea} from '@/components/ui/componentes/textarea';
import styles from '../AttendanceQueue/styles.module.css';

/** Empty inputs are sent as null: every triage field is optional. */
const optionalNumber = (min: number, max: number, integer: boolean) =>
    z.preprocess(
        (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
        (integer ? z.number().int() : z.number()).min(min).max(max).nullable()
    );

const triageSchema = z.object({
    weightKg: optionalNumber(0.5, 500, false),
    heightCm: optionalNumber(20, 260, true),
    systolicPressure: optionalNumber(40, 300, true),
    diastolicPressure: optionalNumber(20, 200, true),
    heartRate: optionalNumber(20, 300, true),
    temperatureCelsius: optionalNumber(30, 45, false),
    oxygenSaturation: optionalNumber(50, 100, true),
    notes: z.string().trim().max(1000),
});

type TriageInput = z.input<typeof triageSchema>;
type TriageValues = z.output<typeof triageSchema>;

const NUMERIC_FIELDS = [
    {name: 'weightKg', step: '0.1'},
    {name: 'heightCm', step: '1'},
    {name: 'systolicPressure', step: '1'},
    {name: 'diastolicPressure', step: '1'},
    {name: 'heartRate', step: '1'},
    {name: 'temperatureCelsius', step: '0.1'},
    {name: 'oxygenSaturation', step: '1'},
] as const;

function toFormValues(triage: AppointmentTriage | undefined): TriageInput {
    const value = (number: number | null | undefined) =>
        number === null || number === undefined ? '' : String(number);

    return {
        weightKg: value(triage?.weightKg),
        heightCm: value(triage?.heightCm),
        systolicPressure: value(triage?.systolicPressure),
        diastolicPressure: value(triage?.diastolicPressure),
        heartRate: value(triage?.heartRate),
        temperatureCelsius: value(triage?.temperatureCelsius),
        oxygenSaturation: value(triage?.oxygenSaturation),
        notes: triage?.notes ?? '',
    };
}

/**
 * Triagem feita pela recepção antes da chamada. Os campos são opcionais;
 * "Concluir e liberar" deixa o paciente pronto para o profissional chamar.
 */
export function TriageDialog({
    appointmentId,
    patientName,
    editable,
    onClose,
}: {
    appointmentId: string;
    patientName: string;
    editable: boolean;
    onClose: () => void;
}) {
    const {t} = useTranslation();
    const triage = useGetAttendanceTriage(appointmentId, {query: {staleTime: 0}});

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('attendance.triageTitle')}</DialogTitle>
                    <DialogDescription>
                        {patientName} · {editable ? t('attendance.triageDescription') : t('attendance.triageReadOnly')}
                    </DialogDescription>
                </DialogHeader>
                {triage.isPending && <p className={styles.hint}>{t('patientCall.connecting')}</p>}
                {triage.isError && (
                    <p role="alert" className={styles.warning}>
                        {t('attendance.loadError')}
                    </p>
                )}
                {triage.isSuccess && (
                    <TriageForm
                        appointmentId={appointmentId}
                        triage={triage.data}
                        editable={editable}
                        onClose={onClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function TriageForm({
    appointmentId,
    triage,
    editable,
    onClose,
}: {
    appointmentId: string;
    triage: AppointmentTriage;
    editable: boolean;
    onClose: () => void;
}) {
    const {t} = useTranslation();
    const save = useSaveAttendanceTriage({mutation: {retry: false, onError: () => undefined}});
    const form = useForm<TriageInput, unknown, TriageValues>({
        defaultValues: toFormValues(triage),
        resolver: zodResolver(triageSchema),
    });

    async function submit(values: TriageValues, release: boolean) {
        try {
            await save.mutateAsync({
                id: appointmentId,
                data: {...values, notes: values.notes.length > 0 ? values.notes : null, release},
            });
            toast.success(t(release && !triage.released ? 'attendance.releasedToast' : 'attendance.saved'));
            onClose();
        } catch {
            toast.error(t('attendance.actionError'));
        }
    }

    return (
        <form
            className={styles.form}
            onSubmit={(event) => void form.handleSubmit((values) => submit(values, true))(event)}
        >
            {triage.released && <p className={styles.hint}>{t('attendance.alreadyReleased')}</p>}
            <div className={styles.grid}>
                {NUMERIC_FIELDS.map(({name, step}) => (
                    <label key={name} className={styles.field}>
                        {t(`attendance.${name}`)}
                        <Input
                            className={styles.vitals}
                            type="number"
                            inputMode="decimal"
                            step={step}
                            readOnly={!editable}
                            {...form.register(name)}
                        />
                    </label>
                ))}
            </div>
            <label className={styles.field}>
                {t('attendance.notes')}
                <Textarea maxLength={1000} readOnly={!editable} {...form.register('notes')} />
            </label>
            {Object.keys(form.formState.errors).length > 0 && (
                <p role="alert" className={styles.warning}>
                    {t('attendance.invalidFields')}
                </p>
            )}
            <DialogFooter>
                <Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>
                    {editable ? t('actions.cancel') : t('attendance.close')}
                </Button>
                {editable && (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={save.isPending}
                            onClick={() => void form.handleSubmit((values) => submit(values, false))()}
                        >
                            {t('attendance.save')}
                        </Button>
                        {!triage.released && (
                            <Button type="submit" disabled={save.isPending}>
                                {t('attendance.release')}
                            </Button>
                        )}
                    </>
                )}
            </DialogFooter>
        </form>
    );
}
