import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListCustomerDto} from '../list-customer.dto';

describe('A ListCustomerDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            name: 'João',
            documentId: '15785065178',
            phone: '99999999999',
            gender: 'MALE',
            pagination: {
                limit: 10,
            },
        },

        {
            companyId: CompanyId.generate().toString(),
            name: 'João',
            documentId: '15785065178',
            pagination: {
                cursor: 'f7c43409-48eb-482b-b359-a540c7bb60ca',
                limit: 10,
                sort: {
                    name: 'asc',
                },
            },
        },

        {
            companyId: CompanyId.generate().toString(),
            name: 'maria',
            documentId: '157.850.651-78',
            phone: '(99)99999999',
            gender: 'FEMALE',
            pagination: {
                limit: 10,
            },
        },

        {
            companyId: CompanyId.generate().toString(),
            name: 'João',
            documentId: '157.850.651-78',
            phone: '(99)99999999',
            gender: 'OTHER',
            pagination: {
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListCustomerDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'João',
                documentId: '157.850.651-78',
                phone: '(99)99999999',
                gender: 'homem',
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['gender'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                phone: '9-9999999',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.custom,
                path: ['phone'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                documentId: '157..850.651-78',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.custom,
                path: ['documentId'],
            },
        ],
        [
            {
                companyId: 'aaa',
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListCustomerDto.schema.safeParse(payload);

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
