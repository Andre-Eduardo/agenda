import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListProductCategoryDto} from '../list-product-category.dto';

describe('A ListProductCategoryDto', () => {
    it.each([
        {
            name: 'Decorating',
            companyId: CompanyId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            name: 'Cleaning',
            companyId: CompanyId.generate().toString(),
            pagination: {
                cursor: ProductCategoryId.generate().toString(),
                limit: 10,
                sort: {
                    name: 'asc',
                },
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListProductCategoryDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                name: 5,
                companyId: CompanyId.generate().toString(),
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
        [
            {
                name: 'Main Dishes',
                companyId: '5',
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expectedIssue) => {
        expect(ListProductCategoryDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    issues: expect.arrayContaining([expect.objectContaining(expectedIssue)]),
                }),
            })
        );
    });
});
