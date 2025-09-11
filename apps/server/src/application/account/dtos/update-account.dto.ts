import type {z} from 'zod';
import {AccountId} from '../../../domain/account/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createAccountSchema} from './create-account.dto';

const updateAccountInputSchema = createAccountSchema.partial();

export class UpdateAccountInputDto extends createZodDto(updateAccountInputSchema) {}

export const updateAccountSchema = updateAccountInputSchema.extend({
    id: entityId(AccountId),
});

export type UpdateAccountDto = z.infer<typeof updateAccountSchema>;
