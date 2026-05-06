import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ChangeUserPasswordDto} from '../index';

describe('A ChangeUserPasswordDto', () => {
    it.each([
        {
            oldPassword: '@J0hn@d02',
            newPassword: '@J0hn@d03',
        },
        {
            oldPassword: 'expected-invalid-format',
            newPassword: '@J0hn@d03',
        },
    ])('should accept valid payloads', (payload) => {
        expect(ChangeUserPasswordDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                oldPassword: '',
                newPassword: '@J0hn@d03',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['oldPassword'],
            },
        ],
        [
            {
                oldPassword: '@J0hn@d03',
                newPassword: '',
            },
            {
                code: ZodIssueCode.custom,
                path: ['newPassword'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ChangeUserPasswordDto.schema.safeParse(payload);

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
