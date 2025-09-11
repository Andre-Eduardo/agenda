import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {StockId} from '../../../../domain/stock/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateStockInputDto} from '../update-stock.dto';

describe('A UpdateStockDto', () => {
    it.each<Record<string, unknown>>([
        {
            id: StockId.generate().toString(),
            name: 'Stock',
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateStockInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                id: StockId.generate().toString(),
                companyId: CompanyId.generate().toString(),
                name: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
    ])(`should reject invalid payloads`, (payload, expected) => {
        const result = UpdateStockInputDto.schema.safeParse(payload);

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

describe('A UpdateStockInputDto', () => {
    it.each([
        {
            name: 'Stock hall',
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateStockInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                name: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateStockInputDto.schema.safeParse(payload);

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
