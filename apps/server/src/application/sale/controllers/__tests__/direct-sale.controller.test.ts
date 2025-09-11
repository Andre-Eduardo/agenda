import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {ProductId} from '../../../../domain/product/entities';
import {DirectSale} from '../../../../domain/sale/entities';
import {fakeDirectSale} from '../../../../domain/sale/entities/__tests__/fake-direct-sale';
import {fakeSaleItem} from '../../../../domain/sale/entities/__tests__/fake-sale-item';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import type {CreateDirectSaleDto} from '../../dtos';
import {DirectSaleDto} from '../../dtos';
import type {
    CreateDirectSaleService,
    GetDirectSaleService,
    ListDirectSaleService,
    UpdateDirectSaleService,
} from '../../services';
import {DirectSaleController} from '../direct-sale.controller';

describe('A direct sale controller', () => {
    const createDirectSaleServiceMock = mock<CreateDirectSaleService>();
    const updateDirectSaleServiceMock = mock<UpdateDirectSaleService>();
    const getDirectSaleServiceMock = mock<GetDirectSaleService>();
    const listDirectSaleServiceMock = mock<ListDirectSaleService>();
    const directSaleController = new DirectSaleController(
        createDirectSaleServiceMock,
        getDirectSaleServiceMock,
        listDirectSaleServiceMock,
        updateDirectSaleServiceMock
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();

    describe('when creating a direct sale', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: CreateDirectSaleDto = {
                companyId,
                buyerId: PersonId.generate(),
                items: [
                    {
                        productId: ProductId.generate(),
                        price: 12.3,
                        quantity: 3,
                    },
                ],
                transactions: [{amount: 10, paymentMethodId: PaymentMethodId.generate()}],
            };

            const expectedDirectSale = new DirectSaleDto(DirectSale.create({...payload, sellerId: actor.userId}));

            jest.spyOn(createDirectSaleServiceMock, 'execute').mockResolvedValueOnce(expectedDirectSale);

            await expect(directSaleController.createDirectSale(actor, payload)).resolves.toEqual(expectedDirectSale);

            expect(createDirectSaleServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getDirectSaleServiceMock.execute).not.toHaveBeenCalled();
            expect(listDirectSaleServiceMock.execute).not.toHaveBeenCalled();
            expect(updateDirectSaleServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting a direct sale', () => {
        it('should repass the responsibility to the right service', async () => {
            const directSale = fakeDirectSale();

            const expectedDirectSale = new DirectSaleDto(directSale);

            jest.spyOn(getDirectSaleServiceMock, 'execute').mockResolvedValueOnce(expectedDirectSale);

            await expect(directSaleController.getDirectSale(actor, directSale.id)).resolves.toEqual(expectedDirectSale);

            expect(createDirectSaleServiceMock.execute).not.toHaveBeenCalled();
            expect(getDirectSaleServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: directSale.id}});
            expect(listDirectSaleServiceMock.execute).not.toHaveBeenCalled();
            expect(updateDirectSaleServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing direct sales', () => {
        it('should repass the responsibility to the right service', async () => {
            const sellerId = UserId.generate();

            const directSales = [
                fakeDirectSale({
                    companyId,
                    buyerId: null,
                    items: [
                        fakeSaleItem({
                            price: 10.2,
                            quantity: 3,
                        }),
                        fakeSaleItem({
                            price: 3.4,
                            quantity: 2,
                        }),
                    ],
                }),
                fakeDirectSale({
                    companyId,
                    sellerId,
                    items: [
                        fakeSaleItem({
                            price: 12.3,
                            quantity: 3,
                        }),
                    ],
                    note: 'note',
                }),
            ];

            const payload = {
                companyId,
                sellerId,
                pagination: {
                    limit: 10,
                },
            };

            const expectedResult: PaginatedDto<DirectSaleDto> = {
                data: directSales.map((directSale) => new DirectSaleDto(directSale)),
                totalCount: 1,
                nextCursor: null,
            };

            jest.spyOn(listDirectSaleServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(directSaleController.listDirectSale(actor, payload)).resolves.toEqual(expectedResult);

            expect(createDirectSaleServiceMock.execute).not.toHaveBeenCalled();
            expect(getDirectSaleServiceMock.execute).not.toHaveBeenCalled();
            expect(listDirectSaleServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(updateDirectSaleServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when updating a direct sale', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingDirectSale = fakeDirectSale({
                companyId,
                sellerId: UserId.generate(),
                buyerId: PersonId.generate(),
                items: [
                    fakeSaleItem({
                        price: 12.3,
                        quantity: 3,
                    }),
                ],
            });

            const payload = {
                note: 'new note',
            };

            const expectedDirectSale = new DirectSaleDto(existingDirectSale);

            jest.spyOn(updateDirectSaleServiceMock, 'execute').mockResolvedValueOnce(expectedDirectSale);

            await expect(directSaleController.updateDirectSale(actor, existingDirectSale.id, payload)).resolves.toEqual(
                expectedDirectSale
            );

            expect(createDirectSaleServiceMock.execute).not.toHaveBeenCalled();
            expect(getDirectSaleServiceMock.execute).not.toHaveBeenCalled();
            expect(listDirectSaleServiceMock.execute).not.toHaveBeenCalled();
            expect(updateDirectSaleServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingDirectSale.id, ...payload},
            });
        });
    });
});
