import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {StockType} from '../../../../domain/stock/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListStockDto} from '../list-stock.dto';

describe('A ListStockDto', () => {
    const companyId = CompanyId.generate().toString();

    it.each([
        {
            companyId,
            name: 'Main stock',
            pagination: {
                limit: 10,
            },
        },
        {
            companyId,
            type: StockType.OTHER,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId,
            pagination: {
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListStockDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId,
                name: 10,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
        [
            {
                companyId,
                name: '',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                companyId,
                type: 'foo',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['type'],
            },
        ],
        [
            {
                companyId,
                roomId: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['roomId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListStockDto.schema.safeParse(payload);

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
