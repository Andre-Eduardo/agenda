import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {RoomId} from '../../../domain/room/entities';
import {UserId} from '../../../domain/user/entities';
import {entityId} from '../../@shared/validation/schemas';

export const listRoomStatusSchema = z.object({
    companyId: entityId(CompanyId),
    roomId: entityId(RoomId).optional().openapi({description: 'The room to search for'}),
    startedById: entityId(UserId).optional().openapi({description: 'The starter to search for'}),
    finishedById: entityId(UserId).optional().openapi({description: 'The finisher to search for'}),
});
