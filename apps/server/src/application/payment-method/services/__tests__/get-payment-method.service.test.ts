import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {fakePaymentMethod} from '../../../../domain/payment-method/entities/__tests__/fake-payment-method';
import type {PaymentMethodRepository} from '../../../../domain/payment-method/payment-method.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetPaymentMethodDto} from '../../dtos';
import {PaymentMethodDto} from '../../dtos';
import {GetPaymentMethodService} from '../get-payment-method.service';

describe('A get-payment-method service', () => {
    const paymentMethodRepository = mock<PaymentMethodRepository>();
    const getPaymentMethodService = new GetPaymentMethodService(paymentMethodRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a payment method', async () => {
        const existingPaymentMethod = fakePaymentMethod();

        const payload: GetPaymentMethodDto = {
            id: existingPaymentMethod.id,
        };

        jest.spyOn(paymentMethodRepository, 'findById').mockResolvedValueOnce(existingPaymentMethod);

        await expect(getPaymentMethodService.execute({actor, payload})).resolves.toEqual(
            new PaymentMethodDto(existingPaymentMethod)
        );

        expect(existingPaymentMethod.events).toHaveLength(0);

        expect(paymentMethodRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the payment method does not exist', async () => {
        const payload: GetPaymentMethodDto = {
            id: PaymentMethodId.generate(),
        };

        jest.spyOn(paymentMethodRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getPaymentMethodService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Payment method not found'
        );
    });
});
