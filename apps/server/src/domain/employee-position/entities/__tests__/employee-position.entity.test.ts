import {InvalidInputException} from '../../../@shared/exceptions';
import {CashierPermission, RoomPermission} from '../../../auth';
import {CompanyId} from '../../../company/entities';
import {EmployeePositionChangedEvent, EmployeePositionCreatedEvent, EmployeePositionDeletedEvent} from '../../events';
import {EmployeePosition, EmployeePositionId} from '../employee-position.entity';
import {fakeEmployeePosition} from './fake-employee-position';

describe('An employee position', () => {
    const now = new Date();
    const companyId = CompanyId.generate();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit an employee-position-created event', () => {
            const name = 'Manager';

            const employeePosition = EmployeePosition.create({
                companyId,
                name,
                permissions: new Set([RoomPermission.VIEW, RoomPermission.UPDATE, CashierPermission.OPEN]),
            });

            expect(employeePosition.name).toBe(name);

            expect(employeePosition.events).toEqual([
                {
                    type: EmployeePositionCreatedEvent.type,
                    companyId: employeePosition.companyId,
                    timestamp: now,
                    employeePosition,
                },
            ]);
            expect(employeePosition.events[0]).toBeInstanceOf(EmployeePositionCreatedEvent);
        });

        it('should throw an error when receiving invalid value', () => {
            expect(() =>
                EmployeePosition.create({
                    companyId,
                    name: '',
                    permissions: new Set([RoomPermission.VIEW, RoomPermission.UPDATE, CashierPermission.OPEN]),
                })
            ).toThrowWithMessage(InvalidInputException, 'Employee position name must be at least 1 character long.');
        });
    });

    describe('on change', () => {
        it('should emit an employee-position-changed event', () => {
            const employeePosition = fakeEmployeePosition({
                companyId,
            });

            const oldEmployeePosition = fakeEmployeePosition(employeePosition);

            employeePosition.change({
                name: 'Admin',
                permissions: new Set([RoomPermission.UPDATE]),
            });

            expect(employeePosition.name).toBe('Admin');
            expect(employeePosition.permissions).toEqual(new Set([RoomPermission.UPDATE]));
            expect(employeePosition.events).toEqual([
                {
                    type: EmployeePositionChangedEvent.type,
                    companyId,
                    timestamp: now,
                    oldState: oldEmployeePosition,
                    newState: employeePosition,
                },
            ]);

            expect(employeePosition.events[0]).toBeInstanceOf(EmployeePositionChangedEvent);
        });

        it('should throw an error when receiving invalid value', () => {
            const employeePosition = fakeEmployeePosition();

            expect(() => employeePosition.change({name: ''})).toThrowWithMessage(
                InvalidInputException,
                'Employee position name must be at least 1 character long.'
            );
        });
    });

    it('should be serializable', () => {
        const employeePosition = fakeEmployeePosition({
            name: 'Manager',
            companyId,
            permissions: new Set([RoomPermission.VIEW, RoomPermission.UPDATE, CashierPermission.OPEN]),
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        expect(employeePosition.toJSON()).toEqual({
            id: employeePosition.id.toString(),
            companyId: companyId.toJSON(),
            name: 'Manager',
            permissions: [RoomPermission.VIEW, RoomPermission.UPDATE, CashierPermission.OPEN],
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });

    describe('on deletion', () => {
        it('should emit an employee-position-deleted event', () => {
            const employeePosition = fakeEmployeePosition({
                companyId,
            });

            employeePosition.delete();

            expect(employeePosition.events).toEqual([
                {
                    type: EmployeePositionDeletedEvent.type,
                    timestamp: now,
                    companyId,
                    employeePosition,
                },
            ]);

            expect(employeePosition.events[0]).toBeInstanceOf(EmployeePositionDeletedEvent);
        });
    });

    describe('An employee position ID', () => {
        it('can be created from a string', () => {
            const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
            const id = EmployeePositionId.from(uuid);

            expect(id.toString()).toBe(uuid);
        });

        it('can be generated', () => {
            expect(EmployeePositionId.generate()).toBeInstanceOf(EmployeePositionId);
        });
    });
});
