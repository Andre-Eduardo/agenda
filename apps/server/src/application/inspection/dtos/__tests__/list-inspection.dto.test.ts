import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {InspectionEndReasonType} from '../../../../domain/inspection/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListInspectionDto} from '../list-inspection.dto';

describe('A ListInspectionDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            startedById: UserId.generate().toString(),
            startAt: {
                from: new Date(1000).toISOString(),
                to: new Date(1500).toISOString(),
            },
            finishedAt: {
                from: new Date(2000).toISOString(),
                to: new Date(3000).toISOString(),
            },
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            responsibleId: UserId.generate().toString(),
            roomId: UserId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            note: 'a',
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            responsibleId: UserId.generate().toString(),
            endReason: InspectionEndReasonType.APPROVED,
            startAt: {
                from: new Date(1000).toISOString(),
                to: new Date(1500).toISOString(),
            },
            finishedAt: {
                from: new Date(2000).toISOString(),
                to: new Date(3000).toISOString(),
            },
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
                sort: {
                    finishedAt: 'asc',
                },
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            finishedById: UserId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            finishedById: UserId.generate().toString(),
            endReason: InspectionEndReasonType.APPROVED,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            finishedAt: null,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            finishedAt: null,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            finishedAt: undefined,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            finishedAt: '',
            pagination: {
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListInspectionDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                startedById: UserId.generate().toString(),
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                startedById: 1,
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['startedById'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                startedById: UserId.generate().toString(),
                endReason: 'foo',
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
                startedById: UserId.generate().toString(),
                roomId: 1,
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['roomId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                startedById: UserId.generate().toString(),
                finishedById: 1,
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['finishedById'],
            },
        ],
    ])(`should reject invalid payloads`, (payload, expected) => {
        const result = ListInspectionDto.schema.safeParse(payload);

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
