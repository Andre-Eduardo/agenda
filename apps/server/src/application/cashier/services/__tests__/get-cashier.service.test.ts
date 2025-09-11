import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {CashierRepository} from '../../../../domain/cashier/cashier.repository';
import {CashierId} from '../../../../domain/cashier/entities';
import {fakeCashier} from '../../../../domain/cashier/entities/__tests__/fake-cashier';
import {UserId} from '../../../../domain/user/entities';
import type {GetCashierDto} from '../../dtos';
import {CashierDto} from '../../dtos';
import {GetCashierService} from '../get-cashier.service';

describe('A get-cashier service', () => {
    const cashierRepository = mock<CashierRepository>();
    const getCashierService = new GetCashierService(cashierRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a cashier', async () => {
        const existingCashier = fakeCashier();

        const payload: GetCashierDto = {
            id: existingCashier.id,
        };

        jest.spyOn(cashierRepository, 'findById').mockResolvedValueOnce(existingCashier);

        await expect(getCashierService.execute({actor, payload})).resolves.toEqual(new CashierDto(existingCashier));

        expect(existingCashier.events).toHaveLength(0);

        expect(cashierRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the cashier does not exist', async () => {
        const payload: GetCashierDto = {
            id: CashierId.generate(),
        };

        jest.spyOn(cashierRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getCashierService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Cashier not found'
        );
    });
});
