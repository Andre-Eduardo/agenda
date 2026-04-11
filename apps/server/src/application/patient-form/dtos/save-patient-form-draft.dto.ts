import {z} from 'zod';
import {PatientFormId} from '../../../domain/patient-form/entities';
import {createZodDto} from '../../@shared/validation/dto';

const answerSchema = z.object({
    fieldId: z.string().min(1),
    valueText: z.string().nullish(),
    valueNumber: z.number().nullish(),
    valueBoolean: z.boolean().nullish(),
    valueDate: z.string().nullish(),
    valueJson: z.unknown().optional(),
});

const savePatientFormDraftSchema = z.object({
    answers: z.array(answerSchema),
});

export class SavePatientFormDraftInputDto extends createZodDto(savePatientFormDraftSchema) {}

export const savePatientFormDraftFullSchema = savePatientFormDraftSchema.extend({
    patientFormId: z.custom<PatientFormId>(),
});

export type SavePatientFormDraftDto = z.infer<typeof savePatientFormDraftSchema> & {
    patientFormId: PatientFormId;
};
