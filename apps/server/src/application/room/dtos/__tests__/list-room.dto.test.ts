import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListRoomDto} from '../list-room.dto';

describe('A ListRoomDto', () => {
    const companyId = CompanyId.generate().toString();

    it.each([
        {
            name: 'Apartamento 101',
            number: 101,
            companyId,
            pagination: {
                limit: 10,
            },
        },
        {
            number: 101,
            companyId,
            pagination: {
                limit: 10,
            },
        },
        {
            name: 'A',
            companyId,
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
        expect(ListRoomDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: 10,
                companyId,
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
                companyId: 1,
                number: 1,
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
                number: 'dois',
                name: 'Room 101',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['number'],
            },
        ],
        [
            {
                companyId,
                number: 1,
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
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListRoomDto.schema.safeParse(payload);

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
