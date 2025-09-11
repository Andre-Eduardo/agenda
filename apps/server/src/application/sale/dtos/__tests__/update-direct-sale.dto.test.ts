import {ZodIssueCode} from 'zod';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {SaleId, SaleItemId} from '../../../../domain/sale/entities';
import {TransactionId} from '../../../../domain/transaction/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateDirectSaleInputDto} from '../index';

describe('A UpdateDirectSaleInputDto', () => {
    it.each([
        {
            note: 'New Note',
        },
        {
            buyerId: PersonId.generate().toString(),
            sellerId: UserId.generate().toString(),
        },
        {
            items: [
                {
                    productId: SaleId.generate().toString(),
                    quantity: 1,
                    price: 100,
                    note: 'note',
                },
            ],
            transactions: [{amount: 10, paymentMethodId: PaymentMethodId.generate().toString()}],
        },
        {
            items: [
                {
                    id: SaleItemId.generate().toString(),
                    quantity: 1,
                },
            ],
            transactions: [
                {
                    id: TransactionId.generate().toString(),
                    amount: 10,
                    paymentMethodId: PaymentMethodId.generate().toString(),
                },
            ],
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateDirectSaleInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                note: '',
            },
            {
                code: ZodIssueCode.too_small,
                path: ['note'],
            },
        ],
        [
            {
                buyerId: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['buyerId'],
            },
        ],
        [
            {
                items: [],
            },
            {
                code: ZodIssueCode.too_small,
                path: ['items'],
            },
        ],
        [
            {
                items: [
                    {
                        productId: SaleId.generate().toString(),
                        quantity: 0,
                        price: 100,
                    },
                ],
            },
            {
                code: ZodIssueCode.too_small,
                path: ['items', 0, 'quantity'],
            },
        ],
        [
            {
                items: [
                    {
                        id: SaleItemId.generate().toString(),
                        note: '',
                    },
                ],
            },
            {
                code: ZodIssueCode.too_small,
                path: ['items', 0, 'note'],
            },
        ],
        [
            {
                items: [
                    {
                        productId: SaleId.generate().toString(),
                        quantity: 1,
                    },
                ],
            },
            {
                code: ZodIssueCode.invalid_union,
                path: ['items', 0],
                unionErrors: expect.arrayContaining([
                    expect.objectContaining({
                        issues: [
                            expect.objectContaining({code: ZodIssueCode.invalid_type, path: ['items', 0, 'price']}),
                        ],
                    }),
                ]),
            },
        ],
        [
            {
                transactions: [{amount: -10, paymentMethodId: PaymentMethodId.generate().toString()}],
            },
            {
                code: ZodIssueCode.too_small,
                path: ['transactions', 0, 'amount'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateDirectSaleInputDto.schema.safeParse(payload);

        expect(result.success).toEqual(false);

        if (result.success) return;

        expect(result.error.errors).toEqual([
            expect.objectContaining({
                code: expected.code,
                path: expected.path,
                ...(expected.keys && {keys: expected.keys}),
                ...(expected.unionErrors && {unionErrors: expected.unionErrors}),
            }),
        ]);
    });
});
