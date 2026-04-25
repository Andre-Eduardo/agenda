import {ClinicMemberCreatedEvent} from './clinic-member-created.event';
import {ClinicMemberChangedEvent} from './clinic-member-changed.event';
import {ClinicMemberDeletedEvent} from './clinic-member-deleted.event';

export * from './clinic-member-created.event';
export * from './clinic-member-changed.event';
export * from './clinic-member-deleted.event';

export const clinicMemberEvents = [
    ClinicMemberCreatedEvent,
    ClinicMemberChangedEvent,
    ClinicMemberDeletedEvent,
];
