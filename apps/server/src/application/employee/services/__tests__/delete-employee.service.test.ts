import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EmployeeRepository} from '../../../../domain/employee/employee.repository';
import {fakeEmployee} from '../../../../domain/employee/entities/__tests__/fake-employee';
import {EmployeeDeletedEvent} from '../../../../domain/employee/events';
import type {EventDispatcher} from '../../../../domain/event';
import {PersonId, PersonProfile} from '../../../../domain/person/entities';
import {fakePerson} from '../../../../domain/person/entities/__tests__/fake-person';
import type {PersonRepository} from '../../../../domain/person/person.repository';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteEmployeeDto} from '../../dtos';
import {DeleteEmployeeService} from '../delete-employee.service';

describe('A delete-employee service', () => {
    const employeeRepository = mock<EmployeeRepository>();
    const personRepository = mock<PersonRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteEmployeeService = new DeleteEmployeeService(personRepository, employeeRepository, eventDispatcher);

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

    it('should delete an employee', async () => {
        const existingPerson = fakePerson();
        const existingEmployee = fakeEmployee({
            ...existingPerson,
            profiles: new Set([PersonProfile.CUSTOMER, PersonProfile.EMPLOYEE]),
            allowSystemAccess: true,
            createdAt: now,
            updatedAt: now,
        });

        const payload: DeleteEmployeeDto = {
            id: existingEmployee.id,
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);

        await deleteEmployeeService.execute({actor, payload});

        expect(existingEmployee.events).toHaveLength(1);
        expect(existingEmployee.events[0]).toBeInstanceOf(EmployeeDeletedEvent);
        expect(existingEmployee.events).toEqual([
            {
                type: EmployeeDeletedEvent.type,
                timestamp: now,
                companyId: existingEmployee.companyId,
                employee: existingEmployee,
            },
        ]);

        expect(employeeRepository.save).toHaveBeenCalledWith({
            ...existingEmployee,
            profiles: new Set([PersonProfile.CUSTOMER]),
        });

        expect(employeeRepository.delete).toHaveBeenCalledWith(existingEmployee.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingEmployee);
    });

    it('should delete a person who is an employee only', async () => {
        const existingPerson = fakePerson();

        const existingEmployee = fakeEmployee({
            ...existingPerson,
            createdAt: now,
            updatedAt: now,
        });

        const payload: DeleteEmployeeDto = {
            id: existingEmployee.id,
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);

        await deleteEmployeeService.execute({actor, payload});

        expect(existingEmployee.events).toHaveLength(1);
        expect(existingEmployee.events[0]).toBeInstanceOf(EmployeeDeletedEvent);
        expect(existingEmployee.events).toEqual([
            {
                type: EmployeeDeletedEvent.type,
                timestamp: now,
                companyId: existingEmployee.companyId,
                employee: existingEmployee,
            },
        ]);
        expect(employeeRepository.save).toHaveBeenCalledWith({
            ...existingEmployee,
            profiles: new Set([]),
        });
        expect(employeeRepository.delete).toHaveBeenCalledWith(existingEmployee.id);
        expect(personRepository.delete).toHaveBeenCalledWith(existingEmployee.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingEmployee);
    });

    it('should throw an error when the employee does not exist', async () => {
        const personId = PersonId.generate();
        const payload: DeleteEmployeeDto = {
            id: personId,
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(null);

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        await expect(deleteEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Employee not found'
        );
    });
});
