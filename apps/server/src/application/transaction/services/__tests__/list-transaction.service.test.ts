import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {Transaction} from '../../../../domain/transaction/entities';
import {TransactionType} from '../../../../domain/transaction/entities';
import {fakeTransaction} from '../../../../domain/transaction/entities/__tests__/fake-transaction';
import type {TransactionRepository} from '../../../../domain/transaction/transaction.repository';
import {UserId} from '../../../../domain/user/entities';
import type {ListTransactionDto} from '../../dtos';
import {TransactionDto} from '../../dtos';
import {ListTransactionService} from '../list-transaction.service';

describe('A list-transaction service', () => {
    const transactionRepository = mock<TransactionRepository>();
    const listTransactionService = new ListTransactionService(transactionRepository);
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };
    const companyId = CompanyId.generate();
    const existingTransaction = [
        fakeTransaction({
            companyId,
            amount: 100.0,
            type: TransactionType.EXPENSE,
            description: 'transaction card',
        }),
        fakeTransaction({
            companyId,
            amount: 20,
            description: 'pix',
            type: TransactionType.INCOME,
        }),
    ];

    it('should list transactions', async () => {
        const paginatedTransactions: PaginatedList<Transaction> = {
            data: existingTransaction,
            totalCount: existingTransaction.length,
            nextCursor: null,
        };

        const payload: ListTransactionDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {amount: 'asc'},
            },
            description: 'pix',
        };

        jest.spyOn(transactionRepository, 'search').mockResolvedValueOnce(paginatedTransactions);

        await expect(listTransactionService.execute({actor, payload})).resolves.toEqual({
            data: existingTransaction.map((transaction) => new TransactionDto(transaction)),
            totalCount: existingTransaction.length,
            nextCursor: null,
        });
        expect(existingTransaction.flatMap((transaction) => transaction.events)).toHaveLength(0);

        expect(transactionRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {amount: 'asc'},
            },
            {
                description: 'pix',
            }
        );
    });

    it('should paginate transactions', async () => {
        const paginatedTransactions: PaginatedList<Transaction> = {
            data: existingTransaction,
            totalCount: existingTransaction.length,
            nextCursor: null,
        };
        const payload: ListTransactionDto = {
            companyId,
            description: 'pix',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(transactionRepository, 'search').mockResolvedValueOnce(paginatedTransactions);

        await expect(listTransactionService.execute({actor, payload})).resolves.toEqual({
            data: existingTransaction.map((transaction) => new TransactionDto(transaction)),
            totalCount: existingTransaction.length,
            nextCursor: null,
        });

        expect(existingTransaction.flatMap((transaction) => transaction.events)).toHaveLength(0);

        expect(transactionRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                description: 'pix',
            }
        );
    });
});
