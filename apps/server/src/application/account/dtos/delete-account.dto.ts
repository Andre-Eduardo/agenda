import {z} from 'zod';
import {AccountId} from '../../../domain/account/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deleteAccountSchema = z.object({
    id: entityId(AccountId),
});

export class DeleteAccountDto extends createZodDto(deleteAccountSchema) {}
