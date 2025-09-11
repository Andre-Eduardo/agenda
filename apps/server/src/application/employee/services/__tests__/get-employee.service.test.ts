import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EmployeeRepository} from '../../../../domain/employee/employee.repository';
import {fakeEmployee} from '../../../../domain/employee/entities/__tests__/fake-employee';
import {PersonId} from '../../../../domain/person/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetEmployeeDto} from '../../dtos';
import {EmployeeDto} from '../../dtos';
import {GetEmployeeService} from '../get-employee.service';

describe('A get-employee service', () => {
    const employeeRepository = mock<EmployeeRepository>();
    const getEmployeeService = new GetEmployeeService(employeeRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get an employee', async () => {
        const existingEmployee = fakeEmployee();

        const payload: GetEmployeeDto = {
            id: existingEmployee.id,
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);

        await expect(getEmployeeService.execute({actor, payload})).resolves.toEqual(new EmployeeDto(existingEmployee));

        expect(existingEmployee.events).toHaveLength(0);

        expect(employeeRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the employee does not exist', async () => {
        const payload: GetEmployeeDto = {
            id: PersonId.generate(),
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Employee not found'
        );
    });
});
