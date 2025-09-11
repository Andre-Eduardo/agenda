import {EmployeePositionChangedEvent} from './employee-position-changed.event';
import {EmployeePositionCreatedEvent} from './employee-position-created.event';
import {EmployeePositionDeletedEvent} from './employee-position-deleted.event';

export * from './employee-position-changed.event';
export * from './employee-position-created.event';
export * from './employee-position-deleted.event';

export const employeePositionEvents = [
    EmployeePositionCreatedEvent,
    EmployeePositionChangedEvent,
    EmployeePositionDeletedEvent,
];
