import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {PersonId} from '../../../../domain/person/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {createNewSupplierSchema, createSupplierFromIdSchema, createSupplierSchema} from '../create-supplier.dto';

describe('A CreateSupplierDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            name: 'João',
            documentId: '15785065178',
            companyName: 'ACME',
            phone: '99999999999',
            gender: 'MALE',
            personType: 'LEGAL',
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'João',
            documentId: '15785065178',
            personType: 'LEGAL',
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'maria',
            documentId: '157.850.651-78',
            phone: '(99)99999999',
            gender: 'FEMALE',
            personType: 'NATURAL',
        },
        {
            id: PersonId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(createSupplierSchema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157..850.651-7',
                companyName: 'ACME',
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
            },
            {code: ZodIssueCode.custom, path: ['documentId']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: '',
                documentId: '157.850.651-7',
                companyName: 'ACME',
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
            },
            {code: ZodIssueCode.too_small, path: ['name']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-7',
                companyName: '',
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
            },
            {code: ZodIssueCode.too_small, path: ['companyName']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-78',
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'homem',
            },
            {
                code: ZodIssueCode.invalid_union,
                path: [],
                unionErrors: expect.arrayContaining([
                    expect.objectContaining({
                        issues: [expect.objectContaining({code: ZodIssueCode.invalid_enum_value, path: ['gender']})],
                    }),
                ]),
            },
        ],
        [
            {
                companyId: 'aaa',
                name: 'john',
                documentId: '157.850.651-78',
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'MALE',
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-78',
                phone: '9-9999999',
                personType: 'LEGAL',
                gender: 'MALE',
            },
            {
                code: ZodIssueCode.custom,
                path: ['phone'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-78',
                phone: '619999999',
                personType: 'jurídica',
                gender: 'MALE',
            },
            {
                code: ZodIssueCode.invalid_union,
                path: [],
                unionErrors: expect.arrayContaining([
                    expect.objectContaining({
                        issues: [
                            expect.objectContaining({code: ZodIssueCode.invalid_enum_value, path: ['personType']}),
                        ],
                    }),
                ]),
            },
        ],
        [
            {
                id: 1,
            },
            {
                code: ZodIssueCode.invalid_union,
                path: [],
                unionErrors: expect.arrayContaining([
                    expect.objectContaining({
                        issues: [expect.objectContaining({code: ZodIssueCode.invalid_type, path: ['id']})],
                    }),
                ]),
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = createSupplierSchema.safeParse(payload);

        expect(result.success).toEqual(false);

        if (result.success) return;
        expect(result.error.errors).toEqual([
            expect.objectContaining({
                code: expected.code,
                path: expected.path,
                ...(expected.unionErrors && {unionErrors: expected.unionErrors}),
            }),
        ]);
    });
});

describe('A CreateNewSupplierDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            name: 'João',
            documentId: '15785065178',
            companyName: 'ACME',
            phone: '99999999999',
            gender: 'MALE',
            personType: 'LEGAL',
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'João',
            documentId: '15785065178',
            personType: 'LEGAL',
        },

        {
            companyId: CompanyId.generate().toString(),
            name: 'maria',
            documentId: '157.850.651-78',
            phone: '(99)99999999',
            gender: 'FEMALE',
            personType: 'NATURAL',
        },
    ])('should accept valid payloads', (payload) => {
        expect(createNewSupplierSchema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157..850.651-7',
                companyName: 'ACME',
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
            },
            {code: ZodIssueCode.custom, path: ['documentId']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: '',
                documentId: '157.850.651-7',
                companyName: 'ACME',
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
            },
            {code: ZodIssueCode.too_small, path: ['name']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-7',
                companyName: '',
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
            },
            {code: ZodIssueCode.too_small, path: ['companyName']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-78',
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'homem',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['gender'],
            },
        ],
        [
            {
                companyId: 'aaa',
                name: 'john',
                documentId: '157.850.651-78',
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'MALE',
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-78',
                phone: '9-9999999',
                personType: 'LEGAL',
                gender: 'MALE',
            },
            {
                code: ZodIssueCode.custom,
                path: ['phone'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-78',
                phone: '619999999',
                personType: 'jurídica',
                gender: 'MALE',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['personType'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = createNewSupplierSchema.safeParse(payload);

        expect(result.success).toEqual(false);

        if (result.success) return;
        expect(result.error.errors).toEqual([
            expect.objectContaining({
                code: expected.code,
                path: expected.path,
            }),
        ]);
    });
});

describe('A createSupplierFromIdSchema', () => {
    it.each([
        {
            id: PersonId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(createSupplierFromIdSchema.safeParse(payload)).toEqual(
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
    ])('should reject invalid payloads', (payload, expected) => {
        const result = createSupplierFromIdSchema.safeParse(payload);

        expect(result.success).toEqual(false);

        if (result.success) return;
        expect(result.error.errors).toEqual([
            expect.objectContaining({
                code: expected.code,
                path: expected.path,
            }),
        ]);
    });
});
