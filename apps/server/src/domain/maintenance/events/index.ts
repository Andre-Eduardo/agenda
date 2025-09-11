import {MaintenanceChangedEvent} from './maintenance-changed.event';
import {MaintenanceCreatedEvent} from './maintenance-created.event';
import {MaintenanceFinishedEvent} from './maintenance-finished.event';

export * from './maintenance-changed.event';
export * from './maintenance-created.event';
export * from './maintenance-finished.event';

export const maintenanceEvents = [MaintenanceCreatedEvent, MaintenanceChangedEvent, MaintenanceFinishedEvent];
