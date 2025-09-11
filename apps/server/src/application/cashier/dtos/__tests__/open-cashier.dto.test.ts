import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {OpenCashierDto} from '../open-cashier.dto';

describe('A OpenCashierDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            userId: UserId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(OpenCashierDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                userId: 'aaa',
            },
            {
                code: ZodIssueCode.custom,
                path: ['userId'],
            },
        ],
        [
            {
                companyId: 'aaa',
                userId: UserId.generate().toString(),
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = OpenCashierDto.schema.safeParse(payload);

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
