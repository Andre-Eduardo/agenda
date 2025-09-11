import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {DuplicateNameException, PreconditionException} from '../../../../domain/@shared/exceptions';
import {ProductPermission} from '../../../../domain/auth';
import {CompanyId} from '../../../../domain/company/entities';
import type {EmployeePositionRepository} from '../../../../domain/employee-position/employee-position.repository';
import {EmployeePosition} from '../../../../domain/employee-position/entities';
import {EmployeePositionCreatedEvent} from '../../../../domain/employee-position/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {CreateEmployeePositionDto} from '../../dtos';
import {EmployeePositionDto} from '../../dtos';
import {CreateEmployeePositionService} from '../create-employee-position.service';

describe('A create-employee-position service', () => {
    const employeePositionRepository = mock<EmployeePositionRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createEmployeePositionService = new CreateEmployeePositionService(
        employeePositionRepository,
        eventDispatcher
    );

    const companyId = CompanyId.generate();
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

    it('should create an employee position', async () => {
        const payload: CreateEmployeePositionDto = {
            companyId,
            name: 'Manager',
            permissions: new Set([ProductPermission.UPDATE]),
        };

        const employeePosition = EmployeePosition.create({
            companyId,
            name: 'Admin',
            permissions: new Set([ProductPermission.UPDATE]),
        });

        jest.spyOn(EmployeePosition, 'create').mockReturnValue(employeePosition);

        await expect(createEmployeePositionService.execute({actor, payload})).resolves.toEqual(
            new EmployeePositionDto(employeePosition)
        );

        expect(EmployeePosition.create).toHaveBeenCalledWith(payload);
        expect(employeePosition.events[0]).toBeInstanceOf(EmployeePositionCreatedEvent);
        expect(employeePosition.events).toEqual([
            {
                type: EmployeePositionCreatedEvent.type,
                employeePosition,
                companyId: employeePosition.companyId,
                timestamp: now,
            },
        ]);

        expect(employeePositionRepository.save).toHaveBeenCalledWith(employeePosition);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, employeePosition);
    });

    it('should throw an error if the employee position name is already in use', async () => {
        const payload: CreateEmployeePositionDto = {
            companyId,
            name: 'Maid',
            permissions: new Set([ProductPermission.UPDATE]),
        };

        const existingEmployeePosition = EmployeePosition.create({
            companyId,
            name: 'Maid',
            permissions: new Set([ProductPermission.UPDATE]),
        });

        jest.spyOn(EmployeePosition, 'create').mockReturnValue(existingEmployeePosition);
        jest.spyOn(employeePositionRepository, 'save').mockRejectedValue(new DuplicateNameException('Duplicated name'));

        await expect(createEmployeePositionService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create an employee position with a name already in use.'
        );

        expect(EmployeePosition.create).toHaveBeenCalledWith(payload);
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the employee position', async () => {
        const payload: CreateEmployeePositionDto = {
            companyId,
            name: 'Manager',
            permissions: new Set([ProductPermission.UPDATE]),
        };

        const employeePosition = EmployeePosition.create({
            companyId,
            name: 'Manager',
            permissions: new Set([ProductPermission.UPDATE]),
        });

        jest.spyOn(EmployeePosition, 'create').mockReturnValue(employeePosition);
        jest.spyOn(employeePositionRepository, 'save').mockRejectedValue(new Error('generic error'));

        await expect(createEmployeePositionService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'generic error'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
