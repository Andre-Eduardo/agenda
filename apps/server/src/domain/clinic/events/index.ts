import {ClinicAccountTypeChangedEvent} from '@domain/clinic/events/clinic-account-type-changed.event';
import {ClinicChangedEvent} from '@domain/clinic/events/clinic-changed.event';
import {ClinicCreatedEvent} from '@domain/clinic/events/clinic-created.event';
import {ClinicDeletedEvent} from '@domain/clinic/events/clinic-deleted.event';

export * from '@domain/clinic/events/clinic-account-type-changed.event';
export * from '@domain/clinic/events/clinic-changed.event';
export * from '@domain/clinic/events/clinic-created.event';
export * from '@domain/clinic/events/clinic-deleted.event';

export const clinicEvents = [ClinicCreatedEvent, ClinicChangedEvent, ClinicDeletedEvent, ClinicAccountTypeChangedEvent];
