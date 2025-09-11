import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../../domain/@shared/exceptions';
import {ProductPermission} from '../../../../domain/auth';
import {CompanyId} from '../../../../domain/company/entities';
import type {EmployeePositionRepository} from '../../../../domain/employee-position/employee-position.repository';
import {EmployeePositionId} from '../../../../domain/employee-position/entities';
import {fakeEmployeePosition} from '../../../../domain/employee-position/entities/__tests__/fake-employee-position';
import {EmployeePositionChangedEvent} from '../../../../domain/employee-position/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateEmployeePositionDto} from '../../dtos';
import {EmployeePositionDto} from '../../dtos';
import {UpdateEmployeePositionService} from '../update-employee-position.service';

describe('A update-employee-position service', () => {
    const employeePositionRepository = mock<EmployeePositionRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateEmployeePositionService = new UpdateEmployeePositionService(
        employeePositionRepository,
        eventDispatcher
    );

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

    it('should update an employee position', async () => {
        const existingEmployeePosition = fakeEmployeePosition({
            name: 'Old name',
            permissions: new Set([ProductPermission.VIEW]),
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        const oldEmployeePosition = fakeEmployeePosition(existingEmployeePosition);

        const payload: UpdateEmployeePositionDto = {
            id: existingEmployeePosition.id,
            name: 'New name',
        };

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValueOnce(existingEmployeePosition);

        const updatedEmployeePosition = fakeEmployeePosition({
            ...existingEmployeePosition,
            ...payload,
            updatedAt: now,
        });

        await expect(updateEmployeePositionService.execute({actor, payload})).resolves.toEqual(
            new EmployeePositionDto(updatedEmployeePosition)
        );

        expect(existingEmployeePosition.name).toBe(payload.name);
        expect(existingEmployeePosition.updatedAt).toEqual(now);

        expect(existingEmployeePosition.events).toHaveLength(1);
        expect(existingEmployeePosition.events[0]).toBeInstanceOf(EmployeePositionChangedEvent);
        expect(existingEmployeePosition.events).toEqual([
            {
                type: EmployeePositionChangedEvent.type,
                companyId: existingEmployeePosition.companyId,
                timestamp: now,
                oldState: oldEmployeePosition,
                newState: existingEmployeePosition,
            },
        ]);

        expect(employeePositionRepository.save).toHaveBeenCalledWith(existingEmployeePosition);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingEmployeePosition);
    });

    it('should throw an error if the employee position name is already in use', async () => {
        const payload: UpdateEmployeePositionDto = {
            id: EmployeePositionId.generate(),
            name: 'Manager',
        };

        const existingEmployeePosition = fakeEmployeePosition({
            id: payload.id,
            companyId: CompanyId.generate(),
            name: 'Manager',
            permissions: new Set([ProductPermission.VIEW]),
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValueOnce(existingEmployeePosition);
        jest.spyOn(employeePositionRepository, 'save').mockRejectedValueOnce(
            new DuplicateNameException('Duplicate employee position name.')
        );

        await expect(updateEmployeePositionService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update an employee position with a name already in use.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error if the employee position does not exist', async () => {
        const payload: UpdateEmployeePositionDto = {
            id: EmployeePositionId.generate(),
            name: 'Manager',
        };

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateEmployeePositionService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Employee position not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to update the employee position', async () => {
        const payload: UpdateEmployeePositionDto = {
            id: EmployeePositionId.generate(),
            name: 'Admin',
        };

        const existingEmployeePosition = fakeEmployeePosition({
            id: payload.id,
            companyId: CompanyId.generate(),
            name: 'Manager',
            permissions: new Set([ProductPermission.VIEW]),
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValueOnce(existingEmployeePosition);
        jest.spyOn(employeePositionRepository, 'save').mockRejectedValue(new Error('generic error'));

        await expect(updateEmployeePositionService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'generic error'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
