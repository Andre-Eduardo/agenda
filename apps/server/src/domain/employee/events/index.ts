import {EmployeeChangedEvent} from './employee-changed.event';
import {EmployeeCreatedEvent} from './employee-created.event';
import {EmployeeDeletedEvent} from './employee-deleted.event';

export * from './employee-changed.event';
export * from './employee-created.event';
export * from './employee-deleted.event';

export const employeeEvents = [EmployeeChangedEvent, EmployeeCreatedEvent, EmployeeDeletedEvent];
