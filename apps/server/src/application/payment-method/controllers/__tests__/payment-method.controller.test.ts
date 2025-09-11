import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {PaymentMethod, PaymentMethodType} from '../../../../domain/payment-method/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {PaymentMethodDto} from '../../dtos';
import type {
    CreatePaymentMethodService,
    DeletePaymentMethodService,
    GetPaymentMethodService,
    ListPaymentMethodService,
    UpdatePaymentMethodService,
} from '../../services';
import {PaymentMethodController} from '../index';

describe('A PaymentMethodController', () => {
    const createPaymentMethodServiceMock = mock<CreatePaymentMethodService>();
    const listPaymentMethodServiceMock = mock<ListPaymentMethodService>();
    const getPaymentMethodServiceMock = mock<GetPaymentMethodService>();
    const updatePaymentMethodServiceMock = mock<UpdatePaymentMethodService>();
    const deletePaymentMethodServiceMock = mock<DeletePaymentMethodService>();
    const paymentMethodController = new PaymentMethodController(
        createPaymentMethodServiceMock,
        listPaymentMethodServiceMock,
        getPaymentMethodServiceMock,
        updatePaymentMethodServiceMock,
        deletePaymentMethodServiceMock
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a payment method', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                name: 'Cash',
                type: PaymentMethodType.CASH,
                companyId: CompanyId.generate(),
            };

            const expectedPaymentMethod = new PaymentMethodDto(PaymentMethod.create(payload));

            jest.spyOn(createPaymentMethodServiceMock, 'execute').mockResolvedValueOnce(expectedPaymentMethod);

            await expect(paymentMethodController.createPaymentMethod(actor, payload)).resolves.toEqual(
                expectedPaymentMethod
            );

            expect(createPaymentMethodServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getPaymentMethodServiceMock.execute).not.toHaveBeenCalled();
            expect(listPaymentMethodServiceMock.execute).not.toHaveBeenCalled();
            expect(deletePaymentMethodServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing payment methods', () => {
        it('should repass the responsibility to the right service', async () => {
            const companyId = CompanyId.generate();
            const values = [
                {
                    name: 'Cash',
                    type: PaymentMethodType.CASH,
                    companyId,
                },
                {
                    name: 'Mastercard credit',
                    type: PaymentMethodType.CREDIT_CARD,
                    companyId,
                },
            ];

            const payload = {
                companyId,
                name: PaymentMethodType.CASH,
                pagination: {
                    limit: 10,
                },
            };
            const paymentMethods = [PaymentMethod.create(values[0]), PaymentMethod.create(values[1])];
            const expectedResult: PaginatedDto<PaymentMethodDto> = {
                data: paymentMethods.map((paymentMethod) => new PaymentMethodDto(paymentMethod)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listPaymentMethodServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(paymentMethodController.listPaymentMethod(actor, payload)).resolves.toEqual(expectedResult);

            expect(listPaymentMethodServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a payment method', () => {
        it('should repass the responsibility to the right service', async () => {
            const paymentService = PaymentMethod.create({
                name: 'Cash',
                type: PaymentMethodType.CASH,
                companyId: CompanyId.generate(),
            });

            const expectedPaymentMethod = new PaymentMethodDto(paymentService);

            jest.spyOn(getPaymentMethodServiceMock, 'execute').mockResolvedValueOnce(expectedPaymentMethod);

            await expect(paymentMethodController.getPaymentMethod(actor, paymentService.id)).resolves.toEqual(
                expectedPaymentMethod
            );

            expect(getPaymentMethodServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: paymentService.id}});
        });
    });

    describe('when updating a payment method', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingPaymentMethod = PaymentMethod.create({
                name: 'Cash',
                type: PaymentMethodType.CASH,
                companyId: CompanyId.generate(),
            });
            const payload = {
                name: PaymentMethodType.CASH,
            };

            const expectedPaymentMethod = new PaymentMethodDto(existingPaymentMethod);

            jest.spyOn(updatePaymentMethodServiceMock, 'execute').mockResolvedValueOnce(expectedPaymentMethod);

            await expect(
                paymentMethodController.updatePaymentMethod(actor, existingPaymentMethod.id, payload)
            ).resolves.toEqual(expectedPaymentMethod);

            expect(updatePaymentMethodServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {
                    id: existingPaymentMethod.id,
                    ...payload,
                },
            });
        });
    });

    describe('when delete a payment method', () => {
        it('should repass the responsibility to the right service', async () => {
            const paymentMethod = PaymentMethod.create({
                name: 'Cash',
                type: PaymentMethodType.CASH,
                companyId: CompanyId.generate(),
            });

            await paymentMethodController.deletePaymentMethod(actor, paymentMethod.id);

            expect(createPaymentMethodServiceMock.execute).not.toHaveBeenCalled();
            expect(getPaymentMethodServiceMock.execute).not.toHaveBeenCalled();
            expect(listPaymentMethodServiceMock.execute).not.toHaveBeenCalled();
            expect(deletePaymentMethodServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: paymentMethod.id},
            });
        });
    });
});
