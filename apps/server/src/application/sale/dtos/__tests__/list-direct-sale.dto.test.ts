import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {PersonId} from '../../../../domain/person/entities';
import {ProductId} from '../../../../domain/product/entities';
import {SaleId} from '../../../../domain/sale/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListDirectSaleDto} from '../list-direct-sale.dto';

describe('A ListDirectSaleDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            buyerId: PersonId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            sellerId: UserId.generate().toString(),
            buyerId: '',
            createdAt: {
                from: new Date(10).toISOString(),
                to: new Date(1000).toISOString(),
            },
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
                sort: {
                    createdAt: 'asc',
                },
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            sellerId: UserId.generate().toString(),
            buyerId: PersonId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            items: {
                companyId: CompanyId.generate().toString(),
                saleId: SaleId.generate().toString(),
                price: {from: 10, to: '100'},
                quantity: {from: '2', to: '50'},
                canceledBy: UserId.generate().toString(),
                pagination: {
                    limit: 10,
                },
            },
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            items: {
                companyId: CompanyId.generate().toString(),
                productId: ProductId.generate().toString(),
                quantity: {from: 2, to: 50},
                createdAt: {
                    from: new Date(10).toISOString(),
                    to: new Date(1000).toISOString(),
                },
                canceledAt: '',
                pagination: {
                    cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                    limit: 10,
                    sort: {
                        createdAt: 'asc',
                    },
                },
            },
            pagination: {
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListDirectSaleDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                buyerId: 1,
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['buyerId'],
            },
        ],
        [
            {
                companyId: 'aaa',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                items: {
                    saleId: 1,
                    pagination: {limit: 10},
                },
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['items', 'saleId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                items: {
                    quantity: 3,
                },
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['items', 'quantity'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                items: {
                    canceledAt: 'a',
                },
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['items', 'canceledAt'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListDirectSaleDto.schema.safeParse(payload);

        expect(result.success).toEqual(false);

        if (result.success) return;

        expect(result.error.errors).toEqual([
            expect.objectContaining({
                code: expected.code,
                path: expected.path,
                ...(expected.keys && {keys: expected.keys}),
            }),
        ]);
    });
});
