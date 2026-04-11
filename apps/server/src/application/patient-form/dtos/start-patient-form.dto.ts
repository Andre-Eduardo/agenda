import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {FormTemplateId} from '../../../domain/form-template/entities';
import {FormTemplateVersionId} from '../../../domain/form-template-version/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const startPatientFormSchema = z.object({
    professionalId: entityId(ProfessionalId),
    templateId: entityId(FormTemplateId),
    versionId: entityId(FormTemplateVersionId).optional(),
    appliedAt: z.coerce.date().optional(),
});

export class StartPatientFormInputDto extends createZodDto(startPatientFormSchema) {}

export const startPatientFormFullSchema = startPatientFormSchema.extend({
    patientId: entityId(PatientId),
});

export type StartPatientFormDto = z.infer<typeof startPatientFormFullSchema>;

export const patientFormParamSchema = z.object({
    patientId: z.string().openapi({format: 'uuid'}),
    patientFormId: z.string().openapi({format: 'uuid'}),
});
