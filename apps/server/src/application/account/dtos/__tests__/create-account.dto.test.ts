import {ZodIssueCode} from 'zod';
import {AccountType} from '../../../../domain/account/entities';
import {CompanyId} from '../../../../domain/company/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateAccountDto} from '../create-account.dto';

describe('A CreateAccountDto', () => {
    it.each<Record<string, unknown>>([
        {
            companyId: CompanyId.generate().toString(),
            name: 'Account 1',
            type: AccountType.INTERNAL,
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'Account 2',
            type: AccountType.BANK,
            bankId: 1,
            agencyNumber: 1234,
            agencyDigit: '1',
            accountDigit: 'x',
            accountNumber: 12345,
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateAccountDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                name: 'Account 1',
                type: AccountType.INTERNAL,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: 'foo',
                name: 'Account 1',
                type: AccountType.INTERNAL,
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: '',
                type: AccountType.INTERNAL,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 1,
                type: AccountType.INTERNAL,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Account 1',
                type: 'Cashier',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['type'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Account 1',
                type: AccountType.INTERNAL,
                bankId: '1',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['bankId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Account 1',
                type: AccountType.INTERNAL,
                bankId: -1,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['bankId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Account 1',
                type: AccountType.INTERNAL,
                agencyNumber: '1234',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['agencyNumber'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Account 1',
                type: AccountType.INTERNAL,
                agencyNumber: -1234,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['agencyNumber'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Account 1',
                type: AccountType.INTERNAL,
                agencyDigit: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['agencyDigit'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Account 1',
                type: AccountType.INTERNAL,
                accountDigit: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['accountDigit'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Account 1',
                type: AccountType.INTERNAL,
                accountNumber: '12345',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['accountNumber'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Account 1',
                type: AccountType.INTERNAL,
                accountNumber: -12345,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['accountNumber'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateAccountDto.schema.safeParse(payload);

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
