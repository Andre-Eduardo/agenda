import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListBlockadeDto} from '../list-blockade.dto';

describe('A ListBlockDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            startedById: UserId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            startedById: UserId.generate().toString(),
            finishedById: UserId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },

        {
            companyId: CompanyId.generate().toString(),
            note: 'Note',
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListBlockadeDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: 'RoomId.generate().toString()',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.custom,
                path: ['roomId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                finishedById: null,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['finishedById'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                startedById: null,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['startedById'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                note: 123,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['note'],
            },
        ],
        [
            {
                companyId: 'ecxus',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListBlockadeDto.schema.safeParse(payload);

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
