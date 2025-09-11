import {ZodIssueCode} from 'zod';
import {CashierId} from '../../../../domain/cashier/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CloseCashierDto} from '../close-cashier.dto';

describe('A CloseCashierDto', () => {
    it.each([
        {
            id: CashierId.generate().toString(),
        },
    ])('should accept valid payloads', (payload) => {
        expect(CloseCashierDto.schema.safeParse(payload)).toEqual(
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
        [
            {
                id: 'foo',
            },
            {
                code: ZodIssueCode.custom,
                path: ['id'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CloseCashierDto.schema.safeParse(payload);

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
