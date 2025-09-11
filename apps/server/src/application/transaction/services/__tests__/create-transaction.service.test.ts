import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {Transaction, TransactionType} from '../../../../domain/transaction/entities';
import {TransactionCreatedEvent} from '../../../../domain/transaction/events';
import type {TransactionRepository} from '../../../../domain/transaction/transaction.repository';
import {UserId} from '../../../../domain/user/entities';
import {type CreateTransactionDto, TransactionDto} from '../../dtos';
import {CreateTransactionService} from '../index';

describe('A create-transaction service', () => {
    const transactionRepository = mock<TransactionRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createTransactionService = new CreateTransactionService(transactionRepository, eventDispatcher);

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should create a transaction', async () => {
        const payload: CreateTransactionDto = {
            counterpartyId: PersonId.generate(),
            companyId: CompanyId.generate(),
            responsibleId: UserId.generate(),
            amount: 100.0,
            paymentMethodId: PaymentMethodId.generate(),
            description: 'transaction card',
            type: TransactionType.EXPENSE,
        };

        const transaction = Transaction.create(payload);

        jest.spyOn(Transaction, 'create').mockReturnValue(transaction);

        await expect(createTransactionService.execute({actor, payload})).resolves.toEqual(
            new TransactionDto(transaction)
        );

        expect(Transaction.create).toHaveBeenCalledWith(payload);

        expect(transaction.events).toHaveLength(1);
        expect(transaction.events[0]).toBeInstanceOf(TransactionCreatedEvent);
        expect(transaction.events).toEqual([
            {
                type: TransactionCreatedEvent.type,
                companyId: transaction.companyId,
                timestamp: now,
                transaction,
            },
        ]);

        expect(transactionRepository.save).toHaveBeenCalledWith(transaction);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, transaction);
    });
});
