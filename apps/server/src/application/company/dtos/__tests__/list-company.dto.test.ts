import {ZodIssueCode} from 'zod';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListCompanyDto} from '../index';

describe('A ListCompanyDto', () => {
    it.each([
        {
            name: 'Company Name',
            pagination: {
                limit: 10,
            },
        },
        {
            name: 'Company Name',
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
                sort: {
                    name: 'asc',
                },
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListCompanyDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: 1,
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListCompanyDto.schema.safeParse(payload);

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
