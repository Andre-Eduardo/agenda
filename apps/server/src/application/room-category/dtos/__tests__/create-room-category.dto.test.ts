import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateRoomCategoryDto} from '../index';

describe('A CreateRoomCategoryDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            name: 'LUSH',
            acronym: 'LS',
            guestCount: 10,
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'SEX',
            acronym: 'X',
            guestCount: 1,
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'sex',
            acronym: 'sx',
            guestCount: 1,
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateRoomCategoryDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                name: 'LUSH',
                acronym: 'LS',
                guestCount: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: 'foo',
                name: 'SAVANA',
                acronym: 'SV',
                guestCount: 1,
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: '',
                acronym: 'ct',
                guestCount: 1,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'BAUHAUS DESIGN',
                acronym: '',
                guestCount: 1,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['acronym'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'PROVENCIAL HIDRO',
                acronym: 'PRH',
                guestCount: 1,
            },
            {
                code: ZodIssueCode.too_big,
                path: ['acronym'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'BANGKOK',
                acronym: 'BK',
                guestCount: -1,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['guestCount'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'NOVA BALI',
                acronym: 'NB',
                guestCount: 0,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['guestCount'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateRoomCategoryDto.schema.safeParse(payload);

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
