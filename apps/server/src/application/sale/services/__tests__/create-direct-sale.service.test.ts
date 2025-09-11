import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {ProductId} from '../../../../domain/product/entities';
import type {DirectSaleRepository} from '../../../../domain/sale/direct-sale.repository';
import {DirectSale} from '../../../../domain/sale/entities';
import {DirectSaleCreatedEvent} from '../../../../domain/sale/events';
import {Transaction, TransactionOriginType, TransactionType} from '../../../../domain/transaction/entities';
import {TransactionCreatedEvent} from '../../../../domain/transaction/events';
import type {TransactionRepository} from '../../../../domain/transaction/transaction.repository';
import {UserId} from '../../../../domain/user/entities';
import type {CreateDirectSaleDto} from '../../dtos';
import {DirectSaleDto} from '../../dtos';
import {CreateDirectSaleService} from '../create-direct-sale.service';

describe('A create-direct-sale service', () => {
    const directSaleRepository = mock<DirectSaleRepository>();
    const transactionRepository = mock<TransactionRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createDirectSaleService = new CreateDirectSaleService(
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

    it('should create a direct sale', async () => {
        const payload: CreateDirectSaleDto = {
            companyId: CompanyId.generate(),
            buyerId: null,
            items: [
                {
                    productId: ProductId.generate(),
                    price: 10.2,
                    quantity: 1,
                },
            ],
            transactions: [
                {
                    amount: 10.2,
                    paymentMethodId: PaymentMethodId.generate(),
                },
            ],
        };

        const directSale = DirectSale.create({...payload, sellerId: actor.userId});

        jest.spyOn(DirectSale, 'create').mockReturnValue(directSale);

        const transaction = Transaction.create({
            companyId: directSale.companyId,
            responsibleId: actor.userId,
            counterpartyId: directSale.buyerId,
            amount: payload.transactions[0].amount,
            paymentMethodId: payload.transactions[0].paymentMethodId,
            type: TransactionType.INCOME,
            originId: directSale.id,
            originType: TransactionOriginType.DIRECT_SALE,
        });

        jest.spyOn(Transaction, 'create').mockReturnValue(transaction);

        await expect(createDirectSaleService.execute({actor, payload})).resolves.toEqual(new DirectSaleDto(directSale));

        expect(DirectSale.create).toHaveBeenCalledWith({...payload, sellerId: actor.userId});

        expect(directSale.events[0]).toBeInstanceOf(DirectSaleCreatedEvent);
        expect(directSale.events).toEqual([
            {
                type: DirectSaleCreatedEvent.type,
                timestamp: now,
                companyId: directSale.companyId,
                directSale,
            },
        ]);
        expect(directSaleRepository.save).toHaveBeenCalledWith(directSale);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, directSale);

        expect(transaction.events[0]).toBeInstanceOf(TransactionCreatedEvent);
        expect(transaction.events).toEqual([
            {
                type: TransactionCreatedEvent.type,
                timestamp: now,
                companyId: directSale.companyId,
                transaction,
            },
        ]);
        expect(transactionRepository.save).toHaveBeenCalledWith(transaction);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, transaction);
    });

    it('should throw an error if the total amount does not match the amount paid', async () => {
        const payload: CreateDirectSaleDto = {
            companyId: CompanyId.generate(),
            buyerId: null,
            items: [
                {
                    productId: ProductId.generate(),
                    price: 10.2,
                    quantity: 1,
                },
            ],
            transactions: [
                {
                    amount: 15,
                    paymentMethodId: PaymentMethodId.generate(),
                },
            ],
        };

        const directSale = DirectSale.create({...payload, sellerId: actor.userId});

        jest.spyOn(DirectSale, 'create').mockReturnValue(directSale);

        await expect(createDirectSaleService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'The total amount does not match the amount paid.'
        );
        expect(directSaleRepository.save).not.toHaveBeenCalled();
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the direct sale', async () => {
        const payload: CreateDirectSaleDto = {
            companyId: CompanyId.generate(),
            buyerId: PersonId.generate(),
            items: [
                {
                    productId: ProductId.generate(),
                    price: 12.3,
                    quantity: 2,
                },
            ],
            transactions: [
                {
                    amount: 24.6,
                    paymentMethodId: PaymentMethodId.generate(),
                },
            ],
        };

        jest.spyOn(directSaleRepository, 'save').mockRejectedValue(new Error('generic error'));

        await expect(createDirectSaleService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'generic error'
        );
    });
});
