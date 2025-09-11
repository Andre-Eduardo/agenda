import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import type {CreateEmployee} from '../../../../domain/employee/entities';
import {Employee} from '../../../../domain/employee/entities';
import {EmployeePositionId} from '../../../../domain/employee-position/entities';
import {PersonProfile, PersonType} from '../../../../domain/person/entities';
import {UserId} from '../../../../domain/user/entities';
import {EmployeeDto} from '../employee.dto';

describe('An EmployeeDto', () => {
    it('should be creatable from an employee entity', () => {
        const employeePayload = {
            name: 'John Doe',
            companyId: CompanyId.generate(),
            companyName: 'ACME',
            documentId: DocumentId.create('123.456.789-00'),
            positionId: EmployeePositionId.generate(),
            personType: PersonType.LEGAL,
            phone: Phone.create('61345678900'),
            allowSystemAccess: true,
            userId: UserId.generate(),
        } satisfies CreateEmployee;

        const employee = Employee.create(employeePayload);
        const employeeDto = new EmployeeDto(employee);

        expect(employeeDto.name).toEqual(employeePayload.name);
        expect(employeeDto.documentId).toEqual(employeePayload.documentId.toString());
        expect(employeeDto.positionId).toEqual(employeePayload.positionId.toString());
        expect(employeeDto.phone).toEqual(employeePayload.phone.toString());
        expect(employeeDto.companyName).toEqual(employeePayload.companyName);
        expect(employeeDto.profiles).toEqual([PersonProfile.EMPLOYEE]);
        expect(employeeDto.personType).toEqual(employeePayload.personType);
    });

    it.each([
        {personType: PersonType.NATURAL, companyName: undefined, gender: null},
        {personType: PersonType.LEGAL, companyName: null, gender: undefined},
    ])('should normalize null values', (values) => {
        const employeePayload = {
            ...values,
            name: 'John Doe',
            positionId: EmployeePositionId.generate(),
            companyId: CompanyId.generate(),
            documentId: DocumentId.create('123.456.789-00'),
            phone: null,
            allowSystemAccess: false,
        } satisfies CreateEmployee;

        const employee = Employee.create(employeePayload);
        const employeeDto = new EmployeeDto(employee);

        expect(employeeDto.companyName).toEqual(null);
        expect(employee.gender).toEqual(null);
        expect(employeeDto.phone).toEqual(null);
    });
});
