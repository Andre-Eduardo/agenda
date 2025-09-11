import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import type {CashierRepository} from '../../../../domain/cashier/cashier.repository';
import {Cashier} from '../../../../domain/cashier/entities';
import {CashierOpenedEvent} from '../../../../domain/cashier/events';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {OpenCashierDto} from '../../dtos';
import {CashierDto} from '../../dtos';
import {OpenCashierService} from '../index';

describe('A open-cashier service', () => {
    const cashierRepository = mock<CashierRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const openCashierService = new OpenCashierService(cashierRepository, eventDispatcher);

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

    it('should create a cashier', async () => {
        const payload: OpenCashierDto = {
            companyId: CompanyId.generate(),
            userId: UserId.generate(),
        };

        const cashier = Cashier.open(payload);

        jest.spyOn(Cashier, 'open').mockReturnValue(cashier);

        jest.spyOn(cashierRepository, 'findOpened').mockResolvedValueOnce(null);

        await expect(openCashierService.execute({actor, payload})).resolves.toEqual(new CashierDto(cashier));

        expect(Cashier.open).toHaveBeenCalledWith(payload);

        expect(cashier.events).toHaveLength(1);
        expect(cashier.events[0]).toBeInstanceOf(CashierOpenedEvent);
        expect(cashier.events).toEqual([
            {
                type: CashierOpenedEvent.type,
                companyId: cashier.companyId,
                cashier,
                timestamp: now,
            },
        ]);

        expect(cashierRepository.save).toHaveBeenCalledWith(cashier);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, cashier);
    });

    it('should fail when the user already has an opened cashier', async () => {
        const payload: OpenCashierDto = {
            companyId: CompanyId.generate(),
            userId: UserId.generate(),
        };

        jest.spyOn(cashierRepository, 'findOpened').mockResolvedValueOnce(Cashier.open(payload));

        await expect(openCashierService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'The user already has one opened cashier.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the cashier', async () => {
        const payload: OpenCashierDto = {
            companyId: CompanyId.generate(),
            userId: UserId.generate(),
        };

        jest.spyOn(cashierRepository, 'findOpened').mockResolvedValueOnce(null);

        jest.spyOn(cashierRepository, 'save').mockRejectedValue(new Error('generic error'));

        await expect(openCashierService.execute({actor, payload})).rejects.toThrowWithMessage(Error, 'generic error');

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
