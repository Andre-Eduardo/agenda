import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EmployeePositionRepository} from '../../../../domain/employee-position/employee-position.repository';
import {EmployeePositionId} from '../../../../domain/employee-position/entities';
import {fakeEmployeePosition} from '../../../../domain/employee-position/entities/__tests__/fake-employee-position';
import {EmployeePositionDeletedEvent} from '../../../../domain/employee-position/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteEmployeePositionDto} from '../../dtos';
import {DeleteEmployeePositionService} from '../delete-employee-position.service';

describe('A delete-employee-position service', () => {
    const employeePositionRepository = mock<EmployeePositionRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteEmployeePositionService = new DeleteEmployeePositionService(
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

    it('should delete an employee position', async () => {
        const existingEmployeePosition = fakeEmployeePosition({
            companyId,
            name: 'Manager',
        });

        const payload: DeleteEmployeePositionDto = {
            id: existingEmployeePosition.id,
        };

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValueOnce(existingEmployeePosition);

        await deleteEmployeePositionService.execute({actor, payload});

        expect(existingEmployeePosition.events).toHaveLength(1);
        expect(existingEmployeePosition.events[0]).toBeInstanceOf(EmployeePositionDeletedEvent);
        expect(existingEmployeePosition.events).toEqual([
            {
                type: EmployeePositionDeletedEvent.type,
                employeePosition: existingEmployeePosition,
                companyId: existingEmployeePosition.companyId,
                timestamp: now,
            },
        ]);
    });

    it('should throw an error when the employee position does not exist', async () => {
        const payload: DeleteEmployeePositionDto = {
            id: EmployeePositionId.generate(),
        };

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteEmployeePositionService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Employee position not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
