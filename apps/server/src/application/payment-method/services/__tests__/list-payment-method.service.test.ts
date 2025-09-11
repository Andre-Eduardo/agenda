import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {PaymentMethod} from '../../../../domain/payment-method/entities';
import {PaymentMethodType} from '../../../../domain/payment-method/entities';
import {fakePaymentMethod} from '../../../../domain/payment-method/entities/__tests__/fake-payment-method';
import type {PaymentMethodRepository} from '../../../../domain/payment-method/payment-method.repository';
import {UserId} from '../../../../domain/user/entities';
import type {ListPaymentMethodDto} from '../../dtos';
import {PaymentMethodDto} from '../../dtos';
import {ListPaymentMethodService} from '../list-payment-method.service';

describe('A list-payment-method service', () => {
    const paymentMethodRepository = mock<PaymentMethodRepository>();
    const listPaymentMethodService = new ListPaymentMethodService(paymentMethodRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };
    const companyId = CompanyId.generate();
    const existingPaymentMethod = [
        fakePaymentMethod({
            name: 'Payment method 1',
            type: PaymentMethodType.CASH,
            companyId,
        }),
        fakePaymentMethod({
            name: 'Payment method 2',
            type: PaymentMethodType.CREDIT_CARD,
            companyId,
        }),
    ];

    it('should list payment methods', async () => {
        const paginatedPaymentMethods: PaginatedList<PaymentMethod> = {
            data: existingPaymentMethod,
            totalCount: existingPaymentMethod.length,
            nextCursor: null,
        };

        const payload: ListPaymentMethodDto = {
            companyId,
            name: 'Payment method',
            pagination: {
                limit: 2,
                sort: {name: 'asc'},
            },
        };

        jest.spyOn(paymentMethodRepository, 'search').mockResolvedValueOnce(paginatedPaymentMethods);

        await expect(listPaymentMethodService.execute({actor, payload})).resolves.toEqual({
            data: existingPaymentMethod.map((paymentMethod) => new PaymentMethodDto(paymentMethod)),
            totalCount: existingPaymentMethod.length,
            nextCursor: null,
        });
        expect(existingPaymentMethod.flatMap((paymentMethod) => paymentMethod.events)).toHaveLength(0);

        expect(paymentMethodRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {name: 'asc'},
            },
            {
                name: 'Payment method',
            }
        );
    });

    it('should paginate payment methods', async () => {
        const paginatedPaymentMethods: PaginatedList<PaymentMethod> = {
            data: existingPaymentMethod,
            totalCount: existingPaymentMethod.length,
            nextCursor: null,
        };
        const payload: ListPaymentMethodDto = {
            companyId,
            name: 'Payment Method',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(paymentMethodRepository, 'search').mockResolvedValueOnce(paginatedPaymentMethods);

        await expect(listPaymentMethodService.execute({actor, payload})).resolves.toEqual({
            data: existingPaymentMethod.map((paymentMethod) => new PaymentMethodDto(paymentMethod)),
            totalCount: existingPaymentMethod.length,
            nextCursor: null,
        });

        expect(existingPaymentMethod.flatMap((paymentMethod) => paymentMethod.events)).toHaveLength(0);

        expect(paymentMethodRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                name: 'Payment Method',
            }
        );
    });
});
