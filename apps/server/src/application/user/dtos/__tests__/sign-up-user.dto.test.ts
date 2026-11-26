import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {SignUpUserDto} from '../index';

describe('A SignUpUserDto', () => {
    it.each<Record<string, unknown>>([
        {
            name: 'John Doe',
            email: 'john.doe@example.com',
            username: 'johndoe',
            password: '@SecurePassword123',
        },
        {
            name: 'John',
            email: 'john.doe@ecxus.com',
            username: 'john_doe',
            password: '@Pa$$word123',
            inviteCode: 'invite-code',
        },
        {
            name: 'John',
            email: 'john.doe@ecxus.com',
            username: 'john_doe',
            password: '@Pa$$word123',
            inviteCode: null,
        },
    ])('should accept valid payloads', (payload) => {
        expect(SignUpUserDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: '',
                email: 'john.doe@example.com',
                username: 'johndoe',
                password: '@SecurePassword123',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                email: 'john.doe@example.com',
                username: 'johndoe',
                password: '@SecurePassword123',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
        [
            {
                name: 'John Doe',
                email: 'john.doe@',
                username: 'johndoe',
                password: '@SecurePassword123',
            },
            {
                code: ZodIssueCode.custom,
                path: ['email'],
            },
        ],
        [
            {
                name: 'John',
                email: 'john.doe@ecxus.com',
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
                name: 'John',
                email: 'john.doe@ecxus.com',
                username: 'john_doe',
                password: '123',
            },
            {
                code: ZodIssueCode.custom,
                path: ['password'],
            },
        ],
        [
            {
                name: 'John',
                email: 'john.doe@ecxus.com',
                username: 'john_doe',
                password: '@Pa$$word123',
                inviteCode: 'x'.repeat(257),
            },
            {
                code: ZodIssueCode.too_big,
                path: ['inviteCode'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = SignUpUserDto.schema.safeParse(payload);

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
