import {z} from 'zod';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {AiSpecialtyGroup} from '../../../domain/form-template/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createProfessionalSchema = z.object({
    /** ClinicMember that this Professional record extends 1:1 (must have role=PROFESSIONAL). */
    clinicMemberId: entityId(ClinicMemberId),
    /** Professional registration number (CRM, CRP, COREN, etc.) */
    registrationNumber: z.string().nullish().openapi({example: 'CRM-SP 12345'}),
    /** Free-form specialty as typed by the user */
    specialty: z.string().nullish().openapi({example: 'Cardiology'}),
    /** Normalized specialty enum, derived from `specialty` server-side */
    specialtyNormalized: z.nativeEnum(AiSpecialtyGroup).nullish(),
});

export class CreateProfessionalDto extends createZodDto(createProfessionalSchema) {}
