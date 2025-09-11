import {ZodIssueCode} from 'zod';
import {AuditEndReasonType} from '../../../../domain/audit/entities';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListAuditDto} from '../list-audit.dto';

describe('A ListAuditDto', () => {
    const companyId = CompanyId.generate().toString();
    const responsible = UserId.generate().toString();

    it.each([
        {
            companyId,
            roomId: RoomId.generate().toString(),
            startedById: responsible,
            finishedById: responsible,
            reason: 'audit reason',
            note: 'Audit took longer than expected',
            endReason: AuditEndReasonType.COMPLETED,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId,
            roomId: RoomId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            companyId,
            startedById: responsible,
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
                sort: {
                    endReason: 'asc',
                },
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListAuditDto.schema.safeParse(payload)).toEqual(
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
        [
            {
                companyId,
                startedById: 1,
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
                companyId,
                finishedById: 1,
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
                companyId,
                reason: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['reason'],
            },
        ],
        [
            {
                companyId,
                note: 1,
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
                companyId,
                endReason: 'foo',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['endReason'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListAuditDto.schema.safeParse(payload);

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
