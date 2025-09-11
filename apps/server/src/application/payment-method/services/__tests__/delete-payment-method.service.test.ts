import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {fakePaymentMethod} from '../../../../domain/payment-method/entities/__tests__/fake-payment-method';
import {PaymentMethodDeletedEvent} from '../../../../domain/payment-method/events';
import type {PaymentMethodRepository} from '../../../../domain/payment-method/payment-method.repository';
import {UserId} from '../../../../domain/user/entities';
import type {DeletePaymentMethodDto} from '../../dtos';
import {DeletePaymentMethodService} from '../delete-payment-method.service';

describe('A delete-payment-method service', () => {
    const paymentMethodRepository = mock<PaymentMethodRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deletePaymentMethodService = new DeletePaymentMethodService(paymentMethodRepository, eventDispatcher);

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

    it('should delete a payment method', async () => {
        const existingPaymentMethod = fakePaymentMethod();

        const payload: DeletePaymentMethodDto = {
            id: existingPaymentMethod.id,
        };

        jest.spyOn(paymentMethodRepository, 'findById').mockResolvedValueOnce(existingPaymentMethod);

        await deletePaymentMethodService.execute({actor, payload});

        expect(existingPaymentMethod.events).toHaveLength(1);
        expect(existingPaymentMethod.events[0]).toBeInstanceOf(PaymentMethodDeletedEvent);
        expect(existingPaymentMethod.events).toEqual([
            {
                type: PaymentMethodDeletedEvent.type,
                timestamp: now,
                companyId: existingPaymentMethod.companyId,
                paymentMethod: existingPaymentMethod,
            },
        ]);

        expect(paymentMethodRepository.delete).toHaveBeenCalledWith(existingPaymentMethod.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingPaymentMethod);
    });

    it('should throw an error when the payment method does not exist', async () => {
        const payload: DeletePaymentMethodDto = {
            id: PaymentMethodId.generate(),
        };

        jest.spyOn(paymentMethodRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deletePaymentMethodService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Payment method not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
