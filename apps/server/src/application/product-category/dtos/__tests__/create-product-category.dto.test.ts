import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateProductCategoryDto} from '../create-product-category.dto';

describe('A CreateProductCategoryDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            name: 'Food',
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'Cleaning',
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateProductCategoryDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                name: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: true,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateProductCategoryDto.schema.safeParse(payload);

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
