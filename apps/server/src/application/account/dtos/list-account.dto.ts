import {z} from 'zod';
import type {AccountSortOptions} from '../../../domain/account/account.repository';
import {AccountType} from '../../../domain/account/entities';
import {CompanyId} from '../../../domain/company/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listAccountSchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().min(1).optional().openapi({description: 'The name to search for'}),
    type: z
        .nativeEnum(AccountType)
        .optional()
        .openapi({description: 'The account type to search for', enumName: 'AccountType'}),
    pagination: pagination(<AccountSortOptions>['name', 'type', 'createdAt', 'updatedAt']),
});

export class ListAccountDto extends createZodDto(listAccountSchema) {}
