import {z} from 'zod';
import {ServiceId} from '../../../domain/service/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deleteServiceSchema = z.object({
    id: entityId(ServiceId),
});

export class DeleteServiceDto extends createZodDto(deleteServiceSchema) {}
