import {ClinicCreatedEvent} from './clinic-created.event';
import {ClinicChangedEvent} from './clinic-changed.event';
import {ClinicDeletedEvent} from './clinic-deleted.event';

export * from './clinic-created.event';
export * from './clinic-changed.event';
export * from './clinic-deleted.event';

export const clinicEvents = [ClinicCreatedEvent, ClinicChangedEvent, ClinicDeletedEvent];
