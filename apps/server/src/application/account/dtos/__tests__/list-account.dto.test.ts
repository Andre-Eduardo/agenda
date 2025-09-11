import {ZodIssueCode} from 'zod';
import {AccountType} from '../../../../domain/account/entities';
import {CompanyId} from '../../../../domain/company/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListAccountDto} from '../list-account.dto';

describe('A ListAccountDto', () => {
    const companyId = CompanyId.generate().toString();

    it.each([
        {
            name: 'Account 1',
            type: AccountType.INTERNAL,
            companyId,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId,
            name: 'Account 1',
            pagination: {
                limit: 10,
            },
        },
        {
            companyId,
            Type: AccountType.INTERNAL,
            pagination: {
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListAccountDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId,
                name: 10,
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
                type: 'foo',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['type'],
            },
        ],
        [
            {
                companyId,
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
        const result = ListAccountDto.schema.safeParse(payload);

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
