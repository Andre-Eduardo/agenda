import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const fileSchema = z.object({
    fileName: z.string().min(1).openapi({example: 'exam.pdf'}),
    url: z.string().url().openapi({example: 'https://storage.example.com/exam.pdf'}),
    description: z.string().openapi({example: 'Blood test results'}),
});

export const createRecordSchema = z.object({
    patientId: entityId(PatientId),
    professionalId: entityId(ProfessionalId),
    description: z.string().min(1).openapi({example: 'Annual checkup notes'}),
    files: z.array(fileSchema).default([]),
});

export class CreateRecordDto extends createZodDto(createRecordSchema) {}
