import {
    getGetClinicalProfileQueryKey,
    useListManageableProfessionals,
    useSearchProfessionals,
    useUpsertClinicalProfile,
    type ClinicalProfile,
    type Professional,
    type UpsertClinicalProfileInputDto,
} from '@agenda-app/client';
import {zodResolver} from '@hookform/resolvers/zod';
import {useQueryClient} from '@tanstack/react-query';
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
import {css} from '@/styled-system/css';
import {PROFILE_FIELDS} from './PatientClinicalPreview';

const scrollDialog = css({maxH: '90dvh', overflowY: 'auto'});
const fields = css({display: 'grid', gap: '3', mb: '4'});
const fieldGroup = css({display: 'grid', gap: '1.5'});
const select = css({
    w: 'full',
    px: '3',
    py: '2',
    borderWidth: '1px',
    borderRadius: 'md',
    bg: 'bg.card',
    fontSize: 'sm',
});
const errorText = css({fontSize: 'sm', color: 'red.700'});
const schema = z.object({
    responsibleProfessionalId: z.string().uuid(),
    allergies: z.string(),
    chronicConditions: z.string(),
    currentMedications: z.string(),
    surgicalHistory: z.string(),
    familyHistory: z.string(),
    socialHistory: z.string(),
    generalNotes: z.string(),
});

export function ClinicalProfileDialog({
    patientId,
    profile,
    onClose,
}: {
    patientId: string;
    profile?: ClinicalProfile | null;
    onClose: () => void;
}) {
    const {t} = useTranslation();
    const client = useQueryClient();
    const mutation = useUpsertClinicalProfile();
    const members = useListManageableProfessionals({query: {enabled: !profile}});
    const professionals = useSearchProfessionals(
        {term: '', limit: Math.max(members.data?.length ?? 0, 200), cursor: null, sort: null},
        {
            query: {
                enabled: !profile && !!members.data?.length,
            },
        }
    );
    const professionalsPage = professionals.data as unknown as {data: Professional[]; totalCount: number} | undefined;
    const professionalsByMember = new Map(
        professionalsPage?.data.map((professional) => [professional.clinicMemberId, professional.id])
    );
    const defaultValues = {
        responsibleProfessionalId: profile?.responsibleProfessionalId ?? '',
        allergies: profile?.allergies ?? '',
        chronicConditions: profile?.chronicConditions ?? '',
        currentMedications: profile?.currentMedications ?? '',
        surgicalHistory: profile?.surgicalHistory ?? '',
        familyHistory: profile?.familyHistory ?? '',
        socialHistory: profile?.socialHistory ?? '',
        generalNotes: profile?.generalNotes ?? '',
    };
    const {
        register,
        handleSubmit,
        formState: {dirtyFields, errors},
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const save = handleSubmit(async (values) => {
        const data: UpsertClinicalProfileInputDto = {responsibleProfessionalId: values.responsibleProfessionalId};

        for (const field of PROFILE_FIELDS) {
            if (dirtyFields[field]) data[field] = values[field].trim() || null;
        }

        try {
            const saved = await mutation.mutateAsync({patientId, data});

            client.setQueryData(getGetClinicalProfileQueryKey(patientId), saved);
            toast.success(t('states.saved'));
            onClose();
        } catch {
            toast.error(t('clinicalData.saveError'));
        }
    });

    return (
        <Dialog open onOpenChange={(open) => !open && !mutation.isPending && onClose()}>
            <DialogContent className={scrollDialog}>
                <DialogHeader>
                    <DialogTitle>{t('clinicalData.editProfile')}</DialogTitle>
                    <DialogDescription>{t('clinicalData.profileDescription')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={save}>
                    <div className={fields}>
                        {!profile && (
                            <div className={fieldGroup}>
                                <Label htmlFor="clinical-responsible">{t('clinicalData.responsible')}</Label>
                                <select
                                    id="clinical-responsible"
                                    className={select}
                                    {...register('responsibleProfessionalId')}
                                >
                                    <option value="">{t('clinicalData.selectProfessional')}</option>
                                    {members.data?.map((member) => {
                                        const professionalId = professionalsByMember.get(member.id);

                                        return (
                                            professionalId &&
                                            member.isActive && (
                                                <option key={professionalId} value={professionalId}>
                                                    {member.displayName || t('clinicalData.unnamedProfessional')}
                                                </option>
                                            )
                                        );
                                    })}
                                </select>
                                {errors.responsibleProfessionalId && (
                                    <p role="alert" className={errorText}>
                                        {t('clinicalData.selectProfessional')}
                                    </p>
                                )}
                                {(members.isError || professionals.isError) && (
                                    <p role="alert" className={errorText}>
                                        {t('clinicalData.loadProfessionalsError')}
                                    </p>
                                )}
                                {members.isSuccess &&
                                    (members.data.length === 0 ||
                                        (professionals.isSuccess && professionalsByMember.size === 0)) && (
                                        <p role="status">{t('clinicalData.noProfessionals')}</p>
                                    )}
                            </div>
                        )}
                        {PROFILE_FIELDS.map((field) => (
                            <div key={field} className={fieldGroup}>
                                <Label htmlFor={`clinical-${field}`}>{t(`clinicalData.fields.${field}`)}</Label>
                                <Textarea id={`clinical-${field}`} rows={2} {...register(field)} />
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>
                            {t('actions.cancel')}
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? t('states.saving') : t('actions.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
