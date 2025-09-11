import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {Cashier} from '../../../../domain/cashier/entities';
import {CompanyId} from '../../../../domain/company/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import type {OpenCashierDto} from '../../dtos';
import {CashierDto} from '../../dtos';
import type {OpenCashierService, CloseCashierService, GetCashierService, ListCashierService} from '../../services';
import {CashierController} from '../index';

describe('A cashier controller', () => {
    const openCashierServiceMock = mock<OpenCashierService>();
    const getCashierServiceMock = mock<GetCashierService>();
    const listCashierServiceMock = mock<ListCashierService>();
    const closeCashierServiceMock = mock<CloseCashierService>();
    const cashierController = new CashierController(
        openCashierServiceMock,
        getCashierServiceMock,
        listCashierServiceMock,
        closeCashierServiceMock
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();

    describe('when opening a cashier', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: OpenCashierDto = {
                companyId,
                userId: UserId.generate(),
            };

            const expectedCashier = new CashierDto(Cashier.open(payload));

            jest.spyOn(openCashierServiceMock, 'execute').mockResolvedValueOnce(expectedCashier);

            await expect(cashierController.openCashier(actor, payload)).resolves.toEqual(expectedCashier);

            expect(openCashierServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getCashierServiceMock.execute).not.toHaveBeenCalled();
            expect(listCashierServiceMock.execute).not.toHaveBeenCalled();
            expect(closeCashierServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting a cashier', () => {
        it('should repass the responsibility to the right service', async () => {
            const cashier = Cashier.open({
                companyId,
                userId: UserId.generate(),
            });

            const expectedCashier = new CashierDto(cashier);

            jest.spyOn(getCashierServiceMock, 'execute').mockResolvedValueOnce(expectedCashier);

            await expect(cashierController.getCashier(actor, cashier.id)).resolves.toEqual(expectedCashier);

            expect(getCashierServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: cashier.id}});
        });
    });

    describe('when listing cashier', () => {
        it('should repass the responsibility to the right service', async () => {
            const cashiers = [
                Cashier.open({
                    companyId,
                    userId: UserId.generate(),
                }),
                Cashier.open({
                    companyId,
                    userId: UserId.generate(),
                }),
            ];

            const payload = {
                companyId,
                name: 'name',
                pagination: {
                    limit: 10,
                },
            };

            const expectedResult: PaginatedDto<CashierDto> = {
                data: cashiers.map((cashier) => new CashierDto(cashier)),
                totalCount: cashiers.length,
                nextCursor: null,
            };

            jest.spyOn(listCashierServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(cashierController.listCashier(actor, payload)).resolves.toEqual(expectedResult);

            expect(listCashierServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when closing a cashier', () => {
        it('should repass the responsibility to the right service', async () => {
            const cashier = Cashier.open({
                companyId,
                userId: UserId.generate(),
            });

            cashier.close();

            const expectedCashier = new CashierDto(cashier);

            jest.spyOn(closeCashierServiceMock, 'execute').mockResolvedValueOnce(expectedCashier);

            await expect(cashierController.closeCashier(actor, cashier.id)).resolves.toEqual(expectedCashier);

            expect(openCashierServiceMock.execute).not.toHaveBeenCalled();
            expect(getCashierServiceMock.execute).not.toHaveBeenCalled();
            expect(listCashierServiceMock.execute).not.toHaveBeenCalled();
            expect(closeCashierServiceMock.execute).toHaveBeenCalled();
        });
    });
});
