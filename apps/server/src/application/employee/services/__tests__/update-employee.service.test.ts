import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {DocumentId} from '../../../../domain/@shared/value-objects';
import {GlobalRole, RoomPermission} from '../../../../domain/auth';
import {CompanyId} from '../../../../domain/company/entities';
import type {EmployeeRepository} from '../../../../domain/employee/employee.repository';
import {fakeEmployee} from '../../../../domain/employee/entities/__tests__/fake-employee';
import {EmployeeChangedEvent} from '../../../../domain/employee/events';
import type {EmployeePositionRepository} from '../../../../domain/employee-position/employee-position.repository';
import {EmployeePosition} from '../../../../domain/employee-position/entities';
import {fakeEmployeePosition} from '../../../../domain/employee-position/entities/__tests__/fake-employee-position';
import type {EventDispatcher} from '../../../../domain/event';
import {PersonId, PersonProfile} from '../../../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../../../domain/person/person.exceptions';
import {type CreateUser, User, UserId} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import {UserChangedEvent, UserCompanyRemovedEvent} from '../../../../domain/user/events';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {ObfuscatedPassword, Username} from '../../../../domain/user/value-objects';
import {EmployeeDto, type UpdateEmployeeDto} from '../../dtos';
import {UpdateEmployeeService} from '../update-employee.service';

describe('An update-employee service', () => {
    const userRepository = mock<UserRepository>();
    const employeeRepository = mock<EmployeeRepository>();
    const employeePositionRepository = mock<EmployeePositionRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateEmployeeService = new UpdateEmployeeService(
        userRepository,
        employeeRepository,
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

    it('should update an employee', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const existingEmployee = fakeEmployee({
            companyId,
        });

        const oldEmployee = fakeEmployee(existingEmployee);

        const payload: UpdateEmployeeDto = {
            id: existingEmployee.id,
            name: 'New name',
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);

        const updatedEmployee = fakeEmployee({
            ...existingEmployee,
            ...payload,
            updatedAt: now,
        });

        await expect(updateEmployeeService.execute({actor, payload})).resolves.toEqual(
            new EmployeeDto(updatedEmployee)
        );

        expect(existingEmployee.name).toBe(payload.name);
        expect(existingEmployee.updatedAt).toEqual(now);
        expect(existingEmployee.events).toHaveLength(1);
        expect(existingEmployee.events[0]).toBeInstanceOf(EmployeeChangedEvent);
        expect(existingEmployee.events).toEqual([
            {
                type: EmployeeChangedEvent.type,
                companyId: existingEmployee.companyId,
                timestamp: now,
                oldState: oldEmployee,
                newState: existingEmployee,
            },
        ]);
        expect(employeeRepository.save).toHaveBeenCalledWith(existingEmployee);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingEmployee);
    });

    it('should update an employee allowing system access', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const userPayload = {
            companies: [companyId],
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
            firstName: 'John',
            lastName: null,
        } satisfies CreateUser;

        const user = fakeUser({
            ...userPayload,
            id: UserId.generate(),
            email: null,
            globalRole: GlobalRole.NONE,
            password: await ObfuscatedPassword.obfuscate(userPayload.password),
            createdAt: now,
            updatedAt: now,
        });

        const existingEmployee = fakeEmployee({
            name: 'John',
            profiles: new Set([PersonProfile.EMPLOYEE]),
            positionId: position.id,
            companyId,
            allowSystemAccess: false,
        });

        const oldEmployee = fakeEmployee(existingEmployee);

        const payload: UpdateEmployeeDto = {
            id: existingEmployee.id,
            allowSystemAccess: true,
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);
        jest.spyOn(userRepository, 'findByEmployeeId').mockResolvedValueOnce(null);
        jest.spyOn(User, 'create').mockResolvedValueOnce(user);

        const updatedEmployee = fakeEmployee({
            ...existingEmployee,
            ...payload,
            userId: user.id,
            updatedAt: now,
        });

        await expect(updateEmployeeService.execute({actor, payload})).resolves.toEqual(
            new EmployeeDto(updatedEmployee)
        );

        expect(existingEmployee.allowSystemAccess).toBe(payload.allowSystemAccess);
        expect(existingEmployee.userId).toBe(user.id);
        expect(existingEmployee.updatedAt).toEqual(now);

        expect(User.create).toHaveBeenCalledWith(userPayload);

        expect(existingEmployee.events).toHaveLength(1);
        expect(existingEmployee.events[0]).toBeInstanceOf(EmployeeChangedEvent);
        expect(existingEmployee.events).toEqual([
            {
                type: EmployeeChangedEvent.type,
                companyId: existingEmployee.companyId,
                timestamp: now,
                oldState: oldEmployee,
                newState: existingEmployee,
            },
        ]);

        expect(userRepository.save).toHaveBeenCalledWith(user);
        expect(employeeRepository.save).toHaveBeenCalledWith(existingEmployee);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, user);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingEmployee);
    });

    it('should update the employee username', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const userPayload = {
            companies: [companyId],
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
            firstName: 'John',
            lastName: null,
        } satisfies CreateUser;

        const existingUser = fakeUser({
            ...userPayload,
            id: UserId.generate(),
            email: null,
            globalRole: GlobalRole.NONE,
            password: await ObfuscatedPassword.obfuscate(userPayload.password),
            createdAt: now,
            updatedAt: now,
        });

        const oldUser = fakeUser(existingUser);

        const existingEmployee = fakeEmployee({
            companyName: null,
            positionId: position.id,
            companyId,
            allowSystemAccess: true,
            userId: existingUser.id,
        });

        const oldEmployee = fakeEmployee(existingEmployee);

        const payload: UpdateEmployeeDto = {
            id: existingEmployee.id,
            allowSystemAccess: true,
            username: Username.create('john_doe123'),
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);
        jest.spyOn(userRepository, 'findByEmployeeId').mockResolvedValueOnce(existingUser);
        jest.spyOn(userRepository, 'findByUsername').mockResolvedValueOnce(null);
        jest.spyOn(User, 'create').mockResolvedValueOnce(existingUser);

        const updatedEmployee = fakeEmployee({
            ...existingEmployee,
            ...payload,
            updatedAt: now,
        });

        await expect(updateEmployeeService.execute({actor, payload})).resolves.toEqual(
            new EmployeeDto(updatedEmployee)
        );

        expect(existingEmployee.allowSystemAccess).toBe(payload.allowSystemAccess);
        expect(existingEmployee.userId).toBe(existingUser.id);
        expect(existingEmployee.updatedAt).toEqual(now);

        expect(existingEmployee.events).toHaveLength(1);
        expect(existingEmployee.events[0]).toBeInstanceOf(EmployeeChangedEvent);
        expect(existingEmployee.events).toEqual([
            {
                type: EmployeeChangedEvent.type,
                companyId: existingEmployee.companyId,
                timestamp: now,
                oldState: oldEmployee,
                newState: existingEmployee,
            },
        ]);

        expect(existingUser.events).toHaveLength(1);
        expect(existingUser.events[0]).toBeInstanceOf(UserChangedEvent);
        expect(existingUser.events).toEqual([
            {
                type: UserChangedEvent.type,
                timestamp: now,
                oldState: oldUser,
                newState: existingUser,
            },
        ]);

        expect(userRepository.save).toHaveBeenCalledWith(existingUser);
        expect(employeeRepository.save).toHaveBeenCalledWith(existingEmployee);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingUser);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingEmployee);
    });

    it('should remove the system access from an employee', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const userPayload = {
            companies: [companyId],
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
            firstName: 'John',
            lastName: null,
        } satisfies CreateUser;

        const existingUser = fakeUser({
            ...userPayload,
            id: UserId.generate(),
            email: null,
            globalRole: GlobalRole.NONE,
            password: await ObfuscatedPassword.obfuscate(userPayload.password),
            createdAt: now,
            updatedAt: now,
        });

        const existingEmployee = fakeEmployee({
            positionId: position.id,
            companyId,
            allowSystemAccess: true,
            userId: existingUser.id,
        });

        const oldEmployee = fakeEmployee(existingEmployee);

        const payload: UpdateEmployeeDto = {
            id: existingEmployee.id,
            allowSystemAccess: false,
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);
        jest.spyOn(userRepository, 'findByEmployeeId').mockResolvedValueOnce(existingUser);
        jest.spyOn(userRepository, 'findByUsername').mockResolvedValueOnce(null);
        jest.spyOn(User, 'create').mockResolvedValueOnce(existingUser);

        const updatedEmployee = fakeEmployee({
            ...existingEmployee,
            ...payload,
            updatedAt: now,
        });

        await expect(updateEmployeeService.execute({actor, payload})).resolves.toEqual(
            new EmployeeDto(updatedEmployee)
        );

        expect(existingEmployee.allowSystemAccess).toBe(payload.allowSystemAccess);
        expect(existingEmployee.userId).toBe(null);
        expect(existingEmployee.updatedAt).toEqual(now);

        expect(existingEmployee.events).toHaveLength(1);
        expect(existingEmployee.events[0]).toBeInstanceOf(EmployeeChangedEvent);
        expect(existingEmployee.events).toEqual([
            {
                type: EmployeeChangedEvent.type,
                companyId: existingEmployee.companyId,
                timestamp: now,
                oldState: oldEmployee,
                newState: existingEmployee,
            },
        ]);

        expect(existingUser.events).toHaveLength(1);
        expect(existingUser.events[0]).toBeInstanceOf(UserCompanyRemovedEvent);
        expect(existingUser.events).toEqual([
            {
                type: UserCompanyRemovedEvent.type,
                timestamp: now,
                companyId,
                userId: existingUser.id,
            },
        ]);

        expect(userRepository.save).toHaveBeenCalledWith(existingUser);
        expect(employeeRepository.save).toHaveBeenCalledWith(existingEmployee);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingUser);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingEmployee);
    });

    it('should fail to update an employee with a document ID already in use', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const existingEmployee = fakeEmployee({
            positionId: position.id,
            companyId,
        });

        const payload: UpdateEmployeeDto = {
            id: existingEmployee.id,
            name: 'employee name',
            documentId: DocumentId.create('12345678901'),
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);
        jest.spyOn(employeeRepository, 'save').mockRejectedValue(
            new DuplicateDocumentIdException('Duplicate employee document ID.')
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        await expect(updateEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update an employee with a document ID already in use.'
        );
    });

    it('should throw an error when failing to update the employee', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const existingEmployee = fakeEmployee({
            companyId,
        });

        const payload: UpdateEmployeeDto = {
            id: existingEmployee.id,
            name: 'employee name',
            documentId: DocumentId.create('12345678901'),
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);
        jest.spyOn(employeeRepository, 'save').mockRejectedValue(new Error('generic error'));

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        await expect(updateEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'generic error'
        );
    });

    it('should throw an error when the employee does not exist', async () => {
        const payload: UpdateEmployeeDto = {
            id: PersonId.generate(),
            name: 'New name',
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Employee not found'
        );
    });

    it.each([
        null,
        fakeEmployeePosition({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        }),
    ])(
        'should throw an error when updating the employee with an employee position that does not exist',
        async (employeePosition) => {
            const existingEmployee = fakeEmployee({
                companyId,
                allowSystemAccess: false,
            });

            const position = EmployeePosition.create({
                name: 'Employee Position',
                permissions: new Set([RoomPermission.VIEW]),
                companyId: CompanyId.generate(),
            });

            jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

            const payload: UpdateEmployeeDto = {
                id: existingEmployee.id,
                name: 'employee name',
                documentId: DocumentId.create('12345678901'),
                positionId: position.id,
            };

            jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);

            jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(employeePosition);

            await expect(updateEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
                ResourceNotFoundException,
                'Employee position not found'
            );
        }
    );

    it.each([
        {
            username: null,
            password: '@SecurePassword123',
        },
        {
            username: Username.create('john_doe'),
            password: null,
        },
    ])('should fail to update an employee allowing system access without user credentials', async (credentials) => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const userPayload = {
            companies: [companyId],
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
            firstName: 'John',
            lastName: null,
        } satisfies CreateUser;

        const user = fakeUser({
            ...userPayload,
            id: UserId.generate(),
            email: null,
            globalRole: GlobalRole.NONE,
            password: await ObfuscatedPassword.obfuscate(userPayload.password),
            createdAt: now,
            updatedAt: now,
        });

        const existingEmployee = fakeEmployee({
            positionId: position.id,
            companyId,
            allowSystemAccess: false,
        });

        const payload: UpdateEmployeeDto = {
            id: existingEmployee.id,
            allowSystemAccess: true,
            ...credentials,
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);
        jest.spyOn(userRepository, 'findByEmployeeId').mockResolvedValueOnce(null);
        jest.spyOn(User, 'create').mockResolvedValueOnce(user);

        await expect(updateEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'The username and password are required to allow system access.'
        );

        expect(userRepository.save).not.toHaveBeenCalled();
        expect(employeeRepository.save).not.toHaveBeenCalled();
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should fail to update the employee with a username already in use', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const userPayload = {
            companies: [companyId],
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
            firstName: 'John',
            lastName: null,
        } satisfies CreateUser;

        const existingUser = fakeUser({
            ...userPayload,
            id: UserId.generate(),
            email: null,
            globalRole: GlobalRole.NONE,
            password: await ObfuscatedPassword.obfuscate(userPayload.password),
            createdAt: now,
            updatedAt: now,
        });
        const anotherUser = fakeUser({
            id: UserId.generate(),
            username: Username.create('john_doe123'),
            password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
            email: null,
            firstName: 'John',
            lastName: null,
            globalRole: GlobalRole.NONE,
            companies: [companyId],
            createdAt: now,
            updatedAt: now,
        });

        const existingEmployee = fakeEmployee({
            positionId: position.id,
            companyId,
            allowSystemAccess: true,
            userId: existingUser.id,
        });

        const payload: UpdateEmployeeDto = {
            id: existingEmployee.id,
            allowSystemAccess: true,
            username: Username.create('john_doe123'),
        };

        jest.spyOn(employeeRepository, 'findById').mockResolvedValueOnce(existingEmployee);
        jest.spyOn(userRepository, 'findByEmployeeId').mockResolvedValueOnce(existingUser);
        jest.spyOn(userRepository, 'findByUsername').mockResolvedValueOnce(anotherUser);
        jest.spyOn(User, 'create').mockResolvedValueOnce(existingUser);

        await expect(updateEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update the user with a username already in use.'
        );

        expect(userRepository.save).not.toHaveBeenCalled();
        expect(employeeRepository.save).not.toHaveBeenCalled();
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
