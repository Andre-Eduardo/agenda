import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {RoomId} from '../../../domain/room/entities';
import {entityId} from '../../@shared/validation/schemas';

export const createRoomStatusSchema = z.object({companyId: entityId(CompanyId), roomId: entityId(RoomId)});
