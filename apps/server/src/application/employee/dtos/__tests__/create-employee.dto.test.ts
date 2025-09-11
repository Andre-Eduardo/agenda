import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {EmployeePositionId} from '../../../../domain/employee-position/entities';
import {PersonId} from '../../../../domain/person/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {createEmployeeFromIdSchema, createEmployeeSchema, createNewEmployeeSchema} from '../create-employee.dto';

const createNewEmployeeSchemaValidPayloads = [
    {
        companyId: CompanyId.generate().toString(),
        name: 'João',
        documentId: '15785065178',
        phone: '99999999999',
        positionId: EmployeePositionId.generate().toString(),
        gender: 'MALE',
        personType: 'LEGAL',
        allowSystemAccess: false,
    },
    {
        companyId: CompanyId.generate().toString(),
        name: 'João',
        documentId: '15785065178',
        positionId: EmployeePositionId.generate().toString(),
        personType: 'LEGAL',
        allowSystemAccess: false,
    },
    {
        companyId: CompanyId.generate().toString(),
        name: 'maria',
        documentId: '157.850.651-78',
        phone: '(99)99999999',
        positionId: EmployeePositionId.generate().toString(),
        gender: 'FEMALE',
        personType: 'NATURAL',
        allowSystemAccess: false,
    },
    {
        companyId: CompanyId.generate().toString(),
        name: 'João',
        documentId: '15785065178',
        phone: '99999999999',
        positionId: EmployeePositionId.generate().toString(),
        gender: 'MALE',
        personType: 'LEGAL',
        allowSystemAccess: true,
        username: 'john_doe',
        password: 'Pa$$w0rd',
    },
];

const createEmployeeFromIdSchemaValidPayloads = [
    {
        id: PersonId.generate().toString(),
        positionId: EmployeePositionId.generate().toString(),
        allowSystemAccess: false,
    },
    {
        id: PersonId.generate().toString(),
        positionId: EmployeePositionId.generate().toString(),
        allowSystemAccess: true,
        username: 'john_doe',
        password: 'Pa$$w0rd',
    },
];

describe('A CreateEmployeeDto', () => {
    it.each([...createNewEmployeeSchemaValidPayloads, ...createEmployeeFromIdSchemaValidPayloads])(
        'should accept valid payloads',
        (payload) => {
            expect(createEmployeeSchema.safeParse(payload)).toEqual(
                expect.objectContaining({
                    success: true,
                })
            );
        }
    );

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157..850.651-7',
                positionId: EmployeePositionId.generate().toString(),
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
                allowSystemAccess: false,
            },
            {code: ZodIssueCode.custom, path: ['documentId']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: '',
                documentId: '157.850.651-7',
                positionId: EmployeePositionId.generate().toString(),
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
                allowSystemAccess: false,
            },
            {code: ZodIssueCode.too_small, path: ['name']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-7',
                companyName: '',
                positionId: EmployeePositionId.generate().toString(),
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
                allowSystemAccess: false,
            },
            {code: ZodIssueCode.too_small, path: ['companyName']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-78',
                positionId: EmployeePositionId.generate().toString(),
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'homem',
                allowSystemAccess: false,
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
                positionId: EmployeePositionId.generate().toString(),
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'MALE',
                allowSystemAccess: false,
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
                positionId: EmployeePositionId.generate().toString(),
                phone: '9-9999999',
                personType: 'LEGAL',
                gender: 'MALE',
                allowSystemAccess: false,
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
                personType: 'LEGAL',
                gender: 'MALE',
                allowSystemAccess: false,
            },
            {
                code: ZodIssueCode.invalid_union,
                path: [],
                unionErrors: expect.arrayContaining([
                    expect.objectContaining({
                        issues: [expect.objectContaining({code: ZodIssueCode.invalid_type, path: ['positionId']})],
                    }),
                ]),
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-78',
                phone: '619999999',
                positionId: EmployeePositionId.generate().toString(),
                personType: 'jurídica',
                gender: 'MALE',
                allowSystemAccess: false,
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
                positionId: EmployeePositionId.generate().toString(),
                allowSystemAccess: false,
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
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'João',
                documentId: '15785065178',
                positionId: EmployeePositionId.generate().toString(),
                personType: 'LEGAL',
                allowSystemAccess: 'foo',
            },
            {
                code: ZodIssueCode.invalid_union,
                path: [],
                unionErrors: expect.arrayContaining([
                    expect.objectContaining({
                        issues: [
                            expect.objectContaining({
                                code: ZodIssueCode.invalid_type,
                                path: ['allowSystemAccess'],
                            }),
                        ],
                    }),
                ]),
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'João',
                documentId: '15785065178',
                positionId: EmployeePositionId.generate().toString(),
                personType: 'LEGAL',
                allowSystemAccess: true,
                username: '..',
            },
            {
                code: ZodIssueCode.custom,
                path: ['username'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'João',
                documentId: '15785065178',
                positionId: EmployeePositionId.generate().toString(),
                personType: 'LEGAL',
                allowSystemAccess: true,
                password: '..',
            },
            {
                code: ZodIssueCode.custom,
                path: ['password'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = createEmployeeSchema.safeParse(payload);

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

describe('A createNewEmployeeSchema', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            name: 'João',
            documentId: '15785065178',
            phone: '99999999999',
            positionId: EmployeePositionId.generate().toString(),
            gender: 'MALE',
            personType: 'LEGAL',
            allowSystemAccess: false,
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'João',
            documentId: '15785065178',
            positionId: EmployeePositionId.generate().toString(),
            personType: 'LEGAL',
            allowSystemAccess: false,
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'maria',
            documentId: '157.850.651-78',
            phone: '(99)99999999',
            positionId: EmployeePositionId.generate().toString(),
            gender: 'FEMALE',
            personType: 'NATURAL',
            allowSystemAccess: false,
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'João',
            documentId: '15785065178',
            phone: '99999999999',
            positionId: EmployeePositionId.generate().toString(),
            gender: 'MALE',
            personType: 'LEGAL',
            allowSystemAccess: true,
            username: 'john_doe',
            password: 'Pa$$w0rd',
        },
    ])('should accept valid payloads', (payload) => {
        expect(createNewEmployeeSchema.safeParse(payload)).toEqual(
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
                positionId: EmployeePositionId.generate().toString(),
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
                allowSystemAccess: false,
            },
            {code: ZodIssueCode.custom, path: ['documentId']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: '',
                documentId: '157.850.651-7',
                positionId: EmployeePositionId.generate().toString(),
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
                allowSystemAccess: false,
            },
            {code: ZodIssueCode.too_small, path: ['name']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-7',
                companyName: '',
                positionId: EmployeePositionId.generate().toString(),
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'OTHER',
                allowSystemAccess: false,
            },
            {code: ZodIssueCode.too_small, path: ['companyName']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-78',
                positionId: EmployeePositionId.generate().toString(),
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'homem',
                allowSystemAccess: false,
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
                positionId: EmployeePositionId.generate().toString(),
                phone: '(99)99999999',
                personType: 'LEGAL',
                gender: 'MALE',
                allowSystemAccess: false,
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
                positionId: EmployeePositionId.generate().toString(),
                phone: '9-9999999',
                personType: 'LEGAL',
                gender: 'MALE',
                allowSystemAccess: false,
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
                positionId: 1,
                personType: 'LEGAL',
                gender: 'MALE',
                allowSystemAccess: false,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['positionId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'john',
                documentId: '157.850.651-78',
                phone: '619999999',
                positionId: EmployeePositionId.generate().toString(),
                personType: 'jurídica',
                gender: 'MALE',
                allowSystemAccess: false,
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['personType'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = createNewEmployeeSchema.safeParse(payload);

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

describe('A createEmployeeFromIdSchema', () => {
    it.each([
        {
            id: PersonId.generate().toString(),
            positionId: EmployeePositionId.generate().toString(),
            allowSystemAccess: false,
        },
    ])('should accept valid payloads', (payload) => {
        expect(createEmployeeFromIdSchema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                id: 1,
                positionId: EmployeePositionId.generate().toString(),
                allowSystemAccess: false,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['id'],
            },
        ],
        [
            {
                id: PersonId.generate().toString(),
                positionId: 1,
                allowSystemAccess: false,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['positionId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = createEmployeeFromIdSchema.safeParse(payload);

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
