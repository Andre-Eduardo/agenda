import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {TransactionId} from '../../../../domain/transaction/entities';
import {fakeTransaction} from '../../../../domain/transaction/entities/__tests__/fake-transaction';
import type {TransactionRepository} from '../../../../domain/transaction/transaction.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetTransactionDto} from '../../dtos';
import {TransactionDto} from '../../dtos';
import {GetTransactionService} from '../get-transaction.service';

describe('A get-transaction service', () => {
    const transactionRepository = mock<TransactionRepository>();
    const getTransactionService = new GetTransactionService(transactionRepository);
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a transaction', async () => {
        const existingTransaction = fakeTransaction();

        const payload: GetTransactionDto = {
            id: existingTransaction.id,
        };

        jest.spyOn(transactionRepository, 'findById').mockResolvedValueOnce(existingTransaction);

        await expect(getTransactionService.execute({actor, payload})).resolves.toEqual(
            new TransactionDto(existingTransaction)
        );

        expect(existingTransaction.events).toHaveLength(0);

        expect(transactionRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the transaction does not exist', async () => {
        const payload: GetTransactionDto = {
            id: TransactionId.generate(),
        };

        jest.spyOn(transactionRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getTransactionService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Transaction not found'
        );
    });
});
