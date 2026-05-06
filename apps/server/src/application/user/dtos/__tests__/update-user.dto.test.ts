import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateUserInputDto} from '../index';

describe('An UpdateUserInput', () => {
    it.each([
        {
            firstName: 'John',
            email: 'john.doe@example.com',
            username: 'johndoe',
            currentPassword: '@Pa$$word123',
        },
        {
            username: 'johndoe',
            currentPassword: '@Pa$$word123',
        },
        {
            lastName: null,
            currentPassword: '@Pa$$word123',
        },
        {
            username: 'johndoe',
            currentPassword: 'expected-invalid-format',
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateUserInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                firstName: '',
                currentPassword: '@SecurePassword123',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['firstName'],
            },
        ],
        [
            {
                lastName: '',
                currentPassword: '@SecurePassword123',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['lastName'],
            },
        ],
        [
            {
                email: 'john.doe@',
                currentPassword: '@SecurePassword123',
            },
            {
                code: ZodIssueCode.custom,
                path: ['email'],
            },
        ],
        [
            {
                username: 'john..doe',
                currentPassword: '@Pa$$word123',
            },
            {
                code: ZodIssueCode.custom,
                path: ['username'],
            },
        ],
        [
            {
                currentPassword: 123,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['currentPassword'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateUserInputDto.schema.safeParse(payload);

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
