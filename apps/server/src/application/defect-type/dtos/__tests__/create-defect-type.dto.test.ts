import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateDefectTypeDto} from '../create-defect-type.dto';

describe('A CreateDefectTypeDto', () => {
    it.each<Record<string, unknown>>([
        {
            companyId: CompanyId.generate().toString(),
            name: 'Defect type 1',
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'Defect type 2',
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateDefectTypeDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: 1,
                name: 'Defect type',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                companyId: 'foo',
                name: 'Defect type',
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
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 123,
                code: 1,
                price: 100,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateDefectTypeDto.schema.safeParse(payload);

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
