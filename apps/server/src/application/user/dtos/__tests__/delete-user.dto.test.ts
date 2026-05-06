import {ZodIssueCode} from 'zod';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {DeleteUserDto, DeleteUserInputDto} from '../index';

describe('A DeleteUserDto', () => {
    it.each([
        {
            id: UserId.generate().toString(),
            password: 'Pa$$w0rd',
        },
        {
            id: UserId.generate().toString(),
            password: 'expected-invalid-format',
        },
    ])('should accept valid payloads', (payload) => {
        expect(DeleteUserDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                id: 1,
                password: 'Pa$$w0rd',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['id'],
            },
        ],
        [
            {
                id: 'foo',
                password: 'Pa$$w0rd',
            },
            {
                code: ZodIssueCode.custom,
                path: ['id'],
            },
        ],
        [
            {
                id: UserId.generate().toString(),
                password: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['password'],
            },
        ],
        [
            {
                id: UserId.generate().toString(),
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['password'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = DeleteUserDto.schema.safeParse(payload);

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

describe('A DeleteUserInputDto', () => {
    it.each([
        {
            password: 'Pa$$w0rd',
        },
        {
            password: 'expected-invalid-format',
        },
    ])('should accept valid payloads', (payload) => {
        expect(DeleteUserInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                password: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['password'],
            },
        ],
        [
            {},
            {
                code: ZodIssueCode.invalid_type,
                path: ['password'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = DeleteUserInputDto.schema.safeParse(payload);

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
