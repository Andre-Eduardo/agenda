import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {PaymentMethodType} from '../../../../domain/payment-method/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreatePaymentMethodDto} from '../index';

describe('A CreatePaymentMethodDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            name: 'Cash',
            type: PaymentMethodType.CASH,
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'Pix',
            type: PaymentMethodType.PIX,
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'Mastercard Credit',
            type: PaymentMethodType.CREDIT_CARD,
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'Visa Debit',
            type: PaymentMethodType.DEBIT_CARD,
        },
        {
            companyId: CompanyId.generate().toString(),
            name: 'Bank check',
            type: PaymentMethodType.OTHER,
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreatePaymentMethodDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                name: '',
                type: PaymentMethodType.OTHER,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['name'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Bitcoin',
                type: 'CRYPTO',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['type'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                type: PaymentMethodType.CASH,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['name'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                name: 'Cash',
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['type'],
            },
        ],
        [
            {
                companyId: 'aaa',
                name: 'Cash',
                type: PaymentMethodType.CASH,
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreatePaymentMethodDto.schema.safeParse(payload);

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
