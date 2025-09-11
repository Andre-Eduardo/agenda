import {CompanyId} from '../../../company/entities';
import {PaymentMethodId} from '../../../payment-method/entities';
import {PersonId} from '../../../person/entities';
import {ReservationId} from '../../../reservation/entities';
import {SaleId} from '../../../sale/entities';
import {UserId} from '../../../user/entities';
import {TransactionChangedEvent, TransactionCreatedEvent} from '../../events';
import {Transaction, TransactionId, TransactionOriginType, TransactionType} from '../transaction.entity';
import {fakeTransaction} from './fake-transaction';

describe('A transaction', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a transaction-created event', () => {
            const counterpartyId = PersonId.generate();
            const responsibleId = UserId.generate();
            const paymentMethodId = PaymentMethodId.generate();
            const originId = SaleId.generate();

            const transaction = Transaction.create({
                amount: 100.5,
                paymentMethodId,
                counterpartyId,
                companyId: CompanyId.generate(),
                responsibleId,
                type: TransactionType.EXPENSE,
                description: 'test',
                originId,
                originType: TransactionOriginType.DIRECT_SALE,
            });

            expect(transaction.amount).toBe(100.5);
            expect(transaction.paymentMethodId).toBe(paymentMethodId);
            expect(transaction.type).toBe(TransactionType.EXPENSE);
            expect(transaction.description).toBe('test');
            expect(transaction.counterpartyId).toBe(counterpartyId);
            expect(transaction.responsibleId).toBe(responsibleId);
            expect(transaction.originId).toBe(originId);
            expect(transaction.originType).toBe(TransactionOriginType.DIRECT_SALE);

            expect(transaction.events).toEqual([
                {
                    type: TransactionCreatedEvent.type,
                    companyId: transaction.companyId,
                    timestamp: now,
                    transaction,
                },
            ]);
            expect(transaction.events[0]).toBeInstanceOf(TransactionCreatedEvent);
        });

        it.each([
            [{amount: -10}, 'The transaction amount must be positive.'],
            [
                {originId: null, originType: TransactionOriginType.RESERVATION},
                'Both origin ID and origin type must be provided together.',
            ],
            [
                {originId: ReservationId.generate(), originType: null},
                'Both origin ID and origin type must be provided together.',
            ],
        ])('should throw an error when receiving invalid data', (input, expectedError) => {
            expect(() => Transaction.create(fakeTransaction(input))).toThrow(expectedError);
        });
    });

    describe('on change', () => {
        it('should emit a transaction-changed event', () => {
            const transaction = fakeTransaction();

            const oldTransaction = fakeTransaction(transaction);

            transaction.change({
                amount: 200,
                type: TransactionType.EXPENSE,
                description: 'new description',
            });

            expect(transaction.amount).toBe(200);
            expect(transaction.type).toBe(TransactionType.EXPENSE);
            expect(transaction.description).toBe('new description');

            expect(transaction.events).toEqual([
                {
                    type: TransactionChangedEvent.type,
                    timestamp: now,
                    companyId: transaction.companyId,
                    oldState: oldTransaction,
                    newState: transaction,
                },
            ]);

            expect(transaction.events[0]).toBeInstanceOf(TransactionChangedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const transaction = fakeTransaction();
            const data = {
                amount: -10,
            };

            expect(() => transaction.change(data)).toThrow('The transaction amount must be positive.');
        });
    });

    it.each([
        {description: null, counterpartyId: null},
        {description: 'Description', counterpartyId: PersonId.generate()},
        {originId: null, originType: null},
        {originId: ReservationId.generate(), originType: TransactionOriginType.RESERVATION},
    ])('should be serializable', (values) => {
        const transaction = fakeTransaction({
            amount: 100.5,
            type: TransactionType.INCOME,
            ...values,
        });

        expect(transaction.toJSON()).toEqual({
            id: transaction.id.toJSON(),
            companyId: transaction.companyId.toJSON(),
            counterpartyId: transaction.counterpartyId?.toJSON() ?? null,
            responsibleId: transaction.responsibleId.toJSON(),
            amount: transaction.amount,
            paymentMethodId: transaction.paymentMethodId.toJSON(),
            description: transaction.description,
            type: transaction.type,
            originId: transaction.originId?.toJSON() ?? null,
            originType: transaction.originType,
            createdAt: transaction.createdAt.toJSON(),
            updatedAt: transaction.updatedAt.toJSON(),
        });
    });
});

describe('A transaction ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = TransactionId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(TransactionId.generate()).toBeInstanceOf(TransactionId);
    });
});
