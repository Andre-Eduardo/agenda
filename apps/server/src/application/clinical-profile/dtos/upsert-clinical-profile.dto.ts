import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const upsertClinicalProfileInputSchema = z.object({
    professionalId: entityId(ProfessionalId),
    allergies: z.string().nullish().openapi({example: 'Penicillin, NSAIDs'}),
    chronicConditions: z.string().nullish().openapi({example: 'Type 2 Diabetes, Hypertension'}),
    currentMedications: z.string().nullish().openapi({example: 'Metformin 500mg, Lisinopril 10mg'}),
    surgicalHistory: z.string().nullish().openapi({example: 'Appendectomy 2010'}),
    familyHistory: z.string().nullish().openapi({example: 'Father: CAD, Mother: Breast cancer'}),
    socialHistory: z.string().nullish().openapi({example: 'Non-smoker, occasional alcohol'}),
    generalNotes: z.string().nullish().openapi({example: 'Patient prefers morning appointments'}),
});

export class UpsertClinicalProfileInputDto extends createZodDto(upsertClinicalProfileInputSchema) {}

export const upsertClinicalProfileSchema = upsertClinicalProfileInputSchema.extend({
    patientId: entityId(PatientId),
});

export type UpsertClinicalProfileDto = z.infer<typeof upsertClinicalProfileSchema>;
