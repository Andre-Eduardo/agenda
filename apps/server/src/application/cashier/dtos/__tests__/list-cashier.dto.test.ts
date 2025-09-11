import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListCashierDto} from '../list-cashier.dto';

describe('A ListCashierDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            userId: UserId.generate().toString(),
            createdAt: {
                from: new Date(1000).toISOString(),
                to: new Date(1500).toISOString(),
            },
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            userId: UserId.generate().toString(),
            closedAt: {
                from: new Date(2000).toISOString(),
                to: new Date(3000).toISOString(),
            },
            pagination: {
                cursor: CompanyId.generate().toString(),
                limit: 10,
                sort: {
                    closedAt: 'desc',
                },
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            closedAt: null,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            closedAt: undefined,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            closedAt: '',
            pagination: {
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListCashierDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 'aaa',
                userId: UserId.generate().toString(),
                createdAt: {
                    from: new Date(1000).toISOString(),
                    to: new Date(1500).toISOString(),
                },
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                userId: UserId.generate().toString(),
                createdAt: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['createdAt'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                closedAt: 'a',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['closedAt'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListCashierDto.schema.safeParse(payload);

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
