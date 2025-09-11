import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {ProductId} from '../../../../domain/product/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateDirectSaleDto} from '../index';

describe('A CreateDirectSaleDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            buyerId: PersonId.generate().toString(),
            items: [
                {
                    productId: ProductId.generate().toString(),
                    price: 12.3,
                    quantity: 3,
                },
            ],
            transactions: [{amount: 10, paymentMethodId: PaymentMethodId.generate().toString()}],
            note: 'note',
        },
        {
            companyId: CompanyId.generate().toString(),
            items: [
                {
                    productId: ProductId.generate().toString(),
                    price: 0.1,
                    quantity: 1,
                    note: 'note',
                },
            ],
            transactions: [{amount: 1, paymentMethodId: PaymentMethodId.generate().toString()}],
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateDirectSaleDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                items: [],
                transactions: [{amount: 10, paymentMethodId: PaymentMethodId.generate().toString()}],
                note: 'note',
            },
            {code: ZodIssueCode.too_small, path: ['items']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                buyerId: null,
                items: [
                    {
                        productId: ProductId.generate().toString(),
                        price: 0.1,
                        quantity: 1,
                    },
                ],
                transactions: [{amount: 10, paymentMethodId: PaymentMethodId.generate().toString()}],
                note: '',
            },
            {code: ZodIssueCode.too_small, path: ['note']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                items: [
                    {
                        productId: ProductId.generate().toString(),
                        price: -0.1,
                        quantity: 1,
                    },
                ],
                transactions: [{amount: 10, paymentMethodId: PaymentMethodId.generate().toString()}],
                note: '12',
            },
            {code: ZodIssueCode.too_small, path: ['items', 0, 'price']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                items: [
                    {
                        productId: ProductId.generate().toString(),
                        price: 1,
                        quantity: 0,
                    },
                ],
                transactions: [{amount: 10, paymentMethodId: PaymentMethodId.generate().toString()}],
                note: '12',
            },
            {code: ZodIssueCode.too_small, path: ['items', 0, 'quantity']},
        ],
        [
            {
                companyId: 'aaa',
                buyerId: PersonId.generate().toString(),
                items: [
                    {
                        productId: ProductId.generate().toString(),
                        price: 0.1,
                        quantity: 1,
                    },
                ],
                transactions: [{amount: 10, paymentMethodId: PaymentMethodId.generate().toString()}],
            },
            {code: ZodIssueCode.custom, path: ['companyId']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                buyerId: PersonId.generate().toString(),
                transactions: [{amount: 10, paymentMethodId: PaymentMethodId.generate().toString()}],
            },
            {code: ZodIssueCode.invalid_type, path: ['items']},
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                buyerId: PersonId.generate().toString(),
                items: [
                    {
                        productId: ProductId.generate().toString(),
                        price: 0.1,
                        quantity: 1,
                    },
                ],
                transactions: [{amount: -1, paymentMethodId: PaymentMethodId.generate().toString()}],
            },
            {code: ZodIssueCode.too_small, path: ['transactions', 0, 'amount']},
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateDirectSaleDto.schema.safeParse(payload);

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
