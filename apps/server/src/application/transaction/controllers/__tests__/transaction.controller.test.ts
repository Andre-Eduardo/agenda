import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {ReservationId} from '../../../../domain/reservation/entities';
import {Transaction, TransactionOriginType, TransactionType} from '../../../../domain/transaction/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {TransactionDto} from '../../dtos';
import type {
    CreateTransactionService,
    GetTransactionService,
    ListTransactionService,
    UpdateTransactionService,
} from '../../services';
import {TransactionController} from '../index';

describe('A transaction controller', () => {
    const createTransactionServiceMock = mock<CreateTransactionService>();
    const getTransactionServiceMock = mock<GetTransactionService>();
    const listTransactionServiceMock = mock<ListTransactionService>();
    const updateTransactionServiceMock = mock<UpdateTransactionService>();
    const transactionController = new TransactionController(
        createTransactionServiceMock,
        getTransactionServiceMock,
        listTransactionServiceMock,
        updateTransactionServiceMock
    );
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a transaction', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                counterpartyId: PersonId.generate(),
                companyId: CompanyId.generate(),
                responsibleId: UserId.generate(),
                amount: 20,
                paymentMethodId: PaymentMethodId.generate(),
                description: 'transaction card',
                type: TransactionType.INCOME,
                originId: null,
                originType: null,
            };

            const expectedTransaction = new TransactionDto(Transaction.create(payload));

            jest.spyOn(createTransactionServiceMock, 'execute').mockResolvedValueOnce(expectedTransaction);

            await expect(transactionController.createTransaction(actor, payload)).resolves.toEqual(expectedTransaction);

            expect(createTransactionServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getTransactionServiceMock.execute).not.toHaveBeenCalled();
            expect(listTransactionServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting a transaction', () => {
        it('should repass the responsibility to the right service', async () => {
            const transaction = Transaction.create({
                counterpartyId: PersonId.generate(),
                companyId: CompanyId.generate(),
                responsibleId: UserId.generate(),
                amount: 20,
                paymentMethodId: PaymentMethodId.generate(),
                description: 'transaction card',
                type: TransactionType.INCOME,
                originId: ReservationId.generate(),
                originType: TransactionOriginType.RESERVATION,
            });

            const expectedTransaction = new TransactionDto(transaction);

            jest.spyOn(getTransactionServiceMock, 'execute').mockResolvedValueOnce(expectedTransaction);

            await expect(transactionController.getTransaction(actor, transaction.id)).resolves.toEqual(
                expectedTransaction
            );

            expect(getTransactionServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: transaction.id}});
        });
    });

    describe('when listing transaction', () => {
        it('should repass the responsibility to the right service', async () => {
            const companyId = CompanyId.generate();
            const values = [
                {
                    counterpartyId: PersonId.generate(),
                    companyId,
                    responsibleId: UserId.generate(),
                    amount: 20,
                    paymentMethodId: PaymentMethodId.generate(),
                    description: 'transaction card',
                    type: TransactionType.INCOME,
                    originId: ReservationId.generate(),
                    originType: TransactionOriginType.RESERVATION,
                },
                {
                    counterpartyId: PersonId.generate(),
                    companyId,
                    responsibleId: UserId.generate(),
                    amount: 20,
                    paymentMethodId: PaymentMethodId.generate(),
                    description: 'transaction pix',
                    type: TransactionType.INCOME,
                    originId: ReservationId.generate(),
                    originType: TransactionOriginType.RESERVATION,
                },
            ];
            const payload = {
                companyId,
                description: 'transaction',
                pagination: {
                    limit: 10,
                },
            };
            const transactions = [Transaction.create(values[0]), Transaction.create(values[1])];
            const expectedResult: PaginatedDto<TransactionDto> = {
                data: transactions.map((transaction) => new TransactionDto(transaction)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listTransactionServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(transactionController.listTransaction(actor, payload)).resolves.toEqual(expectedResult);

            expect(listTransactionServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when updating a transaction', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingTransaction = Transaction.create({
                counterpartyId: PersonId.generate(),
                companyId: CompanyId.generate(),
                responsibleId: UserId.generate(),
                amount: 50,
                paymentMethodId: PaymentMethodId.generate(),
                description: 'pix',
                type: TransactionType.INCOME,
                originId: ReservationId.generate(),
                originType: TransactionOriginType.RESERVATION,
            });

            const payload = {
                description: 'card',
            };

            const expectedTransaction = new TransactionDto(existingTransaction);

            jest.spyOn(updateTransactionServiceMock, 'execute').mockResolvedValueOnce(expectedTransaction);

            await expect(
                transactionController.updateTransaction(actor, existingTransaction.id, payload)
            ).resolves.toEqual(expectedTransaction);

            expect(updateTransactionServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingTransaction.id, ...payload},
            });
        });
    });
});
