import type {z} from 'zod';
import {RoomStatusId} from '../../../domain/room-status/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {startMaintenanceSchema} from './start-maintenance.dto';

const updateMaintenanceInputSchema = startMaintenanceSchema.omit({companyId: true, roomId: true}).partial();

export class UpdateMaintenanceInputDto extends createZodDto(updateMaintenanceInputSchema) {}

export const updateMaintenanceSchema = updateMaintenanceInputSchema.extend({
    id: entityId(RoomStatusId),
});

export type UpdateMaintenanceDto = z.infer<typeof updateMaintenanceSchema>;
