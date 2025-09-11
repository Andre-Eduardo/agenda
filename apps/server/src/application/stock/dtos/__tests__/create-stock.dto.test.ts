import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {StockId, StockType} from '../../../../domain/stock/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateStockDto} from '../create-stock.dto';

describe('A CreateStockDto', () => {
    it.each<Record<string, unknown>>([
        {
            companyId: CompanyId.generate().toString(),
            name: 'Stock 1',
            type: StockType.HALLWAY,
            parentId: StockId.generate().toString(),
        },
        {
            companyId: CompanyId.generate().toString(),
            RoomId: RoomId.generate().toString(),
            type: StockType.ROOM,
            parentId: StockId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateStockDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                name: 'Main stock',
                type: StockType.HALLWAY,
                parentId: StockId.generate().toString(),
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 1,
                type: StockType.HALLWAY,
                parentId: StockId.generate().toString(),
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Main stock',
                type: 'foo',
                parentId: StockId.generate().toString(),
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['type'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: 1,
                type: StockType.ROOM,
                parentId: StockId.generate().toString(),
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['roomId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Main stock',
                type: StockType.HALLWAY,
                parentId: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['parentId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateStockDto.schema.safeParse(payload);

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
