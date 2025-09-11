import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {ServiceId} from '../../../../domain/service/entities';
import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateServiceDto} from '../create-service.dto';

describe('A CreateServiceDto', () => {
    it.each<Record<string, unknown>>([
        {
            companyId: CompanyId.generate().toString(),
            categoryId: ServiceId.generate().toString(),
            name: 'Foot Spa',
            code: 9,
            price: 500,
        },
        {
            companyId: CompanyId.generate().toString(),
            categoryId: ServiceId.generate().toString(),
            name: 'Special decorating',
            code: 2,
            price: 200,
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateServiceDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                categoryId: ServiceCategoryId.generate().toString(),
                name: 'Foot Spa',
                code: 9,
                price: 500,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: 'foo',
                categoryId: ServiceCategoryId.generate().toString(),
                name: 'Special decorating',
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
                name: 'Service 1',
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
                name: 'Service 1',
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
                categoryId: ServiceCategoryId.generate().toString(),
                name: '',
                code: 1,
                price: 874.9,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: ServiceCategoryId.generate().toString(),
                name: 'Service 5',
                code: -12,
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
                categoryId: ServiceCategoryId.generate().toString(),
                name: 'Service',
                code: '-12',
                price: 100,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['code'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                categoryId: ServiceCategoryId.generate().toString(),
                name: 'Service 1',
                code: 1,
                price: -20,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['price'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateServiceDto.schema.safeParse(payload);

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
