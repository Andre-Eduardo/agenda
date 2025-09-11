import {z} from 'zod';
import type {CashierSortOptions} from '../../../domain/cashier/cashier.repository';
import {CompanyId} from '../../../domain/company/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';
import {datetime} from '../../@shared/validation/schemas/datetime.schema';
import {nullableRangeFilter, rangeFilter} from '../../@shared/validation/schemas/range-filter.schema';

const listCashierSchema = z.object({
    companyId: entityId(CompanyId),
    userId: entityId(UserId).optional().openapi({description: 'The user ID of the cashier owner to search for.'}),
    createdAt: rangeFilter(datetime).optional().openapi({
        description: 'The range of creation dates to search for.',
    }),
    closedAt: nullableRangeFilter(datetime).openapi({
        description: 'The range of closing dates to search for.',
    }),
    pagination: pagination(<CashierSortOptions>['createdAt', 'updatedAt', 'closedAt']),
});

export class ListCashierDto extends createZodDto(listCashierSchema) {}
