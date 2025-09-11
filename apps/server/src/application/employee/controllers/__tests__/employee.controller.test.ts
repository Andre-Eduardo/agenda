import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import type {CreateEmployee} from '../../../../domain/employee/entities';
import {Employee} from '../../../../domain/employee/entities';
import {EmployeePositionId} from '../../../../domain/employee-position/entities';
import {Gender, PersonType} from '../../../../domain/person/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {EmployeeDto} from '../../dtos';
import type {
    CreateEmployeeService,
    DeleteEmployeeService,
    GetEmployeeService,
    ListEmployeeService,
    UpdateEmployeeService,
} from '../../services';
import {EmployeeController} from '../index';

describe('An employee controller', () => {
    const createEmployeeServiceMock = mock<CreateEmployeeService>();
    const getEmployeeServiceMock = mock<GetEmployeeService>();
    const listEmployeeServiceMock = mock<ListEmployeeService>();
    const deleteEmployeeServiceMock = mock<DeleteEmployeeService>();
    const updateEmployeeServiceMock = mock<UpdateEmployeeService>();
    const employeeController = new EmployeeController(
        createEmployeeServiceMock,
        listEmployeeServiceMock,
        getEmployeeServiceMock,
        updateEmployeeServiceMock,
        deleteEmployeeServiceMock
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating an employee', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: CreateEmployee = {
                name: 'name',
                positionId: EmployeePositionId.generate(),
                companyId: CompanyId.generate(),
                phone: Phone.create('61999999999'),
                companyName: null,
                personType: PersonType.NATURAL,
                documentId: DocumentId.create('15785065178'),
                gender: Gender.MALE,
                allowSystemAccess: false,
            };

            const expectedEmployee = new EmployeeDto(Employee.create(payload));

            jest.spyOn(createEmployeeServiceMock, 'execute').mockResolvedValueOnce(expectedEmployee);

            await expect(employeeController.createEmployee(actor, payload)).resolves.toEqual(expectedEmployee);

            expect(createEmployeeServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getEmployeeServiceMock.execute).not.toHaveBeenCalled();
            expect(listEmployeeServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteEmployeeServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting an employee', () => {
        it('should repass the responsibility to the right service', async () => {
            const employee = Employee.create({
                name: 'name',
                positionId: EmployeePositionId.generate(),
                documentId: DocumentId.create('15785065178'),
                companyId: CompanyId.generate(),
                companyName: null,
                personType: PersonType.NATURAL,
                phone: Phone.create('61999999999'),
                gender: Gender.MALE,
                allowSystemAccess: false,
            });

            const expectedEmployee = new EmployeeDto(employee);

            jest.spyOn(getEmployeeServiceMock, 'execute').mockResolvedValueOnce(expectedEmployee);

            await expect(employeeController.getEmployee(actor, employee.id)).resolves.toEqual(expectedEmployee);

            expect(getEmployeeServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: employee.id}});
        });
    });

    describe('when listing employee', () => {
        it('should repass the responsibility to the right service', async () => {
            const companyId = CompanyId.generate();
            const positionId = EmployeePositionId.generate();
            const payload = {
                companyId,
                name: 'name',
                pagination: {
                    limit: 10,
                },
            };
            const employees = [
                Employee.create({
                    name: 'name',
                    documentId: DocumentId.create('15785065178'),
                    companyId,
                    companyName: null,
                    personType: PersonType.NATURAL,
                    positionId,
                    phone: Phone.create('61999999999'),
                    gender: Gender.MALE,
                    allowSystemAccess: false,
                }),
                Employee.create({
                    name: 'name 2',
                    documentId: DocumentId.create('15785065111'),
                    companyId,
                    companyName: null,
                    personType: PersonType.NATURAL,
                    positionId,
                    phone: Phone.create('61999999999'),
                    gender: Gender.MALE,
                    allowSystemAccess: true,
                    userId: UserId.generate(),
                }),
            ];
            const expectedResult: PaginatedDto<EmployeeDto> = {
                data: employees.map((employee) => new EmployeeDto(employee)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listEmployeeServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(employeeController.listEmployee(actor, payload)).resolves.toEqual(expectedResult);

            expect(listEmployeeServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when updating an employee', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingEmployee = Employee.create({
                name: 'name',
                documentId: DocumentId.create('15785065178'),
                companyId: CompanyId.generate(),
                positionId: EmployeePositionId.generate(),
                personType: PersonType.NATURAL,
                phone: Phone.create('61999999999'),
                allowSystemAccess: true,
                userId: UserId.generate(),
            });
            const payload = {
                name: 'name',
            };

            const expectedEmployee = new EmployeeDto(existingEmployee);

            jest.spyOn(updateEmployeeServiceMock, 'execute').mockResolvedValueOnce(expectedEmployee);

            await expect(employeeController.updateEmployee(actor, existingEmployee.id, payload)).resolves.toEqual(
                expectedEmployee
            );

            expect(updateEmployeeServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingEmployee.id, ...payload},
            });
        });
    });

    describe('when delete an employee', () => {
        it('should repass the responsibility to the right service', async () => {
            const employee = Employee.create({
                name: 'name',
                positionId: EmployeePositionId.generate(),
                documentId: DocumentId.create('15785065178'),
                companyId: CompanyId.generate(),
                companyName: null,
                personType: PersonType.NATURAL,
                phone: Phone.create('61999999999'),
                gender: Gender.MALE,
                allowSystemAccess: true,
                userId: UserId.generate(),
            });

            await employeeController.deleteEmployee(actor, employee.id);

            expect(createEmployeeServiceMock.execute).not.toHaveBeenCalled();
            expect(getEmployeeServiceMock.execute).not.toHaveBeenCalled();
            expect(listEmployeeServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteEmployeeServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: employee.id}});
        });
    });
});
