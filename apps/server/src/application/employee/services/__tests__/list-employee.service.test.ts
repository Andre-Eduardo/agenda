import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import type {EmployeeRepository} from '../../../../domain/employee/employee.repository';
import type {Employee} from '../../../../domain/employee/entities';
import {fakeEmployee} from '../../../../domain/employee/entities/__tests__/fake-employee';
import {Gender, PersonProfile, PersonType} from '../../../../domain/person/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ListEmployeeDto} from '../../dtos';
import {EmployeeDto} from '../../dtos';
import {ListEmployeeService} from '../list-employee.service';

describe('A list-employee service', () => {
    const employeeRepository = mock<EmployeeRepository>();
    const listEmployeeService = new ListEmployeeService(employeeRepository);

    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const existingEmployee = [
        fakeEmployee({
            name: 'My name',
            companyName: null,
            profiles: new Set([PersonProfile.EMPLOYEE]),
            personType: PersonType.NATURAL,
            documentId: DocumentId.create('12345678911'),
            gender: Gender.MALE,
            companyId,
            phone: Phone.create('12345678901'),
            allowSystemAccess: false,
            userId: null,
        }),
        fakeEmployee({
            name: 'My name2',
            documentId: DocumentId.create('12345678901'),
            companyName: null,
            profiles: new Set([PersonProfile.EMPLOYEE]),
            personType: PersonType.NATURAL,
            gender: Gender.FEMALE,
            companyId,
            phone: Phone.create('12345678901'),
            allowSystemAccess: true,
        }),
    ];

    it('should list employees', async () => {
        const paginatedEmployees: PaginatedList<Employee> = {
            data: existingEmployee,
            totalCount: existingEmployee.length,
            nextCursor: null,
        };

        const payload: ListEmployeeDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {name: 'asc'},
            },
            name: 'name',
        };

        jest.spyOn(employeeRepository, 'search').mockResolvedValueOnce(paginatedEmployees);

        await expect(listEmployeeService.execute({actor, payload})).resolves.toEqual({
            data: existingEmployee.map((employee) => new EmployeeDto(employee)),
            totalCount: existingEmployee.length,
            nextCursor: null,
        });
        expect(existingEmployee.flatMap((employee) => employee.events)).toHaveLength(0);
        expect(employeeRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {name: 'asc'},
            },
            {
                name: 'name',
            }
        );
    });

    it('should paginate employees', async () => {
        const paginatedEmployees: PaginatedList<Employee> = {
            data: existingEmployee,
            totalCount: existingEmployee.length,
            nextCursor: null,
        };
        const payload: ListEmployeeDto = {
            companyId,
            name: 'name',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(employeeRepository, 'search').mockResolvedValueOnce(paginatedEmployees);

        await expect(listEmployeeService.execute({actor, payload})).resolves.toEqual({
            data: existingEmployee.map((employee) => new EmployeeDto(employee)),
            totalCount: existingEmployee.length,
            nextCursor: null,
        });
        expect(existingEmployee.flatMap((employee) => employee.events)).toHaveLength(0);
        expect(employeeRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                name: 'name',
            }
        );
    });
});
