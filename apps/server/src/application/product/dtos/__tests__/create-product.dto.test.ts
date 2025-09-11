import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateProductDto} from '../create-product.dto';

describe('A CreateProductDto', () => {
    it.each<Record<string, unknown>>([
        {
            companyId: CompanyId.generate().toString(),
            categoryId: ProductCategoryId.generate().toString(),
            name: 'Product 1',
            code: 1,
            price: 100,
        },
        {
            companyId: CompanyId.generate().toString(),
            categoryId: ProductCategoryId.generate().toString(),
            name: 'Product 2',
            code: 2,
            price: 200,
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateProductDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                categoryId: ProductCategoryId.generate().toString(),
                name: 'Product 1',
                code: 1,
                price: 100,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: 'foo',
                categoryId: ProductCategoryId.generate().toString(),
                name: 'Product 1',
                code: 1,
                price: 100,
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: 1,
                name: 'Product 1',
                code: 1,
                price: 100,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['categoryId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: 'foo',
                name: 'Product 1',
                code: 1,
                price: 100,
            },
            {
                code: ZodIssueCode.custom,
                path: ['categoryId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: ProductCategoryId.generate().toString(),
                name: '',
                code: 1,
                price: 100,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: ProductCategoryId.generate().toString(),
                name: 'Product 1',
                code: -1,
                price: 100,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['code'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: ProductCategoryId.generate().toString(),
                name: 'Product 1',
                code: 1,
                price: -100,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['price'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateProductDto.schema.safeParse(payload);

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
