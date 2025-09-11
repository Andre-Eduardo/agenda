import {z} from 'zod';
import {AccountType} from '../../../domain/account/entities';
import {CompanyId} from '../../../domain/company/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createAccountSchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().min(1).openapi({example: 'account name'}),
    type: z.nativeEnum(AccountType).openapi({example: AccountType.INTERNAL, enumName: 'AccountType'}),
    bankId: z.number().int().nonnegative().nullish().openapi({example: 1}),
    agencyNumber: z.number().int().nonnegative().nullish().openapi({example: 1234}),
    agencyDigit: z.string().nullish().openapi({example: '1'}),
    accountNumber: z.number().int().nonnegative().nullish().openapi({example: 12345}),
    accountDigit: z.string().nullish().openapi({example: '1'}),
});

export class CreateAccountDto extends createZodDto(createAccountSchema) {}
