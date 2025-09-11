import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {TransactionId, TransactionType} from '../../../../domain/transaction/entities';
import {fakeTransaction} from '../../../../domain/transaction/entities/__tests__/fake-transaction';
import {TransactionChangedEvent} from '../../../../domain/transaction/events';
import type {TransactionRepository} from '../../../../domain/transaction/transaction.repository';
import {UserId} from '../../../../domain/user/entities';
import {TransactionDto, type UpdateTransactionDto} from '../../dtos';
import {UpdateTransactionService} from '../update-transaction.service';

describe('A update-transaction service', () => {
    const transactionRepository = mock<TransactionRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateTransactionService = new UpdateTransactionService(transactionRepository, eventDispatcher);

    const now = new Date();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should update a transaction', async () => {
        const existingTransaction = fakeTransaction();

        const oldTransaction = fakeTransaction(existingTransaction);

        const payload: UpdateTransactionDto = {
            id: existingTransaction.id,
            amount: 100.0,
            description: 'transaction',
            type: TransactionType.EXPENSE,
        };

        jest.spyOn(transactionRepository, 'findById').mockResolvedValueOnce(existingTransaction);

        const updatedTransaction = fakeTransaction({
            ...existingTransaction,
            ...payload,
            updatedAt: now,
        });

        await expect(updateTransactionService.execute({actor, payload})).resolves.toEqual(
            new TransactionDto(updatedTransaction)
        );

        expect(existingTransaction.amount).toBe(payload.amount);
        expect(existingTransaction.description).toBe(payload.description);
        expect(existingTransaction.type).toBe(payload.type);
        expect(existingTransaction.updatedAt).toEqual(now);
        expect(existingTransaction.events).toHaveLength(1);
        expect(existingTransaction.events[0]).toBeInstanceOf(TransactionChangedEvent);
        expect(existingTransaction.events).toEqual([
            {
                type: TransactionChangedEvent.type,
                companyId: existingTransaction.companyId,
                timestamp: now,
                oldState: oldTransaction,
                newState: existingTransaction,
            },
        ]);
        expect(transactionRepository.save).toHaveBeenCalledWith(existingTransaction);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingTransaction);
    });

    it('should throw an error when the transaction does not exist', async () => {
        const payload: UpdateTransactionDto = {
            id: TransactionId.generate(),
            amount: 30,
        };

        jest.spyOn(transactionRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateTransactionService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Transaction not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
