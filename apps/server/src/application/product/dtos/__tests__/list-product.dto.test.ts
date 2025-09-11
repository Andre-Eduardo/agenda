import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListProductDto} from '../list-product.dto';

describe('A ListProductDto', () => {
    const companyId = CompanyId.generate().toString();
    const categoryId = ProductCategoryId.generate().toString();

    it.each([
        {
            name: 'Product 1',
            companyId,
            categoryId,
            pagination: {
                limit: 10,
            },
        },
        {
            companyId,
            categoryId,
            pagination: {
                limit: 10,
            },
        },
        {
            price: 100,
            companyId,
            pagination: {
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListProductDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: 10,
                companyId,
                categoryId,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
        [
            {
                companyId: 1,
                categoryId,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId,
                categoryId: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['categoryId'],
            },
        ],
        [
            {
                companyId,
                categoryId,
                name: '',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListProductDto.schema.safeParse(payload);

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
