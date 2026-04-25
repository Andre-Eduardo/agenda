import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {AppointmentId} from '../../../domain/appointment/entities';
import {
    EvolutionTemplateType,
    AttendanceType,
    ClinicalStatusTag,
    ConductTag,
    RecordSource,
} from '../../../domain/record/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, entityId} from '../../@shared/validation/schemas';

const fileSchema = z.object({
    fileName: z.string().min(1).openapi({example: 'exam.pdf'}),
    url: z.string().url().openapi({example: 'https://storage.example.com/exam.pdf'}),
    description: z.string().openapi({example: 'Blood test results'}),
});

export const createRecordSchema = z.object({
    patientId: entityId(PatientId),
    /** Professional clinically responsible (≠ whoever typed the record). */
    responsibleProfessionalId: entityId(ProfessionalId),
    // Legacy free text — now optional
    description: z.string().min(1).optional().openapi({example: 'General clinical note'}),
    files: z.array(fileSchema).default([]),
    // Evolution structured fields
    title: z.string().max(255).optional().openapi({example: 'Follow-up consultation'}),
    templateType: z.nativeEnum(EvolutionTemplateType).optional(),
    attendanceType: z.nativeEnum(AttendanceType).optional(),
    clinicalStatus: z.nativeEnum(ClinicalStatusTag).optional(),
    conductTags: z.array(z.nativeEnum(ConductTag)).optional().default([]),
    subjective: z.string().optional().openapi({example: 'Patient reports persistent headache for 3 days'}),
    objective: z.string().optional().openapi({example: 'BP 120/80, no fever'}),
    assessment: z.string().optional().openapi({example: 'Tension headache, likely stress-related'}),
    plan: z.string().optional().openapi({example: 'Analgesics as needed, return in 7 days if unresolved'}),
    freeNotes: z.string().optional().openapi({example: 'Patient was anxious during the visit'}),
    eventDate: datetime.optional(),
    appointmentId: entityId(AppointmentId).optional(),
    source: z.nativeEnum(RecordSource).optional(),
    importedDocumentId: z.string().uuid().optional(),
    wasHumanEdited: z.boolean().optional(),
});

export class CreateRecordDto extends createZodDto(createRecordSchema) {}
