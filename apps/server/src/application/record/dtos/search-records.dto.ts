import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {
    AttendanceType,
    ClinicalStatusTag,
} from '../../../domain/record/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, entityId, pagination} from '../../@shared/validation/schemas';

export const searchRecordsSchema = pagination(['createdAt', 'updatedAt', 'eventDate'] as const).extend({
    term: z.string().optional().openapi({description: 'Search term to filter records by description'}),
    patientId: entityId(PatientId).optional().openapi({description: 'Filter by patient ID'}),
    attendanceType: z.nativeEnum(AttendanceType).optional().openapi({description: 'Filter by attendance type'}),
    clinicalStatus: z.nativeEnum(ClinicalStatusTag).optional().openapi({description: 'Filter by clinical status'}),
    dateStart: datetime.optional().openapi({description: 'Filter events from this date (eventDate)'}),
    dateEnd: datetime.optional().openapi({description: 'Filter events up to this date (eventDate)'}),
});

export class SearchRecordsDto extends createZodDto(searchRecordsSchema) {}
