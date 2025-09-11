import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateRoomDto} from '../index';

describe('A CreateRoomDto', () => {
    it.each<Record<string, unknown>>([
        {
            companyId: CompanyId.generate().toString(),
            categoryId: RoomCategoryId.generate().toString(),
            number: 1,
        },
        {
            companyId: CompanyId.generate().toString(),
            categoryId: RoomCategoryId.generate().toString(),
            number: 1,
            name: null,
        },
        {
            companyId: CompanyId.generate().toString(),
            categoryId: RoomCategoryId.generate().toString(),
            number: 101,
            name: 'Room 101',
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateRoomDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                categoryId: RoomCategoryId.generate().toString(),
                number: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: 'foo',
                categoryId: RoomCategoryId.generate().toString(),
                number: 1,
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: 1,
                number: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['categoryId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: 'foo',
                number: 1,
            },
            {
                code: ZodIssueCode.custom,
                path: ['categoryId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: RoomCategoryId.generate().toString(),
                number: -1,
                name: 'Room 101',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['number'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: RoomCategoryId.generate().toString(),
                number: 1,
                name: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateRoomDto.schema.safeParse(payload);

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
