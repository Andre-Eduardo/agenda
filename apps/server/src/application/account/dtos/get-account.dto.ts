import {z} from 'zod';
import {AccountId} from '../../../domain/account/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getAccountSchema = z.object({
    id: entityId(AccountId),
});

export class GetAccountDto extends createZodDto(getAccountSchema) {}
