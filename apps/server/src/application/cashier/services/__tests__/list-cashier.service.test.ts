import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {CashierRepository} from '../../../../domain/cashier/cashier.repository';
import type {Cashier} from '../../../../domain/cashier/entities';
import {fakeCashier} from '../../../../domain/cashier/entities/__tests__/fake-cashier';
import {CompanyId} from '../../../../domain/company/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ListCashierDto} from '../../dtos';
import {CashierDto} from '../../dtos';
import {ListCashierService} from '../list-cashier.service';

describe('A list-cashier service', () => {
    const cashierRepository = mock<CashierRepository>();
    const listCashierService = new ListCashierService(cashierRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();

    const existingCashiers = [
        fakeCashier({
            companyId,
        }),
        fakeCashier({
            companyId,
            createdAt: new Date(2000),
        }),
    ];

    it('should list cashiers', async () => {
        const paginatedCashiers: PaginatedList<Cashier> = {
            data: existingCashiers,
            totalCount: existingCashiers.length,
            nextCursor: null,
        };

        const payload: ListCashierDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {createdAt: 'asc'},
            },
            closedAt: {
                from: new Date(3000),
                to: new Date(3000),
            },
        };

        jest.spyOn(cashierRepository, 'search').mockResolvedValueOnce(paginatedCashiers);

        await expect(listCashierService.execute({actor, payload})).resolves.toEqual({
            data: existingCashiers.map((cashier) => new CashierDto(cashier)),
            totalCount: existingCashiers.length,
            nextCursor: null,
        });
        expect(existingCashiers.flatMap((cashier) => cashier.events)).toHaveLength(0);

        expect(cashierRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {createdAt: 'asc'},
            },
            {
                closedAt: {
                    from: new Date(3000),
                    to: new Date(3000),
                },
            }
        );
    });

    it('should paginate cashiers', async () => {
        const paginatedCashiers: PaginatedList<Cashier> = {
            data: existingCashiers,
            totalCount: existingCashiers.length,
            nextCursor: null,
        };

        const payload: ListCashierDto = {
            companyId,
            closedAt: null,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(cashierRepository, 'search').mockResolvedValueOnce(paginatedCashiers);

        await expect(listCashierService.execute({actor, payload})).resolves.toEqual({
            data: existingCashiers.map((cashier) => new CashierDto(cashier)),
            totalCount: existingCashiers.length,
            nextCursor: null,
        });

        expect(existingCashiers.flatMap((cashier) => cashier.events)).toHaveLength(0);

        expect(cashierRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                closedAt: null,
            }
        );
    });
});
