import {ZodIssueCode} from 'zod';
import {CompanyId} from '../../../../domain/company/entities';
import {PersonId} from '../../../../domain/person/entities';
import {TransactionType} from '../../../../domain/transaction/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ExpectedIssue} from '../../../@shared/__tests__/zod.utils';
import {UpdateTransactionInputDto} from '../update-transaction.dto';

describe('A UpdateTransactionInput', () => {
    it.each([
        {
            companyId: CompanyId.generate().toString(),
            counterpartyId: PersonId.generate().toString(),
            responsibleId: UserId.generate().toString(),
        },
        {
            companyId: CompanyId.generate().toString(),
            counterpartyId: PersonId.generate().toString(),
            responsibleId: UserId.generate().toString(),
            description: 'description 1',
            amount: 50.3,
            type: TransactionType.EXPENSE,
        },
        {
            amount: 50.3,
            type: TransactionType.EXPENSE,
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdateTransactionInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });

    it.each<[Record<string, unknown>, ExpectedIssue]>([
        [
            {
                amount: -1,
            },
            {
                code: ZodIssueCode.too_small,
                path: ['amount'],
            },
        ],
        [
            {
                description: 1,
            },
            {
                code: ZodIssueCode.invalid_type,
                path: ['description'],
            },
        ],
        [
            {
                counterpartyId: '1',
            },
            {
                code: ZodIssueCode.custom,
                path: ['counterpartyId'],
            },
        ],
        [
            {
                responsibleId: '1',
            },
            {
                code: ZodIssueCode.custom,
                path: ['responsibleId'],
            },
        ],
        [
            {
                type: 'entrada',
            },
            {
                code: ZodIssueCode.invalid_enum_value,
                path: ['type'],
            },
        ],
        [
            {
                companyId: 'aaa',
            },
            {
                code: ZodIssueCode.custom,
                path: ['companyId'],
            },
        ],
    ])('should reject invalid payloads', (payload, expected) => {
        const result = UpdateTransactionInputDto.schema.safeParse(payload);

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
