import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {ReservationId} from '../../../../domain/reservation/entities';
import {TransactionId, TransactionOriginType, TransactionType} from '../../../../domain/transaction/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {ListTransactionDto} from '../list-transaction.dto';

describe('A ListTransactionDto', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            counterpartyId: PersonId.generate().toString(),
            responsibleId: UserId.generate().toString(),
            originId: ReservationId.generate().toString(),
            amount: {from: 10, to: 100},
            pagination: {
                cursor: TransactionId.generate().toString(),
                limit: 10,
                sort: {
                    amount: 'asc',
                },
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            type: TransactionType.INCOME,
            originType: TransactionOriginType.RESERVATION,
            paymentMethodId: PaymentMethodId.generate().toString(),
            pagination: {
                limit: 10,
            },
        },
        {
            companyId: CompanyId.generate().toString(),
            description: 'transaction card',
            counterpartyId: null,
            originId: null,
            pagination: {
                limit: 10,
            },
        },
    ])('should accept valid payloads', (payload) => {
        expect(ListTransactionDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                companyId: CompanyId.generate().toString(),
                type: 'Saida',
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['type'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                counterpartyId: 2,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['counterpartyId'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                responsibleId: 1,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['responsibleId'],
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
        [
            {
                companyId: CompanyId.generate().toString(),
                description: 123,
                pagination: {
                    limit: 10,
                },
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['description'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                amount: {from: 100, to: 0},
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.custom,
                path: ['amount'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                originType: 'reservation',
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['originType'],
            },
        ],
        [
            {
                companyId: CompanyId.generate().toString(),
                originId: 123,
                pagination: {limit: 10},
            },
            {
                code: ZodIssueCode.invalid_union,
                path: ['originId'],
                unionErrors: expect.arrayContaining([
                    expect.objectContaining({
                        issues: [expect.objectContaining({code: ZodIssueCode.invalid_type, path: ['originId']})],
                    }),
                ]),
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = ListTransactionDto.schema.safeParse(payload);

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
