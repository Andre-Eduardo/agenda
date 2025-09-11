import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateCompanyDto} from '../index';

describe('A CreateCompanyDto', () => {
    it.each([
        {
            name: 'Company 1',
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateCompanyDto.schema.safeParse(payload)).toEqual(
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
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateCompanyDto.schema.safeParse(payload);

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
