import {string, z} from 'zod';
import {DefectId} from '../../../domain/defect/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createRoomStatusSchema} from '../../room-status/dtos';

export const startMaintenanceSchema = createRoomStatusSchema.extend({
    note: string().min(1).openapi({description: 'A note about the maintenance'}),
    defects: z.array(entityId(DefectId)).min(1).openapi({description: 'The defects that were found in the room'}),
});

export class StartMaintenanceDto extends createZodDto(startMaintenanceSchema) {}
