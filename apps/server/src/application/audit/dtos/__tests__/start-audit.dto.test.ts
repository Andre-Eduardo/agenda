import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {StartAuditDto} from '../start-audit.dto';

describe('A StartAuditDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            startedById: UserId.generate().toString(),
            reason: 'audit 1 reason',
        },
        {
            companyId: CompanyId.generate().toString(),
            roomId: RoomId.generate().toString(),
            startedById: UserId.generate().toString(),
            reason: 'audit 2 reason',
        },
    ])(`should accept valid payloads`, (payload) => {
        expect(StartAuditDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                roomId: RoomId.generate().toString(),
                startedById: UserId.generate().toString(),
                reason: 'audit reason',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: 'foo',
                roomId: RoomId.generate().toString(),
                startedById: UserId.generate().toString(),
                reason: 'audit reason',
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: 1,
                startedById: UserId.generate().toString(),
                reason: 'audit reason',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['roomId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: 'foo',
                startedById: UserId.generate().toString(),
                reason: 'audit reason',
            },
            {
                code: ZodIssueCode.custom,
                path: ['roomId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: RoomId.generate().toString(),
                startedById: 1,
                reason: 'audit reason',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['startedById'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: RoomId.generate().toString(),
                startedById: 'foo',
                reason: 'audit reason',
            },
            {
                code: ZodIssueCode.custom,
                path: ['startedById'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: RoomId.generate().toString(),
                startedById: UserId.generate().toString(),
                reason: 123,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['reason'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                roomId: RoomId.generate().toString(),
                startedById: UserId.generate().toString(),
                reason: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['reason'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = StartAuditDto.schema.safeParse(payload);

        expect(result.success).toBe(false);

        if (result.success) {
            return;
        }

        expect(result.error.errors).toEqual([
            expect.objectContaining({
                code: expected.code,
                path: expected.path,
                ...(expected.keys && {keys: expected.keys}),
            }),
        ]);
    });
});
