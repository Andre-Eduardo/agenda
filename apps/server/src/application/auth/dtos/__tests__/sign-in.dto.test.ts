import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {SignInDto} from '../sign-in.dto';

describe('A SignInDto', () => {
    it.each<Record<string, unknown>>([
        {
            username: 'johndoe',
            password: '@SecurePassword123',
        },
        {
            username: 'john_doe',
            password: '@Pa$$word123',
        },
    ])('should accept valid payloads', (payload) => {
        expect(SignInDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                username: 'john..doe',
                password: '@Pa$$word123',
            },
            {
                code: ZodIssueCode.custom,
                path: ['username'],
            },
        ],
        [
            {
                username: 'john_doe',
                password: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['password'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = SignInDto.schema.safeParse(payload);

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
