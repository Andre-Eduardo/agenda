import {z} from 'zod';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getUserSchema = z.object({
    id: entityId(UserId),
});

export class GetUserDto extends createZodDto(getUserSchema) {}
