import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {PaymentMethodId, PaymentMethodType} from '../../../../domain/payment-method/entities';
import {fakePaymentMethod} from '../../../../domain/payment-method/entities/__tests__/fake-payment-method';
import {PaymentMethodChangedEvent} from '../../../../domain/payment-method/events';
import type {PaymentMethodRepository} from '../../../../domain/payment-method/payment-method.repository';
import {UserId} from '../../../../domain/user/entities';
import type {UpdatePaymentMethodDto} from '../../dtos';
import {PaymentMethodDto} from '../../dtos';
import {UpdatePaymentMethodService} from '../index';

describe('A update-payment-method service', () => {
    const paymentMethodRepository = mock<PaymentMethodRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updatePaymentMethodService = new UpdatePaymentMethodService(paymentMethodRepository, eventDispatcher);

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

    it('should update a payment method', async () => {
        const existingPaymentMethod = fakePaymentMethod();

        const oldPaymentMethod = fakePaymentMethod(existingPaymentMethod);

        const payload: UpdatePaymentMethodDto = {
            id: existingPaymentMethod.id,
            name: 'New name',
        };

        jest.spyOn(paymentMethodRepository, 'findById').mockResolvedValueOnce(existingPaymentMethod);

        const updatedPaymentMethod = fakePaymentMethod({
            ...existingPaymentMethod,
            ...payload,
            updatedAt: now,
        });

        await expect(updatePaymentMethodService.execute({actor, payload})).resolves.toEqual(
            new PaymentMethodDto(updatedPaymentMethod)
        );

        expect(existingPaymentMethod.name).toBe(payload.name);
        expect(existingPaymentMethod.updatedAt).toEqual(now);
        expect(existingPaymentMethod.events).toHaveLength(1);
        expect(existingPaymentMethod.events[0]).toBeInstanceOf(PaymentMethodChangedEvent);
        expect(existingPaymentMethod.events).toEqual([
            {
                type: PaymentMethodChangedEvent.type,
                companyId: existingPaymentMethod.companyId,
                timestamp: now,
                oldState: oldPaymentMethod,
                newState: existingPaymentMethod,
            },
        ]);

        expect(paymentMethodRepository.save).toHaveBeenCalledWith(existingPaymentMethod);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingPaymentMethod);
    });

    it('should throw an error when the payment method does not exist', async () => {
        const payload: UpdatePaymentMethodDto = {
            id: PaymentMethodId.generate(),
            name: PaymentMethodType.CASH,
        };

        jest.spyOn(paymentMethodRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updatePaymentMethodService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Payment method not found'
        );
    });
});
