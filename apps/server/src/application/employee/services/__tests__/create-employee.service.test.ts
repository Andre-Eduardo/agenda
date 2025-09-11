import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {GlobalRole, RoomPermission} from '../../../../domain/auth';
import {CompanyId} from '../../../../domain/company/entities';
import type {EmployeeRepository} from '../../../../domain/employee/employee.repository';
import {Employee} from '../../../../domain/employee/entities';
import {fakeEmployee} from '../../../../domain/employee/entities/__tests__/fake-employee';
import {EmployeeCreatedEvent} from '../../../../domain/employee/events';
import type {EmployeePositionRepository} from '../../../../domain/employee-position/employee-position.repository';
import {EmployeePosition, EmployeePositionId} from '../../../../domain/employee-position/entities';
import {fakeEmployeePosition} from '../../../../domain/employee-position/entities/__tests__/fake-employee-position';
import type {EventDispatcher} from '../../../../domain/event';
import {Gender, PersonId, PersonProfile, PersonType} from '../../../../domain/person/entities';
import {fakePerson} from '../../../../domain/person/entities/__tests__/fake-person';
import {DuplicateDocumentIdException} from '../../../../domain/person/person.exceptions';
import type {PersonRepository} from '../../../../domain/person/person.repository';
import type {CreateUser} from '../../../../domain/user/entities';
import {User, UserId} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import {DuplicateEmailException, DuplicateUsernameException} from '../../../../domain/user/user.exceptions';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {ObfuscatedPassword, Username} from '../../../../domain/user/value-objects';
import {type CreateEmployeeDto, EmployeeDto} from '../../dtos';
import {CreateEmployeeService} from '../index';

describe('A create-employee service', () => {
    const userRepository = mock<UserRepository>();
    const personRepository = mock<PersonRepository>();
    const employeeRepository = mock<EmployeeRepository>();
    const employeePositionRepository = mock<EmployeePositionRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createEmployeeService = new CreateEmployeeService(
        userRepository,
        personRepository,
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

    it('should create an employee', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        const employeePayload: CreateEmployeeDto = {
            name: 'employee name',
            documentId: DocumentId.create('12345678901'),
            companyId,
            positionId: position.id,
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
            allowSystemAccess: false,
        };

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const employee = Employee.create(employeePayload);

        jest.spyOn(Employee, 'create').mockReturnValue(employee);

        await expect(createEmployeeService.execute({actor, payload: employeePayload})).resolves.toEqual(
            new EmployeeDto(employee)
        );

        expect(Employee.create).toHaveBeenCalledWith(employeePayload);

        expect(employee.events[0]).toBeInstanceOf(EmployeeCreatedEvent);
        expect(employee.events).toEqual([
            {
                type: EmployeeCreatedEvent.type,
                timestamp: now,
                companyId: employee.companyId,
                employee,
            },
        ]);

        expect(userRepository.save).not.toHaveBeenCalled();
        expect(employeeRepository.save).toHaveBeenCalledWith(employee);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, employee);
    });

    it('should create an employee from an existing person', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const personId = PersonId.generate();
        const payload: CreateEmployeeDto = {
            id: personId,
            positionId: position.id,
            allowSystemAccess: false,
        };
        const existingPerson = fakePerson({
            id: personId,
            companyId,
        });

        const employee = Employee.createFromPerson(existingPerson, payload);

        jest.spyOn(personRepository, 'findById').mockResolvedValueOnce(existingPerson);
        jest.spyOn(Employee, 'createFromPerson').mockReturnValue(employee);

        await expect(createEmployeeService.execute({actor, payload})).resolves.toEqual(new EmployeeDto(employee));

        expect(Employee.createFromPerson).toHaveBeenCalledWith(existingPerson, payload);

        expect(employee.events[0]).toBeInstanceOf(EmployeeCreatedEvent);
        expect(employee.events).toEqual([
            {
                type: EmployeeCreatedEvent.type,
                timestamp: now,
                companyId: employee.companyId,
                employee,
            },
        ]);

        expect(userRepository.save).not.toHaveBeenCalled();
        expect(employeeRepository.save).toHaveBeenCalledWith(employee);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, employee);
    });

    it('should create an employee with system access', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        const userPayload = {
            companies: [companyId],
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
            firstName: 'John',
            lastName: 'Doe',
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

        const employeePayload = {
            name: 'John Doe',
            documentId: DocumentId.create('12345678901'),
            companyId,
            positionId: position.id,
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
            allowSystemAccess: true,
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
        } satisfies CreateEmployeeDto;

        const employee = fakeEmployee({
            ...employeePayload,
            profiles: new Set([PersonProfile.EMPLOYEE]),
            userId: user.id,
            createdAt: now,
            updatedAt: now,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        jest.spyOn(Employee, 'create').mockReturnValue(employee);
        jest.spyOn(User, 'create').mockResolvedValueOnce(user);

        await expect(createEmployeeService.execute({actor, payload: employeePayload})).resolves.toEqual(
            new EmployeeDto(employee)
        );

        expect(User.create).toHaveBeenCalledWith(userPayload);
        expect(Employee.create).toHaveBeenCalledWith({...employeePayload, userId: user.id});

        expect(userRepository.save).toHaveBeenCalledWith(user);
        expect(employeeRepository.save).toHaveBeenCalledWith(employee);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, user);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, employee);
    });

    it('should create an employee with system access from an existing person', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        const userPayload = {
            companies: [companyId],
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
            firstName: 'John',
            lastName: null,
        } satisfies CreateUser;

        const user = fakeUser({
            ...userPayload,
            email: null,
            globalRole: GlobalRole.NONE,
            password: await ObfuscatedPassword.obfuscate(userPayload.password),
            createdAt: now,
            updatedAt: now,
        });

        const existingPerson = fakePerson({
            name: 'John',
            documentId: DocumentId.create('12345678901'),
            profiles: new Set([PersonProfile.CUSTOMER]),
            personType: PersonType.NATURAL,
            gender: Gender.MALE,
            companyId,
            phone: Phone.create('12345678901'),
        });

        const employeePayload = {
            id: existingPerson.id,
            positionId: position.id,
            allowSystemAccess: true,
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
        } satisfies CreateEmployeeDto;

        const employee = Employee.createFromPerson(existingPerson, {
            ...employeePayload,
            userId: user.id,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);
        jest.spyOn(personRepository, 'findById').mockResolvedValueOnce(existingPerson);
        jest.spyOn(Employee, 'createFromPerson').mockReturnValue(employee);
        jest.spyOn(User, 'create').mockResolvedValueOnce(user);

        await expect(createEmployeeService.execute({actor, payload: employeePayload})).resolves.toEqual(
            new EmployeeDto(employee)
        );

        expect(User.create).toHaveBeenCalledWith(userPayload);
        expect(Employee.createFromPerson).toHaveBeenCalledWith(existingPerson, {...employeePayload, userId: user.id});

        expect(employee.events[0]).toBeInstanceOf(EmployeeCreatedEvent);
        expect(employee.events).toEqual([
            {
                type: EmployeeCreatedEvent.type,
                timestamp: now,
                companyId: employee.companyId,
                employee,
            },
        ]);

        expect(userRepository.save).toHaveBeenCalledWith(user);
        expect(employeeRepository.save).toHaveBeenCalledWith(employee);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, user);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, employee);
    });

    it('should fail to create an employee from a person that is already an employee', async () => {
        const personId = PersonId.generate();
        const payload: CreateEmployeeDto = {
            id: personId,
            positionId: EmployeePositionId.generate(),
            allowSystemAccess: false,
        };
        const existingPerson = fakePerson({
            id: personId,
            companyId,
            profiles: new Set([PersonProfile.EMPLOYEE]),
        });

        jest.spyOn(personRepository, 'findById').mockResolvedValueOnce(existingPerson);

        await expect(createEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'The person is already an employee.'
        );
    });

    it('should throw an error when the person does not exist', async () => {
        const payload: CreateEmployeeDto = {
            id: PersonId.generate(),
            positionId: EmployeePositionId.generate(),
            allowSystemAccess: false,
        };

        jest.spyOn(personRepository, 'findById').mockResolvedValueOnce(null);

        await expect(createEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Person not found'
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
    ])('should throw an error when the employee position does not exist', async (employeePosition) => {
        const payload: CreateEmployeeDto = {
            name: 'employee name',
            documentId: DocumentId.create('12345678901'),
            companyId,
            positionId: EmployeePositionId.generate(),
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
            allowSystemAccess: false,
        };

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(employeePosition);

        await expect(createEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Employee position not found'
        );
    });

    it('should fail to create an employee with a duplicate document ID', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const payload: CreateEmployeeDto = {
            name: 'employee name',
            documentId: DocumentId.create('12345678901'),
            companyId,
            positionId: position.id,
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
            allowSystemAccess: false,
        };

        jest.spyOn(employeeRepository, 'save').mockRejectedValue(
            new DuplicateDocumentIdException('Duplicate employee document ID.')
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        await expect(createEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create an employee with a document ID already in use.'
        );
    });

    it('should throw an error when failing to save the employee', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);

        const payload: CreateEmployeeDto = {
            name: 'employee name',
            documentId: DocumentId.create('12345678901'),
            companyId,
            positionId: position.id,
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
            allowSystemAccess: false,
        };

        jest.spyOn(Employee, 'create').mockReturnValueOnce(Employee.create(payload));
        jest.spyOn(employeeRepository, 'save').mockRejectedValue(new Error('generic error'));

        await expect(createEmployeeService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'generic error'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it.each([
        {
            username: null,
            password: '@SecurePassword123',
        },
        {
            username: Username.create('john_doe'),
            password: null,
        },
    ])('should fail to create an employee with system access without user credentials', async (credentials) => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        const employeePayload = {
            name: 'John Doe',
            documentId: DocumentId.create('12345678901'),
            companyId,
            positionId: position.id,
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
            allowSystemAccess: true,
            ...credentials,
        } satisfies CreateEmployeeDto;

        await expect(createEmployeeService.execute({actor, payload: employeePayload})).rejects.toThrowWithMessage(
            PreconditionException,
            'The username and password are required to allow system access.'
        );

        expect(userRepository.save).not.toHaveBeenCalled();
        expect(employeeRepository.save).not.toHaveBeenCalled();
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should fail to create an employee with system access with a username already in use', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        const userPayload = {
            companies: [companyId],
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
            firstName: 'John',
            lastName: 'Doe',
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

        const employeePayload = {
            name: 'John Doe',
            documentId: DocumentId.create('12345678901'),
            companyId,
            positionId: position.id,
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
            allowSystemAccess: true,
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
        } satisfies CreateEmployeeDto;

        const employee = fakeEmployee({
            ...employeePayload,
            id: PersonId.generate(),
            profiles: new Set([PersonProfile.EMPLOYEE]),
            userId: user.id,
            createdAt: now,
            updatedAt: now,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);
        jest.spyOn(Employee, 'create').mockReturnValue(employee);
        jest.spyOn(User, 'create').mockResolvedValueOnce(user);
        jest.spyOn(userRepository, 'save').mockRejectedValueOnce(new DuplicateUsernameException('Duplicate username.'));

        await expect(createEmployeeService.execute({actor, payload: employeePayload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a user with a username already in use.'
        );

        expect(User.create).toHaveBeenCalledWith(userPayload);
        expect(Employee.create).toHaveBeenCalledWith({...employeePayload, userId: user.id});

        expect(userRepository.save).toHaveBeenCalledWith(user);
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should fail to create an employee with system access with a email already in use', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        const userPayload = {
            companies: [companyId],
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
            firstName: 'John',
            lastName: 'Doe',
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

        const employeePayload = {
            name: 'John Doe',
            documentId: DocumentId.create('12345678901'),
            companyId,
            positionId: position.id,
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
            allowSystemAccess: true,
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
        } satisfies CreateEmployeeDto;

        const employee = fakeEmployee({
            ...employeePayload,
            profiles: new Set([PersonProfile.EMPLOYEE]),
            userId: user.id,
            createdAt: now,
            updatedAt: now,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);
        jest.spyOn(Employee, 'create').mockReturnValue(employee);
        jest.spyOn(User, 'create').mockResolvedValueOnce(user);
        jest.spyOn(userRepository, 'save').mockRejectedValueOnce(new DuplicateEmailException('Duplicate username.'));

        await expect(createEmployeeService.execute({actor, payload: employeePayload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a user with an email already in use.'
        );

        expect(User.create).toHaveBeenCalledWith(userPayload);
        expect(Employee.create).toHaveBeenCalledWith({...employeePayload, userId: user.id});

        expect(userRepository.save).toHaveBeenCalledWith(user);
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the user', async () => {
        const position = EmployeePosition.create({
            name: 'Employee Position',
            permissions: new Set([RoomPermission.VIEW]),
            companyId,
        });

        const userPayload = {
            companies: [companyId],
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
            firstName: 'John',
            lastName: 'Doe',
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

        const employeePayload = {
            name: 'John Doe',
            documentId: DocumentId.create('12345678901'),
            companyId,
            positionId: position.id,
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
            allowSystemAccess: true,
            username: Username.create('john_doe'),
            password: '@SecurePassword123',
        } satisfies CreateEmployeeDto;

        const employee = fakeEmployee({
            ...employeePayload,
            profiles: new Set([PersonProfile.EMPLOYEE]),
            userId: user.id,
            createdAt: now,
            updatedAt: now,
        });

        jest.spyOn(employeePositionRepository, 'findById').mockResolvedValue(position);
        jest.spyOn(Employee, 'create').mockReturnValue(employee);
        jest.spyOn(User, 'create').mockResolvedValueOnce(user);
        jest.spyOn(userRepository, 'save').mockRejectedValueOnce(new Error('Unexpected error'));

        await expect(createEmployeeService.execute({actor, payload: employeePayload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );

        expect(User.create).toHaveBeenCalledWith(userPayload);
        expect(Employee.create).toHaveBeenCalledWith({...employeePayload, userId: user.id});

        expect(userRepository.save).toHaveBeenCalledWith(user);
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
