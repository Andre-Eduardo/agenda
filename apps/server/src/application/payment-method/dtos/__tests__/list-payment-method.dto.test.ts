import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {PaymentMethodType} from '../../../../domain/payment-method/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListPaymentMethodDto} from '../list-payment-method.dto';

describe('A ListPaymentMethodDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            name: 'Cash',
            type: PaymentMethodType.CASH,
            pagination: {
                limit: 10,
            },
        },

        {
            companyId: CompanyId.generate().toString(),
            name: 'Cash',
            type: PaymentMethodType.CASH,
            pagination: {
                cursor: CompanyId.generate().toString(),
                limit: 10,
                sort: {
                    name: 'asc',
                },
            },
        },

        {
            companyId: CompanyId.generate().toString(),
            name: 'Mastercard Credit',
            type: 'CREDIT_CARD',
            pagination: {
                limit: 10,
            },
        },

        {
            companyId: CompanyId.generate().toString(),
            name: 'Visa Debit',
            type: 'DEBIT_CARD',
            pagination: {
                limit: 10,
                sort: {
                    name: 'asc',
                },
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListPaymentMethodDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Bitcoin',
                type: 'crypto',
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['type'],
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
        const result = ListPaymentMethodDto.schema.safeParse(payload);

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
