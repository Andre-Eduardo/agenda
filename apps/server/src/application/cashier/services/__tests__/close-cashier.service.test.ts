import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {CashierRepository} from '../../../../domain/cashier/cashier.repository';
import {Cashier, CashierId} from '../../../../domain/cashier/entities';
import {fakeCashier} from '../../../../domain/cashier/entities/__tests__/fake-cashier';
import {CashierClosedEvent} from '../../../../domain/cashier/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {CloseCashierDto} from '../../dtos';
import {CashierDto} from '../../dtos';
import {CloseCashierService} from '../close-cashier.service';

describe('A close-cashier service', () => {
    const cashierRepository = mock<CashierRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const closeCashierService = new CloseCashierService(cashierRepository, eventDispatcher);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should close a cashier', async () => {
        const existingCashier = fakeCashier();

        const payload: CloseCashierDto = {
            id: existingCashier.id,
        };

        const closedCashier = new Cashier({
            ...existingCashier,
            updatedAt: now,
            closedAt: now,
        });

        jest.spyOn(cashierRepository, 'findById').mockResolvedValueOnce(existingCashier);

        await expect(closeCashierService.execute({actor, payload})).resolves.toEqual(new CashierDto(closedCashier));

        expect(existingCashier.events).toHaveLength(1);
        expect(existingCashier.events[0]).toBeInstanceOf(CashierClosedEvent);
        expect(existingCashier.events).toEqual([
            {
                type: CashierClosedEvent.type,
                companyId: existingCashier.companyId,
                timestamp: now,
                cashier: existingCashier,
            },
        ]);

        expect(cashierRepository.save).toHaveBeenCalledWith(existingCashier);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingCashier);
    });

    it('should throw an error when the cashier does not exist', async () => {
        const payload: CloseCashierDto = {
            id: CashierId.generate(),
        };

        jest.spyOn(cashierRepository, 'findById').mockResolvedValueOnce(null);

        await expect(closeCashierService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Cashier not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when the cashier is already closed', async () => {
        const existingCashier = fakeCashier({
            closedAt: now,
        });

        const payload: CloseCashierDto = {
            id: existingCashier.id,
        };

        jest.spyOn(cashierRepository, 'findById').mockResolvedValueOnce(existingCashier);

        await expect(closeCashierService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cashier is already closed.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
