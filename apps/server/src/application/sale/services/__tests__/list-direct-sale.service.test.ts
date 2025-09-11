import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import {PersonId} from '../../../../domain/person/entities';
import type {DirectSaleRepository} from '../../../../domain/sale/direct-sale.repository';
import type {DirectSale} from '../../../../domain/sale/entities';
import {SaleId} from '../../../../domain/sale/entities';
import {fakeDirectSale} from '../../../../domain/sale/entities/__tests__/fake-direct-sale';
import {fakeSaleItem} from '../../../../domain/sale/entities/__tests__/fake-sale-item';
import {UserId} from '../../../../domain/user/entities';
import type {ListDirectSaleDto} from '../../dtos';
import {DirectSaleDto} from '../../dtos';
import {ListDirectSaleService} from '../list-direct-sale.service';

describe('A list-direct-sale service', () => {
    const directSaleRepository = mock<DirectSaleRepository>();
    const listDirectSaleService = new ListDirectSaleService(directSaleRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();
    const buyerId = PersonId.generate();
    const saleId = SaleId.generate();

    const existingDirectSales: DirectSale[] = [
        fakeDirectSale({
            id: saleId,
            companyId,
            buyerId,
            note: null,
            items: [
                fakeSaleItem({
                    saleId,
                    price: 9.2,
                    quantity: 1,
                    createdAt: new Date(1000),
                    updatedAt: new Date(1000),
                }),
            ],
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        }),
        fakeDirectSale({
            id: saleId,
            companyId,
            buyerId,
            note: 'note',
            items: [
                fakeSaleItem({
                    saleId,
                    price: 3.3,
                    quantity: 3,
                    createdAt: new Date(1000),
                    updatedAt: new Date(1000),
                }),
            ],
            createdAt: new Date(1000),
            updatedAt: new Date(2000),
        }),
    ];

    const paginatedDirectSales: PaginatedList<DirectSale> = {
        data: existingDirectSales,
        totalCount: existingDirectSales.length,
        nextCursor: null,
    };

    it('should list direct sale', async () => {
        const payload: ListDirectSaleDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {createdAt: 'asc'},
            },
            createdAt: {
                from: new Date(1000),
                to: new Date(1500),
            },
            items: {
                saleId,
                price: {
                    from: 1,
                    to: 10,
                },
            },
        };

        jest.spyOn(directSaleRepository, 'search').mockResolvedValueOnce(paginatedDirectSales);

        await expect(listDirectSaleService.execute({actor, payload})).resolves.toEqual({
            data: existingDirectSales.map((directSale) => new DirectSaleDto(directSale)),
            totalCount: existingDirectSales.length,
            nextCursor: null,
        });

        expect(existingDirectSales.flatMap((directSale) => directSale.events)).toHaveLength(0);

        expect(directSaleRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {createdAt: 'asc'},
            },
            {
                createdAt: {
                    from: new Date(1000),
                    to: new Date(1500),
                },
                items: {
                    saleId,
                    price: {
                        from: 1,
                        to: 10,
                    },
                },
            }
        );
    });

    it('should paginate direct sale', async () => {
        const payload: ListDirectSaleDto = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
            buyerId,
        };

        jest.spyOn(directSaleRepository, 'search').mockResolvedValueOnce(paginatedDirectSales);

        await expect(listDirectSaleService.execute({actor, payload})).resolves.toEqual({
            data: existingDirectSales.map((directSale) => new DirectSaleDto(directSale)),
            totalCount: existingDirectSales.length,
            nextCursor: null,
        });

        expect(existingDirectSales.flatMap((directSale) => directSale.events)).toHaveLength(0);

        expect(directSaleRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                buyerId,
            }
        );
    });

    it('should paginate sale item', async () => {
        const payload: ListDirectSaleDto = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
            items: {
                canceledAt: null,
            },
        };

        jest.spyOn(directSaleRepository, 'search').mockResolvedValueOnce(paginatedDirectSales);

        await expect(listDirectSaleService.execute({actor, payload})).resolves.toEqual({
            data: existingDirectSales.map((directSale) => new DirectSaleDto(directSale)),
            totalCount: existingDirectSales.length,
            nextCursor: null,
        });

        expect(existingDirectSales.flatMap((directSale) => directSale.events)).toHaveLength(0);

        expect(directSaleRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                items: {
                    canceledAt: null,
                },
            }
        );
    });
});
