import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListServiceCategoryDto} from '../list-service-category.dto';

describe('A ListServiceCategoryDto', () => {
    it.each([
        {
            name: 'Technical support',
            companyId: CompanyId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            name: 'Maintenance',
            companyId: CompanyId.generate().toString(),
            pagination: {
                cursor: ServiceCategoryId.generate().toString(),
                limit: 10,
                sort: {
                    name: 'asc',
                },
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListServiceCategoryDto.schema.safeParse(payload)).toEqual(
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
                name: 'Maintenance',
                companyId: '5',
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expectedIssue) => {
        expect(ListServiceCategoryDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    issues: expect.arrayContaining([expect.objectContaining(expectedIssue)]),
                }),
            })
        );
    });
});
