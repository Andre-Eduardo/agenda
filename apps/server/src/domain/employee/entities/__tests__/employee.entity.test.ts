import {DocumentId, Phone} from '../../../@shared/value-objects';
import {CompanyId} from '../../../company/entities';
import {EmployeePositionId} from '../../../employee-position/entities';
import {Gender, PersonProfile, PersonType} from '../../../person/entities';
import {fakePerson} from '../../../person/entities/__tests__/fake-person';
import {UserId} from '../../../user/entities';
import {EmployeeChangedEvent, EmployeeCreatedEvent, EmployeeDeletedEvent} from '../../events';
import {Employee} from '../employee.entity';
import {fakeEmployee} from './fake-employee';

describe('An employee', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit an employee-created event', () => {
            const employee = Employee.create({
                name: 'user',
                companyName: 'company',
                personType: PersonType.LEGAL,
                documentId: DocumentId.create('12345678901'),
                companyId: CompanyId.generate(),
                phone: Phone.create('12345678901'),
                positionId: EmployeePositionId.generate(),
                allowSystemAccess: true,
                userId: UserId.generate(),
            });

            expect(employee.name).toBe('user');
            expect(employee.companyName).toBe('company');
            expect(employee.personType).toBe(PersonType.LEGAL);
            expect(employee.documentId.toString()).toBe('12345678901');
            expect(employee.phone!.toString()).toBe('12345678901');
            expect(employee.profiles).toEqual(new Set([PersonProfile.EMPLOYEE]));
            expect(employee.allowSystemAccess).toEqual(true);

            expect(employee.events).toEqual([
                {
                    type: EmployeeCreatedEvent.type,
                    companyId: employee.companyId,
                    timestamp: now,
                    employee,
                },
            ]);
            expect(employee.events[0]).toBeInstanceOf(EmployeeCreatedEvent);
        });

        it('should create customer from person', () => {
            const person = fakePerson();

            const employee = Employee.createFromPerson(person, {
                positionId: EmployeePositionId.generate(),
                allowSystemAccess: false,
            });

            expect(employee.name).toBe(person.name);
            expect(employee.companyName).toBe(person.companyName);
            expect(employee.personType).toBe(person.personType);
            expect(employee.documentId).toBe(person.documentId);
            expect(employee.companyId).toBe(person.companyId);
            expect(employee.phone).toBe(person.phone);
            expect(employee.profiles).toEqual(new Set([...person.profiles, PersonProfile.EMPLOYEE]));
            expect(employee.positionId).toBeInstanceOf(EmployeePositionId);

            expect(employee.events).toEqual([
                {
                    type: EmployeeCreatedEvent.type,
                    companyId: employee.companyId,
                    timestamp: now,
                    employee,
                },
            ]);
            expect(employee.events[0]).toBeInstanceOf(EmployeeCreatedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            expect(() =>
                Employee.create({
                    name: 'user',
                    personType: PersonType.NATURAL,
                    documentId: DocumentId.create('12345678901'),
                    companyId: CompanyId.generate(),
                    positionId: EmployeePositionId.generate(),
                    allowSystemAccess: true,
                    userId: null,
                })
            ).toThrow('The user ID is required to allow system access.');
        });
    });

    describe('on change', () => {
        it('should emit an employee-changed event', () => {
            const employee = fakeEmployee({
                profiles: new Set([PersonProfile.CUSTOMER]),
            });

            const oldEmployee = fakeEmployee(employee);

            employee.change({
                name: 'new employee',
                personType: PersonType.NATURAL,
                profiles: employee.profiles.add(PersonProfile.EMPLOYEE),
                documentId: DocumentId.create('12345678111'),
                phone: Phone.create('12345678'),
                gender: Gender.FEMALE,
                positionId: EmployeePositionId.generate(),
            });

            expect(employee.name).toBe('new employee');
            expect(employee.documentId.toString()).toBe('12345678111');
            expect(employee.phone!.toString()).toBe('12345678');
            expect(employee.gender).toBe(Gender.FEMALE);
            expect(employee.personType).toBe(PersonType.NATURAL);
            expect(employee.profiles).toEqual(new Set([PersonProfile.CUSTOMER, PersonProfile.EMPLOYEE]));

            expect(employee.events).toEqual([
                {
                    type: EmployeeChangedEvent.type,
                    timestamp: now,
                    companyId: employee.companyId,
                    oldState: oldEmployee,
                    newState: employee,
                },
            ]);
            expect(employee.events[0]).toBeInstanceOf(EmployeeChangedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const employee = fakeEmployee();

            expect(() =>
                employee.change({
                    allowSystemAccess: true,
                    userId: null,
                })
            ).toThrow('The user ID is required to allow system access.');
        });
    });

    describe('on deletion', () => {
        it('should emit an employee-deleted event', () => {
            const employee = fakeEmployee();

            employee.delete();

            expect(employee.events).toEqual([
                {
                    type: EmployeeDeletedEvent.type,
                    timestamp: now,
                    companyId: employee.companyId,
                    employee,
                },
            ]);
            expect(employee.events[0]).toBeInstanceOf(EmployeeDeletedEvent);
        });
    });

    it.each([
        {
            personType: PersonType.LEGAL,
            companyName: 'company',
        },
        {
            companyName: null,
        },
        {
            personType: PersonType.LEGAL,
        },
        {
            personType: PersonType.NATURAL,
        },
        {
            phone: Phone.create('12345678'),
        },
        {
            phone: null,
        },
        {
            allowSystemAccess: true,
            userId: UserId.generate(),
        },
        {
            allowSystemAccess: false,
            userId: null,
        },
    ])('should be serializable', (values) => {
        const employee = fakeEmployee({
            name: 'john',
            profiles: new Set([PersonProfile.CUSTOMER]),
            documentId: DocumentId.create('12345678901'),
            personType: PersonType.NATURAL,
            phone: Phone.create('12345678'),
            allowSystemAccess: true,
            ...values,
        });

        expect(employee.toJSON()).toEqual({
            id: employee.id.toJSON(),
            name: 'john',
            companyName: employee.companyName,
            companyId: employee.companyId.toJSON(),
            profiles: ['CUSTOMER'],
            personType: employee.personType,
            documentId: '12345678901',
            positionId: employee.positionId.toJSON(),
            phone: employee.phone?.toJSON() ?? null,
            gender: employee.gender,
            allowSystemAccess: employee.allowSystemAccess,
            userId: employee.userId?.toJSON() ?? null,
            createdAt: employee.createdAt.toJSON(),
            updatedAt: employee.updatedAt.toJSON(),
        });
    });
});
