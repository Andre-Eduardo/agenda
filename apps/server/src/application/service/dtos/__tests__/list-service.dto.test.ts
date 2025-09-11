import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListServiceDto} from '../list-service.dto';

describe('A ListServiceDto', () => {
    const companyId = CompanyId.generate().toString();
    const categoryId = ServiceCategoryId.generate().toString();

    it.each([
        {
            name: 'Service 1',
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
        expect(ListServiceDto.schema.safeParse(payload)).toEqual(
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
        const result = ListServiceDto.schema.safeParse(payload);

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
