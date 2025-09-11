import {CompanyId} from '../../../../domain/company/entities';
import type {CreatePaymentMethod} from '../../../../domain/payment-method/entities';
import {PaymentMethod, PaymentMethodType} from '../../../../domain/payment-method/entities';
import {PaymentMethodDto} from '../payment-method.dto';

describe('A PaymentMethodDto', () => {
    it('should be creatable from a payment method entity', () => {
        const paymentMethodPayload: CreatePaymentMethod = {
            name: 'Cash',
            type: PaymentMethodType.CASH,
            companyId: CompanyId.generate(),
        };

        const paymentMethod = PaymentMethod.create(paymentMethodPayload);
        const paymentMethodDto = new PaymentMethodDto(paymentMethod);

        expect(paymentMethodDto.name).toEqual(paymentMethodPayload.name);
        expect(paymentMethodDto.type).toEqual(paymentMethodPayload.type);
        expect(paymentMethodDto.companyId).toEqual(paymentMethodPayload.companyId.toString());
    });
});
