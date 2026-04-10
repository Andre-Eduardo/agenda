import {z} from 'zod';
import {RecordId} from '../../../domain/record/entities';
import {
    EvolutionTemplateType,
    AttendanceType,
    ClinicalStatusTag,
    ConductTag,
} from '../../../domain/record/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, entityId} from '../../@shared/validation/schemas';

const updateRecordInputSchema = z.object({
    description: z.string().min(1).optional().openapi({example: 'Updated clinical note'}),
    title: z.string().max(255).optional().openapi({example: 'Follow-up consultation'}),
    templateType: z.nativeEnum(EvolutionTemplateType).optional(),
    attendanceType: z.nativeEnum(AttendanceType).optional(),
    clinicalStatus: z.nativeEnum(ClinicalStatusTag).optional(),
    conductTags: z.array(z.nativeEnum(ConductTag)).optional(),
    subjective: z.string().optional(),
    objective: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
    freeNotes: z.string().optional(),
    eventDate: datetime.optional(),
});

export class UpdateRecordInputDto extends createZodDto(updateRecordInputSchema) {}

export const updateRecordSchema = updateRecordInputSchema.extend({
    id: entityId(RecordId),
});

export type UpdateRecordDto = z.infer<typeof updateRecordSchema>;
