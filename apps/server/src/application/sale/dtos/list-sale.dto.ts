import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {ProductId} from '../../../domain/product/entities';
import {SaleId} from '../../../domain/sale/entities';
import {UserId} from '../../../domain/user/entities';
import {entityId} from '../../@shared/validation/schemas';
import {datetime} from '../../@shared/validation/schemas/datetime.schema';
import {rangeFilter} from '../../@shared/validation/schemas/range-filter.schema';

const listSaleItemSchema = z.object({
    saleId: entityId(SaleId).optional(),
    productId: entityId(ProductId).optional(),
    price: rangeFilter(z.coerce.number()).optional().openapi({description: 'The range of price to search for'}),
    quantity: rangeFilter(z.coerce.number().int())
        .optional()
        .openapi({description: 'The range of quantity to search for'}),
    createdAt: rangeFilter(datetime).optional().openapi({description: 'The range of creation date to search for'}),
    canceledAt: z
        .preprocess((value) => (value === '' ? null : value), rangeFilter(datetime).nullish())
        .openapi({
            description: 'The range of cancellation dates to search for',
            'x-param-object': true,
        }),
    canceledBy: entityId(UserId).optional().openapi({
        description: 'The user who canceled the purchase to search for',
    }),
});

export const listSaleSchema = z.object({
    companyId: entityId(CompanyId).openapi({description: 'The company ID to search for'}),
    sellerId: entityId(UserId).optional().openapi({description: 'The seller ID to search for'}),
    items: listSaleItemSchema.optional().openapi({description: 'The sale items to search for'}),
    createdAt: rangeFilter(datetime).optional().openapi({description: 'The range of creation date to search for'}),
});
