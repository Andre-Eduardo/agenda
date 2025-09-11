import {z} from 'zod';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createRoomStatusSchema} from '../../room-status/dtos';

const startAuditSchema = createRoomStatusSchema.extend({
    startedById: entityId(UserId),
    reason: z.string().min(1).openapi({example: 'audit reason'}),
});

export class StartAuditDto extends createZodDto(startAuditSchema) {}
