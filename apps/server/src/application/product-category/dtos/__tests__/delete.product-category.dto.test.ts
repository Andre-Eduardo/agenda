import {ZodIssueCode} from 'zod';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {DeleteProductCategoryDto} from '../delete-product-category.dto';

describe('A DeleteProductCategoryDto', () => {
    it.each([
        {
            id: ProductCategoryId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(DeleteProductCategoryDto.schema.safeParse(payload)).toEqual(
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
                id: 'Cleaning',
            },
            {
                code: ZodIssueCode.custom,
                path: ['id'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = DeleteProductCategoryDto.schema.safeParse(payload);

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
