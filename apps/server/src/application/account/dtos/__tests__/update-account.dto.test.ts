import {ZodIssueCode} from 'zod';
import {AccountType} from '../../../../domain/account/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateAccountInputDto} from '../update-account.dto';

describe('A UpdateAccountInputDto', () => {
    it.each([
        {
            name: 'Name 1',
            type: AccountType.INTERNAL,
        },
        {
            name: 'Name 2',
            type: AccountType.BANK,
            bankId: 1,
            agencyNumber: 1234,
            agencyDigit: '1',
            accountDigit: '1',
            accountNumber: 12345,
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateAccountInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                type: 'foo',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['type'],
            },
        ],
        [
            {
                bankId: '12',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['bankId'],
            },
        ],
        [
            {
                agencyNumber: '123',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['agencyNumber'],
            },
        ],
        [
            {
                agencyDigit: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['agencyDigit'],
            },
        ],
        [
            {
                agencyDigit: -1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['agencyDigit'],
            },
        ],

        [
            {
                accountDigit: -1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['accountDigit'],
            },
        ],
        [
            {
                accountNumber: '1234',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['accountNumber'],
            },
        ],
        [
            {
                accountNumber: -1234,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['accountNumber'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateAccountInputDto.schema.safeParse(payload);

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
