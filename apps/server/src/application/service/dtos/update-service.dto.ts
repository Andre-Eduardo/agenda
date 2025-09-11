import type {z} from 'zod';
import {ServiceId} from '../../../domain/service/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createServiceSchema} from './create-service.dto';

const updateServiceInputSchema = createServiceSchema.partial();

export class UpdateServiceInputDto extends createZodDto(updateServiceInputSchema) {}

export const updateServiceSchema = updateServiceInputSchema.extend({
    id: entityId(ServiceId),
});

export type UpdateServiceDto = z.infer<typeof updateServiceSchema>;
