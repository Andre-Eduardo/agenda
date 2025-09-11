import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {PaymentMethod, PaymentMethodType} from '../../../../domain/payment-method/entities';
import {PaymentMethodCreatedEvent} from '../../../../domain/payment-method/events';
import type {PaymentMethodRepository} from '../../../../domain/payment-method/payment-method.repository';
import {UserId} from '../../../../domain/user/entities';
import type {CreatePaymentMethodDto} from '../../dtos';
import {PaymentMethodDto} from '../../dtos';
import {CreatePaymentMethodService} from '../create-payment-method.service';

describe('A create-payment-method service', () => {
    const paymentMethodRepository = mock<PaymentMethodRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createPaymentMethodService = new CreatePaymentMethodService(paymentMethodRepository, eventDispatcher);

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

    it('should create a payment method', async () => {
        const payload: CreatePaymentMethodDto = {
            name: 'Cash',
            type: PaymentMethodType.CASH,
            companyId: CompanyId.generate(),
        };

        const paymentMethod = PaymentMethod.create(payload);

        jest.spyOn(PaymentMethod, 'create').mockReturnValue(paymentMethod);

        await expect(createPaymentMethodService.execute({actor, payload})).resolves.toEqual(
            new PaymentMethodDto(paymentMethod)
        );

        expect(PaymentMethod.create).toHaveBeenCalledWith(payload);

        expect(paymentMethod.events).toHaveLength(1);
        expect(paymentMethod.events[0]).toBeInstanceOf(PaymentMethodCreatedEvent);
        expect(paymentMethod.events).toEqual([
            {
                type: PaymentMethodCreatedEvent.type,
                companyId: paymentMethod.companyId,
                timestamp: now,
                paymentMethod,
            },
        ]);

        expect(paymentMethodRepository.save).toHaveBeenCalledWith(paymentMethod);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, paymentMethod);
    });

    it('should throw an error when failing to save the payment method', async () => {
        const payload: CreatePaymentMethodDto = {
            name: 'Cash',
            type: PaymentMethodType.CASH,
            companyId: CompanyId.generate(),
        };

        jest.spyOn(paymentMethodRepository, 'save').mockRejectedValue(new Error('Unexpected error.'));

        await expect(createPaymentMethodService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
