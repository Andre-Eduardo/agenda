import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateServiceCategoryDto} from '../create-service-category.dto';

describe('A CreateServiceCategoryDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            name: 'Maintenance',
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'Technical support',
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateServiceCategoryDto.schema.safeParse(payload)).toEqual(
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
        const result = CreateServiceCategoryDto.schema.safeParse(payload);

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
