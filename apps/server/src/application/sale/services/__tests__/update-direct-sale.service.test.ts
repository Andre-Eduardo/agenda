import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {ProductId} from '../../../../domain/product/entities';
import type {DirectSaleRepository} from '../../../../domain/sale/direct-sale.repository';
import {DirectSale, SaleId} from '../../../../domain/sale/entities';
import {fakeDirectSale} from '../../../../domain/sale/entities/__tests__/fake-direct-sale';
import {fakeSaleItem} from '../../../../domain/sale/entities/__tests__/fake-sale-item';
import {DirectSaleChangedEvent} from '../../../../domain/sale/events';
import {
    Transaction,
    TransactionId,
    TransactionOriginType,
    TransactionType,
} from '../../../../domain/transaction/entities';
import {fakeTransaction} from '../../../../domain/transaction/entities/__tests__/fake-transaction';
import {TransactionChangedEvent, TransactionCreatedEvent} from '../../../../domain/transaction/events';
import type {TransactionRepository} from '../../../../domain/transaction/transaction.repository';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateDirectSaleDto} from '../../dtos';
import {DirectSaleDto} from '../../dtos';
import {UpdateDirectSaleService} from '../update-direct-sale.service';

describe('A update-direct-sale service', () => {
    const directSaleRepository = mock<DirectSaleRepository>();
    const transactionRepository = mock<TransactionRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateDirectSaleService = new UpdateDirectSaleService(
        directSaleRepository,
        transactionRepository,
        eventDispatcher
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should update a direct sale', async () => {
        const saleId = SaleId.generate();

        const existingDirectSale = fakeDirectSale({
            id: saleId,
            note: 'note',
            items: [
                fakeSaleItem({
                    saleId,
                    quantity: 1,
                    price: 100,
                    note: null,
                }),
            ],
        });

        const oldDirectSale = new DirectSale(existingDirectSale);

        const existingTransaction = fakeTransaction({
            originId: existingDirectSale.id,
            originType: TransactionOriginType.DIRECT_SALE,
            amount: existingDirectSale.getTotalValue(),
        });

        jest.spyOn(transactionRepository, 'search').mockResolvedValueOnce({
            data: [existingTransaction],
            totalCount: 1,
            nextCursor: null,
        });

        const payload = {
            id: existingDirectSale.id,
            note: 'New Note',
            items: [
                {
                    id: existingDirectSale.items[0].id,
                    quantity: 1,
                    note: 'Product Note',
                },
                {
                    productId: ProductId.generate(),
                    quantity: 2,
                    price: 0,
                    note: null,
                },
            ],
        } satisfies UpdateDirectSaleDto;

        const updatedDirectSale = new DirectSale({
            ...existingDirectSale,
            ...payload,
            items: [
                fakeSaleItem({
                    ...existingDirectSale.items[0],
                    ...payload.items[0],
                    saleId: existingDirectSale.id,
                    updatedAt: now,
                }),
                fakeSaleItem({
                    ...payload.items[1],
                    saleId: existingDirectSale.id,
                    createdAt: now,
                    updatedAt: now,
                }),
            ],
            updatedAt: now,
        });

        jest.spyOn(directSaleRepository, 'findById').mockResolvedValueOnce(existingDirectSale);

        const response = new DirectSaleDto(updatedDirectSale);

        await expect(updateDirectSaleService.execute({actor, payload})).resolves.toEqual({
            ...response,
            items: [
                {
                    ...response.items[0],
                },
                {
                    ...response.items[1],
                    id: expect.anything(),
                },
            ],
        });

        expect(existingDirectSale.events).toHaveLength(1);
        expect(existingDirectSale.events[0]).toBeInstanceOf(DirectSaleChangedEvent);
        expect(existingDirectSale.events[0]).toEqual({
            type: DirectSaleChangedEvent.type,
            companyId: existingDirectSale.companyId,
            timestamp: now,
            oldState: oldDirectSale,
            newState: existingDirectSale,
        });

        expect(directSaleRepository.save).toHaveBeenCalledWith(existingDirectSale);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingDirectSale);
        expect(transactionRepository.save).not.toHaveBeenCalled();
    });

    it('should update transactions of a direct sale', async () => {
        const existingDirectSale = fakeDirectSale();

        jest.spyOn(directSaleRepository, 'findById').mockResolvedValueOnce(existingDirectSale);

        const existingTransaction = fakeTransaction({
            originId: existingDirectSale.id,
            amount: existingDirectSale.getTotalValue(),
        });

        jest.spyOn(transactionRepository, 'search').mockResolvedValueOnce({
            data: [existingTransaction],
            totalCount: 1,
            nextCursor: null,
        });

        const paymentMethodId = PaymentMethodId.generate();

        const payload = {
            id: existingDirectSale.id,
            transactions: [
                {
                    id: existingTransaction.id,
                    description: 'new description',
                    amount: existingDirectSale.getTotalValue() - 10.5,
                },
                {
                    amount: 10.5,
                    paymentMethodId,
                },
            ],
        } satisfies UpdateDirectSaleDto;

        const newTransaction = Transaction.create({
            companyId: existingDirectSale.companyId,
            responsibleId: actor.userId,
            counterpartyId: existingDirectSale.buyerId,
            amount: payload.transactions[1].amount,
            paymentMethodId,
            type: TransactionType.INCOME,
            originId: existingDirectSale.id,
            originType: TransactionOriginType.DIRECT_SALE,
        });

        jest.spyOn(Transaction, 'create').mockReturnValue(newTransaction);

        await expect(updateDirectSaleService.execute({actor, payload})).toResolve();

        expect(transactionRepository.save).toHaveBeenNthCalledWith(1, {
            ...existingTransaction,
            ...payload.transactions[0],
            updatedAt: now,
        });
        expect(existingTransaction.amount).toBe(payload.transactions[0].amount);
        expect(existingTransaction.description).toBe(payload.transactions[0].description);
        expect(existingTransaction.type).toBe(existingTransaction.type);
        expect(existingTransaction.updatedAt).toEqual(now);
        expect(existingTransaction.events).toHaveLength(1);
        expect(existingTransaction.events[0]).toBeInstanceOf(TransactionChangedEvent);

        expect(transactionRepository.save).toHaveBeenNthCalledWith(2, newTransaction);
        expect(newTransaction.events).toHaveLength(1);
        expect(newTransaction.events[0]).toBeInstanceOf(TransactionCreatedEvent);

        expect(transactionRepository.save).toHaveBeenCalledTimes(2);
        expect(directSaleRepository.save).toHaveBeenCalledWith(existingDirectSale);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingDirectSale);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, newTransaction);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingTransaction);
    });

    describe('should throw an error if the total amount does not match the amount paid', () => {
        it('when updating items', async () => {
            const saleId = SaleId.generate();

            const existingDirectSale = fakeDirectSale({
                id: saleId,
                items: [
                    fakeSaleItem({
                        saleId,
                        quantity: 1,
                        price: 100,
                    }),
                ],
            });

            jest.spyOn(directSaleRepository, 'findById').mockResolvedValueOnce(existingDirectSale);

            const existingTransaction = fakeTransaction({
                originId: existingDirectSale.id,
                amount: existingDirectSale.getTotalValue(),
            });

            jest.spyOn(transactionRepository, 'search').mockResolvedValueOnce({
                data: [existingTransaction],
                totalCount: 1,
                nextCursor: null,
            });

            const payload: UpdateDirectSaleDto = {
                id: existingDirectSale.id,
                items: [
                    {
                        id: existingDirectSale.items[0].id,
                        quantity: 2,
                    },
                ],
            };

            await expect(updateDirectSaleService.execute({actor, payload})).rejects.toThrowWithMessage(
                PreconditionException,
                'The total amount does not match the amount paid.'
            );
            expect(directSaleRepository.save).not.toHaveBeenCalled();
            expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        });

        it('when updating transactions', async () => {
            const existingDirectSale = fakeDirectSale();

            jest.spyOn(directSaleRepository, 'findById').mockResolvedValueOnce(existingDirectSale);

            const payload: UpdateDirectSaleDto = {
                id: existingDirectSale.id,
                transactions: [
                    {
                        id: TransactionId.generate(),
                        amount: existingDirectSale.getTotalValue() + 15,
                    },
                ],
            };

            await expect(updateDirectSaleService.execute({actor, payload})).rejects.toThrowWithMessage(
                PreconditionException,
                'The total amount does not match the amount paid.'
            );
            expect(directSaleRepository.save).not.toHaveBeenCalled();
            expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        });
    });

    it('should throw an error when the transaction does not exist', async () => {
        const existingDirectSale = fakeDirectSale();

        jest.spyOn(directSaleRepository, 'findById').mockResolvedValueOnce(existingDirectSale);

        const existingTransaction = fakeTransaction({
            amount: existingDirectSale.getTotalValue(),
        });

        jest.spyOn(transactionRepository, 'search').mockResolvedValueOnce({
            data: [existingTransaction],
            totalCount: 1,
            nextCursor: null,
        });

        const payload: UpdateDirectSaleDto = {
            id: existingDirectSale.id,
            transactions: [
                {
                    id: TransactionId.generate(),
                },
            ],
        };

        await expect(updateDirectSaleService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Transaction not found'
        );
    });

    it('should throw an error when the direct sale does not exist', async () => {
        const payload: UpdateDirectSaleDto = {
            id: SaleId.generate(),
            note: 'New Note',
        };

        jest.spyOn(directSaleRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateDirectSaleService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Direct sale not found'
        );
    });
});
