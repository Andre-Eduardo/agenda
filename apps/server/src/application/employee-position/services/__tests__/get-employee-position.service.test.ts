import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EmployeePositionRepository} from '../../../../domain/employee-position/employee-position.repository';
import {EmployeePositionId} from '../../../../domain/employee-position/entities';
import {fakeEmployeePosition} from '../../../../domain/employee-position/entities/__tests__/fake-employee-position';
import {UserId} from '../../../../domain/user/entities';
import type {GetEmployeePositionDto} from '../../dtos';
import {EmployeePositionDto} from '../../dtos';
import {GetEmployeePositionService} from '../get-employee-position.service';

describe('A get-employee-position service', () => {
    const employeePositionRepository = mock<EmployeePositionRepository>();
    const getEmployeePositionService = new GetEmployeePositionService(employeePositionRepository);

    const companyId = CompanyId.generate();
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get an employee position', async () => {
        const existingEmployeePosition = fakeEmployeePosition({
            companyId,
        });

        const payload: GetEmployeePositionDto = {
            id: existingEmployeePosition.id,
        };

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValueOnce(existingEmployeePosition);

        await expect(getEmployeePositionService.execute({actor, payload})).resolves.toEqual(
            new EmployeePositionDto(existingEmployeePosition)
        );

        expect(existingEmployeePosition.events).toHaveLength(0);

        expect(employeePositionRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the employee position does not exist', async () => {
        const payload: GetEmployeePositionDto = {
            id: EmployeePositionId.generate(),
        };

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getEmployeePositionService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Employee position not found'
        );
    });
});
