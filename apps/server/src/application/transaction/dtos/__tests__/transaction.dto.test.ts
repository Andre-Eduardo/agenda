import {CompanyId} from '../../../../domain/company/entities';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {ReservationId} from '../../../../domain/reservation/entities';
import type {CreateTransaction} from '../../../../domain/transaction/entities';
import {Transaction, TransactionOriginType, TransactionType} from '../../../../domain/transaction/entities';
import {UserId} from '../../../../domain/user/entities';
import {TransactionDto} from '../transaction.dto';

describe('A TransactionDto', () => {
    it('should be creatable from a transaction entity', () => {
        const transactionPayload = {
            companyId: CompanyId.generate(),
            description: 'The transaction.',
            counterpartyId: PersonId.generate(),
            responsibleId: UserId.generate(),
            amount: 100.0,
            paymentMethodId: PaymentMethodId.generate(),
            type: TransactionType.EXPENSE,
            originId: ReservationId.generate(),
            originType: TransactionOriginType.RESERVATION,
        } satisfies CreateTransaction;

        const transaction = Transaction.create(transactionPayload);
        const transactionDto = new TransactionDto(transaction);

        expect(transactionDto.amount).toEqual(transactionPayload.amount);
        expect(transactionDto.paymentMethodId).toEqual(transactionPayload.paymentMethodId.toString());
        expect(transactionDto.description).toEqual(transactionPayload.description);
        expect(transactionDto.counterpartyId).toEqual(transactionPayload.counterpartyId.toString());
        expect(transactionDto.responsibleId).toEqual(transactionPayload.responsibleId.toString());
        expect(transactionDto.companyId).toEqual(transactionPayload.companyId.toString());
        expect(transactionDto.type).toEqual(transactionPayload.type);
        expect(transactionDto.originId).toEqual(transactionPayload.originId.toString());
        expect(transactionDto.originType).toEqual(transactionPayload.originType);
    });

    it('should normalize null values', () => {
        const transactionPayload: CreateTransaction = {
            companyId: CompanyId.generate(),
            description: null,
            counterpartyId: null,
            responsibleId: UserId.generate(),
            amount: 100.0,
            paymentMethodId: PaymentMethodId.generate(),
            type: TransactionType.EXPENSE,
            originId: ReservationId.generate(),
            originType: TransactionOriginType.RESERVATION,
        };

        const transaction = Transaction.create(transactionPayload);
        const transactionDto = new TransactionDto(transaction);

        expect(transactionDto.description).toEqual(null);
    });
});
