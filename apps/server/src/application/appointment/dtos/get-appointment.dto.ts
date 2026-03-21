import {z} from 'zod';
import {AppointmentId} from '../../../domain/appointment/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getAppointmentSchema = z.object({
    id: entityId(AppointmentId),
});

export class GetAppointmentDto extends createZodDto(getAppointmentSchema) {}
