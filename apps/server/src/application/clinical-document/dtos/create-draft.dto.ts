import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {AppointmentId} from '../../../domain/appointment/entities';
import {ClinicalDocumentType} from '../../../domain/clinical-document/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const medicationSchema = z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    instructions: z.string().optional(),
});

const prescriptionContentSchema = z.object({
    medications: z.array(medicationSchema).min(1),
    observations: z.string().optional(),
});

const medicalCertificateContentSchema = z.object({
    reason: z.string().min(1),
    daysOff: z.coerce.number().int().positive(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    cid: z.string().optional(),
    observations: z.string().optional(),
});

const referralContentSchema = z.object({
    specialty: z.string().min(1),
    reason: z.string().min(1),
    urgency: z.enum(['ROUTINE', 'PRIORITY', 'URGENT']),
    observations: z.string().optional(),
});

const examItemSchema = z.object({
    name: z.string().min(1),
    code: z.string().optional(),
    justification: z.string().optional(),
});

const examRequestContentSchema = z.object({
    exams: z.array(examItemSchema).min(1),
    observations: z.string().optional(),
    priority: z.string().optional(),
});

export const contentJsonSchema = z.discriminatedUnion('__type', [
    prescriptionContentSchema.extend({__type: z.literal('PRESCRIPTION')}),
    prescriptionContentSchema.extend({__type: z.literal('PRESCRIPTION_SPECIAL')}),
    medicalCertificateContentSchema.extend({__type: z.literal('MEDICAL_CERTIFICATE')}),
    referralContentSchema.extend({__type: z.literal('REFERRAL')}),
    examRequestContentSchema.extend({__type: z.literal('EXAM_REQUEST')}),
]);

export const createDraftSchema = z.object({
    type: z.nativeEnum(ClinicalDocumentType),
    patientId: entityId(PatientId),
    responsibleProfessionalId: entityId(ProfessionalId),
    contentJson: contentJsonSchema,
    appointmentId: entityId(AppointmentId).optional(),
    recordId: z.string().uuid().optional(),
});

export class CreateDraftDto extends createZodDto(createDraftSchema) {}
