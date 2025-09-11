import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListCleaningDto} from '../list-cleaning.dto';

describe('A ListCleaningDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            startedById: UserId.generate().toString(),
            finishedById: UserId.generate().toString(),
            endReason: 'FINISHED',
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            startedById: UserId.generate().toString(),
            finishedById: UserId.generate().toString(),
            endReason: 'CANCELED',
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            startedById: UserId.generate().toString(),
            finishedById: UserId.generate().toString(),
            endReason: 'EXPIRED',
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
                sort: {
                    endReason: 'asc',
                },
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            startedById: UserId.generate().toString(),
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListCleaningDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: RoomId.generate().toString(),
                startedById: UserId.generate().toString(),
                finishedById: UserId.generate().toString(),
                endReason: 'EXPIREED',
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['endReason'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: 'RoomId.generate().toString()',
                startedById: UserId.generate().toString(),
                finishedById: UserId.generate().toString(),
                endReason: 'EXPIRED',
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
                companyId: 'ecxus',
                roomId: UserId.generate().toString(),
                startedById: UserId.generate().toString(),
                finishedById: UserId.generate().toString(),
                endReason: 'EXPIRED',
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
        const result = ListCleaningDto.schema.safeParse(payload);

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
