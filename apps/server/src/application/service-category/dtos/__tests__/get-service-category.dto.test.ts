import {ZodIssueCode} from 'zod';
import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {GetServiceCategoryDto} from '../get-service-category.dto';

describe('A GetServiceCategoryDto', () => {
    it.each([
        {
            id: ServiceCategoryId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(GetServiceCategoryDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                id: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['id'],
            },
        ],
        [
            {
                id: 'Tech support',
            },
            {
                code: ZodIssueCode.custom,
                path: ['id'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = GetServiceCategoryDto.schema.safeParse(payload);

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
