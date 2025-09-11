import {CompanyId} from '../../../company/entities';
import {PaymentMethodChangedEvent, PaymentMethodCreatedEvent, PaymentMethodDeletedEvent} from '../../events';
import type {CreatePaymentMethod} from '../payment-method.entity';
import {PaymentMethod, PaymentMethodId, PaymentMethodType} from '../payment-method.entity';
import {fakePaymentMethod} from './fake-payment-method';

describe('A payment method', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a payment-method-created event', () => {
            const data: CreatePaymentMethod = {
                name: 'Cash',
                type: PaymentMethodType.CASH,
                companyId: CompanyId.generate(),
            };

            const paymentMethod = PaymentMethod.create(data);

            expect(paymentMethod.name).toBe(data.name);
            expect(paymentMethod.type).toBe(data.type);
            expect(paymentMethod.companyId).toBe(data.companyId);

            expect(paymentMethod.events).toEqual([
                {
                    type: PaymentMethodCreatedEvent.type,
                    companyId: data.companyId,
                    paymentMethod,
                    timestamp: now,
                },
            ]);
            expect(paymentMethod.events[0]).toBeInstanceOf(PaymentMethodCreatedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            expect(() =>
                PaymentMethod.create({name: '', type: PaymentMethodType.CASH, companyId: CompanyId.generate()})
            ).toThrow('Payment method name must be at least 1 character long.');
        });
    });

    describe('on change', () => {
        it('should emit a payment-method-changed event', () => {
            const paymentMethod = fakePaymentMethod();

            const oldPaymentMethod = fakePaymentMethod(paymentMethod);

            paymentMethod.change({
                name: 'Pix',
                type: PaymentMethodType.PIX,
            });

            expect(paymentMethod.events).toEqual([
                {
                    type: PaymentMethodChangedEvent.type,
                    timestamp: now,
                    companyId: paymentMethod.companyId,
                    oldState: oldPaymentMethod,
                    newState: paymentMethod,
                },
            ]);
            expect(paymentMethod.events[0]).toBeInstanceOf(PaymentMethodChangedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const paymentMethod = fakePaymentMethod();

            expect(() => paymentMethod.change({name: ''})).toThrow(
                'Payment method name must be at least 1 character long.'
            );
        });
    });

    describe('on deletion', () => {
        it('should emit a payment-method-deleted event', () => {
            const paymentMethod = new PaymentMethod({
                id: PaymentMethodId.generate(),
                name: 'Cash',
                type: PaymentMethodType.CASH,
                companyId: CompanyId.generate(),
                createdAt: new Date(1000),
                updatedAt: new Date(1000),
            });

            paymentMethod.delete();

            expect(paymentMethod.events).toEqual([
                {
                    type: PaymentMethodDeletedEvent.type,
                    timestamp: now,
                    companyId: paymentMethod.companyId,
                    paymentMethod,
                },
            ]);

            expect(paymentMethod.events[0]).toBeInstanceOf(PaymentMethodDeletedEvent);
        });
    });

    it('should be serializable', () => {
        const paymentMethod = fakePaymentMethod({
            name: 'Cash',
            type: PaymentMethodType.CASH,
        });

        expect(paymentMethod.toJSON()).toEqual({
            id: paymentMethod.id.toJSON(),
            name: 'Cash',
            type: PaymentMethodType.CASH,
            companyId: paymentMethod.companyId.toJSON(),
            createdAt: paymentMethod.createdAt.toJSON(),
            updatedAt: paymentMethod.updatedAt.toJSON(),
        });
    });

    describe('A payment method ID', () => {
        it('can be created from a string', () => {
            const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
            const id = PaymentMethodId.from(uuid);

            expect(id.toString()).toBe(uuid);
        });

        it('can be generated', () => {
            expect(PaymentMethodId.generate()).toBeInstanceOf(PaymentMethodId);
        });
    });
});
