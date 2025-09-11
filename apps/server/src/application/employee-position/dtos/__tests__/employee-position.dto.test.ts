import {RoomPermission} from '../../../../domain/auth';
import {CompanyId} from '../../../../domain/company/entities';
import type {CreateEmployeePosition} from '../../../../domain/employee-position/entities';
import {EmployeePosition} from '../../../../domain/employee-position/entities';
import {EmployeePositionDto} from '../employee-position.dto';

describe('An EmployeePositionDto', () => {
    it('should be creatable from an employee position entity', () => {
        const employeePositionPayload: CreateEmployeePosition = {
            name: 'Manager',
            companyId: CompanyId.generate(),
            permissions: new Set([RoomPermission.VIEW, RoomPermission.UPDATE]),
        };

        const employeePosition = EmployeePosition.create(employeePositionPayload);
        const employeePositionDto = new EmployeePositionDto(employeePosition);

        expect(employeePositionDto.name).toEqual(employeePositionPayload.name);
        expect(employeePositionDto.companyId).toEqual(employeePositionPayload.companyId.toString());
        expect(employeePositionDto.permissions).toEqual([...employeePositionPayload.permissions]);
    });
});
