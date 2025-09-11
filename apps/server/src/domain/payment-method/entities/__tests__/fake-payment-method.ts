import {CompanyId} from '../../../company/entities';
import {PaymentMethod, PaymentMethodId, PaymentMethodType} from '../index';

export function fakePaymentMethod(payload: Partial<PaymentMethod> = {}): PaymentMethod {
    return new PaymentMethod({
        id: PaymentMethodId.generate(),
        companyId: CompanyId.generate(),
        name: 'Cash',
        type: PaymentMethodType.CASH,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
