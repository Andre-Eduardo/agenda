import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {TransactionType} from '../../../../domain/transaction/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {CreateTransactionDto} from '../create-transaction.dto';

describe('A CreateTransactionDto', () => {
    it.each([
        {
            counterpartyId: PersonId.generate().toString(),
            companyId: CompanyId.generate().toString(),
            responsibleId: UserId.generate().toString(),
            amount: 100.0,
            paymentMethodId: PaymentMethodId.generate().toString(),
            description: 'transaction card',
            type: TransactionType.EXPENSE,
        },

        {
            companyId: CompanyId.generate().toString(),
            responsibleId: UserId.generate().toString(),
            amount: 50,
            paymentMethodId: PaymentMethodId.generate().toString(),
            description: 'card',
            type: TransactionType.INCOME,
        },

        {
            counterpartyId: null,
            companyId: CompanyId.generate().toString(),
            responsibleId: UserId.generate().toString(),
            amount: 50,
            paymentMethodId: PaymentMethodId.generate().toString(),
            type: TransactionType.INCOME,
        },
    ])('should accept valid payloads', (payload) => {
        expect(CreateTransactionDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                counterpartyId: 1,
                companyId: CompanyId.generate().toString(),
                responsibleId: UserId.generate().toString(),
                amount: 100.0,
                paymentMethodId: PaymentMethodId.generate().toString(),
                type: TransactionType.EXPENSE,
            },
            {code: ZodIssueCode.invalid_type, path: ['counterpartyId']},
        ],
        [
            {
                companyId: 1,
                responsibleId: UserId.generate().toString(),
                amount: 100.0,
                paymentMethodId: PaymentMethodId.generate().toString(),
                type: TransactionType.EXPENSE,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['companyId'],
            },
        ],
        [
            {
                counterpartyId: PersonId.generate().toString(),
                responsibleId: 1,
                companyId: CompanyId.generate().toString(),
                amount: 100.0,
                paymentMethodId: PaymentMethodId.generate().toString(),
                type: TransactionType.EXPENSE,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['responsibleId'],
            },
        ],
        [
            {
                responsibleId: UserId.generate().toString(),
                companyId: CompanyId.generate().toString(),
                amount: 100.0,
                paymentMethodId: 1,
                type: TransactionType.EXPENSE,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['paymentMethodId'],
            },
        ],
        [
            {
                responsibleId: UserId.generate().toString(),
                companyId: CompanyId.generate().toString(),
                amount: -1,
                paymentMethodId: PaymentMethodId.generate().toString(),
                type: TransactionType.EXPENSE,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['amount'],
            },
        ],
        [
            {
                counterpartyId: PersonId.generate().toString(),
                responsibleId: UserId.generate().toString(),
                companyId: CompanyId.generate().toString(),
                amount: 10,
                paymentMethodId: PaymentMethodId.generate().toString(),
                type: 'entrada',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['type'],
            },
        ],
        [
            {
                counterpartyId: PersonId.generate().toString(),
                responsibleId: UserId.generate().toString(),
                companyId: CompanyId.generate().toString(),
                amount: 10,
                paymentMethodId: PaymentMethodId.generate().toString(),
                description: 123,
                type: TransactionType.EXPENSE,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['description'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = CreateTransactionDto.schema.safeParse(payload);

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
